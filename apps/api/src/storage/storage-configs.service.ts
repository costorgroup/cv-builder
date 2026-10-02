import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { EntitlementService } from '../entitlements/entitlements.service.js';
import {
  StorageKind,
  type Prisma,
  type StorageConfig,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { decryptSecret, encryptSecret } from './credentials-cipher.js';
import {
  allowsLocalEndpoints,
  isLocalHost,
  isPrivateHost,
} from './network-guard.js';
import {
  S3Error,
  S3StorageProvider,
  type TS3Credentials,
  type TS3Settings,
} from './s3/s3-storage.provider.js';

/** What owners send to connect a bucket; keys only when setting or changing them. */
export type TStorageInput = {
  bucket: string;
  region: string;
  endpoint?: string;
  prefix?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

/** A connection as its owners see it: never the secret. */
export type TStorageView = {
  provider: 'S3';
  bucket: string;
  region: string;
  endpoint: string | null;
  prefix: string;
  /** The access key id's last characters, e.g. "…7EXA". */
  accessKey: string;
  verifiedAt: string | null;
  /** In use for new uploads: verified, and the plan still allows it. */
  active: boolean;
};

const BUCKET = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
const REGION = /^[a-z0-9-]{2,32}$/;
const PREFIX = /^[A-Za-z0-9!_.*'()/-]{0,200}$/;

/** Cleans and checks a bucket's settings; every problem at once. */
export const parseStorageSettings = (input: TStorageInput): TS3Settings => {
  const errors: string[] = [];
  const bucket = input.bucket?.trim() ?? '';
  const region = input.region?.trim() ?? '';
  if (!BUCKET.test(bucket)) errors.push('Bucket must be a valid bucket name');
  if (!REGION.test(region)) errors.push('Region must be like eu-central-1');
  let endpoint: string | undefined;
  if (input.endpoint?.trim()) {
    try {
      const url = new URL(input.endpoint.trim());
      const local = isLocalHost(url.hostname);
      if (local && allowsLocalEndpoints()) {
        endpoint = url.origin;
      } else if (url.protocol !== 'https:') {
        errors.push('Endpoint must be an https address');
      } else if (isPrivateHost(url.hostname)) {
        errors.push("Endpoint can't be a private or local address");
      } else {
        endpoint = url.origin;
      }
    } catch {
      errors.push('Endpoint must be an https address');
    }
  }
  let prefix = (input.prefix ?? '').trim().replace(/^\/+/, '');
  if (prefix && !prefix.endsWith('/')) prefix += '/';
  if (!PREFIX.test(prefix) || prefix.includes('..')) {
    errors.push('Folder may use letters, numbers and - _ . / only');
  }
  if (errors.length > 0) throw new BadRequestException(errors);
  return { bucket, region, endpoint, prefix };
};

/**
 * Organizations' own buckets: connecting, checking and disconnecting one,
 * and the provider for files kept there.
 */
@Injectable()
export class StorageConfigsService {
  private readonly logger = new Logger(StorageConfigsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementService,
    private readonly audit: AuditService,
  ) {}

  private async canUse(organizationId: string) {
    return (await this.entitlements.forOrganization(organizationId)).can(
      'storage.external',
    );
  }

  private view(config: StorageConfig, allowed: boolean): TStorageView {
    const settings = config.settings as TS3Settings;
    return {
      provider: 'S3',
      bucket: settings.bucket,
      region: settings.region,
      endpoint: settings.endpoint ?? null,
      prefix: settings.prefix ?? '',
      accessKey: `…${config.accessKeyHint}`,
      verifiedAt: config.verifiedAt?.toISOString() ?? null,
      active: allowed && !!config.verifiedAt,
    };
  }

  async get(organizationId: string): Promise<TStorageView | null> {
    const config = await this.prisma.storageConfig.findUnique({
      where: { organizationId },
    });
    return config && this.view(config, await this.canUse(organizationId));
  }

  /**
   * Connects (or changes) the bucket. It isn't used until it's checked, so a
   * mistake never loses an upload. Keys can be left out to keep the saved ones.
   */
  async save(organizationId: string, userId: string, input: TStorageInput) {
    (await this.entitlements.forOrganization(organizationId)).assertCan(
      'storage.external',
    );
    const settings = parseStorageSettings(input);
    const existing = await this.prisma.storageConfig.findUnique({
      where: { organizationId },
    });
    const accessKeyId = input.accessKeyId?.trim();
    const secretAccessKey = input.secretAccessKey?.trim();
    if ((!accessKeyId || !secretAccessKey) && !existing) {
      throw new BadRequestException('Enter the access key id and secret.');
    }
    if (!!accessKeyId !== !!secretAccessKey) {
      throw new BadRequestException(
        'Enter the access key id and its secret together.',
      );
    }
    const credentials =
      accessKeyId && secretAccessKey
        ? {
            credentialsEncrypted: encryptSecret({
              accessKeyId,
              secretAccessKey,
            } satisfies TS3Credentials),
            accessKeyHint: accessKeyId.slice(-4),
          }
        : {};

    const data = {
      provider: StorageKind.S3,
      settings: settings as Prisma.InputJsonObject,
      verifiedAt: null,
      ...credentials,
    };
    const config = existing
      ? await this.prisma.storageConfig.update({
          where: { organizationId },
          data,
        })
      : await this.prisma.storageConfig.create({
          data: {
            organizationId,
            ...data,
            credentialsEncrypted: credentials.credentialsEncrypted!,
            accessKeyHint: credentials.accessKeyHint!,
          },
        });
    await this.record(userId, organizationId, 'STORAGE_CONNECTED', {
      bucket: settings.bucket,
      region: settings.region,
      endpoint: settings.endpoint,
    });
    return this.view(config, true);
  }

  /**
   * Writes, reads back and deletes a test file. On success new uploads go
   * to the bucket; otherwise says what the bucket answered.
   */
  async verify(organizationId: string, userId: string) {
    const config = await this.prisma.storageConfig.findUnique({
      where: { organizationId },
    });
    if (!config) throw new NotFoundException('No storage connected.');
    try {
      await this.providerFrom(config).verify(organizationId);
    } catch (error) {
      const detail =
        error instanceof S3Error
          ? `${error.code}: ${error.message}`
          : error instanceof Error
            ? error.message
            : 'The bucket could not be reached.';
      this.logger.warn(`Storage check failed for ${organizationId}: ${detail}`);
      throw new BadRequestException(`The check failed. ${detail}`);
    }
    const verified = await this.prisma.storageConfig.update({
      where: { organizationId },
      data: { verifiedAt: new Date() },
    });
    await this.record(userId, organizationId, 'STORAGE_VERIFIED');
    return this.view(verified, await this.canUse(organizationId));
  }

  /**
   * Disconnects the bucket: new uploads come back to our storage. Files
   * already in the bucket stay there, and can't be shown any more.
   */
  async remove(organizationId: string, userId: string) {
    const { count } = await this.prisma.storageConfig.deleteMany({
      where: { organizationId },
    });
    if (count === 0) throw new NotFoundException('No storage connected.');
    await this.record(userId, organizationId, 'STORAGE_REMOVED');
  }

  /** Where new uploads go: the bucket when verified and allowed, or null. */
  async activeProvider(organizationId: string) {
    const config = await this.prisma.storageConfig.findUnique({
      where: { organizationId },
    });
    if (!config?.verifiedAt || !(await this.canUse(organizationId))) {
      return null;
    }
    return this.providerFrom(config);
  }

  /** The bucket files of an organization were stored in; null if gone. */
  async providerFor(organizationId: string) {
    const config = await this.prisma.storageConfig.findUnique({
      where: { organizationId },
    });
    return config ? this.providerFrom(config) : null;
  }

  private providerFrom(config: StorageConfig) {
    return new S3StorageProvider(
      config.settings as TS3Settings,
      decryptSecret<TS3Credentials>(config.credentialsEncrypted),
    );
  }

  private record(
    userId: string,
    organizationId: string,
    action: 'STORAGE_CONNECTED' | 'STORAGE_VERIFIED' | 'STORAGE_REMOVED',
    metadata?: Record<string, unknown>,
  ) {
    return this.audit.record({
      actor: { type: 'USER', id: userId },
      action,
      resource: { type: 'storage', id: organizationId },
      organizationId,
      metadata,
    });
  }
}
