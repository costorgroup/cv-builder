import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type { TCvOwner } from '../cvs/cvs.service.js';
import { PlanLimitReachedException } from '../entitlements/entitlements.errors.js';
import { EntitlementService } from '../entitlements/entitlements.service.js';
import {
  AssetKind,
  StorageKind,
  type Asset,
  type Prisma,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { createPlatformStorage } from './platform-storage.js';
import { StorageConfigsService } from './storage-configs.service.js';
import type { StorageProvider } from './storage-provider.js';

/** Largest photo accepted; the editor scales photos down well below this. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** How a CV refers to a stored file: through the web app's /api proxy. */
export const assetUrl = (id: string) => `/api/assets/${id}`;
const ASSET_URL = /^\/api\/assets\/([0-9a-f-]{36})$/;

/** How long a file can wait for a CV to be saved with it. */
const UNATTACHED_TTL_MS = 24 * 60 * 60 * 1000;
const JANITOR_INTERVAL_MS = 60 * 60 * 1000;

/** The image type from the file's first bytes; never trusted from the client. */
export const imageTypeOf = (bytes: Buffer) => {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
};

const isUser = (owner: TCvOwner): owner is string => typeof owner === 'string';

type TPhotoData = { personalInformation?: { photo?: unknown } };

const photoOf = (data: unknown) => {
  const photo = (data as TPhotoData | null)?.personalInformation?.photo;
  return typeof photo === 'string' ? photo : '';
};

const withPhoto = (data: unknown, photo: string) => {
  const value = data as Record<string, unknown>;
  return {
    ...value,
    personalInformation: {
      ...(value.personalInformation as Record<string, unknown>),
      photo,
    },
  };
};

/**
 * Stored files (CV photos for now). A file is uploaded first, then belongs
 * to the CV that's saved with it; a CV's files go with it. Files go to our
 * storage, or to the organization's own bucket once it's connected and
 * checked; each is read from wherever it was put.
 */
@Injectable()
export class AssetsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AssetsService.name);
  private readonly platform: StorageProvider = createPlatformStorage();
  private janitor?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementService,
    private readonly storageConfigs: StorageConfigsService,
  ) {}

  /** Where a stored file is; null if its bucket was disconnected. */
  private storeOf(asset: Pick<Asset, 'storage' | 'organizationId'>) {
    return asset.storage === StorageKind.PLATFORM
      ? Promise.resolve<StorageProvider | null>(this.platform)
      : this.storageConfigs.providerFor(asset.organizationId);
  }

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    this.janitor = setInterval(
      () => void this.clearUnattached().catch(() => undefined),
      JANITOR_INTERVAL_MS,
    );
    this.janitor.unref();
  }

  onModuleDestroy() {
    clearInterval(this.janitor);
  }

  private organizationOf(owner: TCvOwner) {
    return isUser(owner)
      ? this.prisma.organization
          .findUniqueOrThrow({
            where: { personalOwnerId: owner },
            select: { id: true },
          })
          .then(({ id }) => id)
      : Promise.resolve(owner.organizationId);
  }

  /** Bytes an organization keeps with us: CV data plus files. */
  async storageUsed(organizationId: string) {
    const [cvs, assets] = await this.prisma.$transaction([
      this.prisma.cv.aggregate({
        where: { organizationId },
        _sum: { sizeBytes: true },
      }),
      this.prisma.asset.aggregate({
        where: { organizationId, storage: StorageKind.PLATFORM },
        _sum: { sizeBytes: true },
      }),
    ]);
    return (cvs._sum.sizeBytes ?? 0) + (assets._sum.sizeBytes ?? 0);
  }

  /**
   * Stores a photo for the owner and returns its link. It must really be a
   * JPEG, PNG or WebP, and fit in the plan's storage.
   */
  async uploadPhoto(owner: TCvOwner, bytes: Buffer) {
    if (bytes.length === 0) throw new BadRequestException('The file is empty.');
    if (bytes.length > MAX_PHOTO_BYTES) {
      throw new BadRequestException('Photos can be up to 5 MB.');
    }
    const contentType = imageTypeOf(bytes);
    if (!contentType) {
      throw new BadRequestException('Use a JPEG, PNG or WebP image.');
    }
    const organizationId = await this.organizationOf(owner);
    // The organization's own bucket doesn't count against our storage.
    const external = await this.storageConfigs.activeProvider(organizationId);
    const entitlements =
      await this.entitlements.forOrganization(organizationId);
    const max = entitlements.limit('storage.bytes');
    if (!external && max !== null) {
      const used = await this.storageUsed(organizationId);
      if (used + bytes.length > max) {
        throw new PlanLimitReachedException('storage.bytes', used, max);
      }
    }

    const id = randomUUID();
    const storageKey = `org/${organizationId}/assets/${id}`;
    await (external ?? this.platform).put(storageKey, bytes, contentType);
    await this.prisma.asset.create({
      data: {
        id,
        organizationId,
        kind: AssetKind.PHOTO,
        storage: external ? StorageKind.S3 : StorageKind.PLATFORM,
        storageKey,
        contentType,
        sizeBytes: bytes.length,
        ...(isUser(owner)
          ? { userId: owner }
          : { externalUserId: owner.externalUserId }),
      },
    });
    return { id, url: assetUrl(id) };
  }

  /** The file and its type, for serving; 404 if there's no such file. */
  async open(id: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id } });
    const store = asset && (await this.storeOf(asset));
    const body =
      asset && store
        ? await store.get(asset.storageKey).catch((error: unknown) => {
            this.logger.warn(`Couldn't read file ${id}: ${String(error)}`);
            return null;
          })
        : null;
    if (!asset || !body) throw new NotFoundException('File not found');
    return { body, contentType: asset.contentType, sizeBytes: asset.sizeBytes };
  }

  /**
   * Before a CV is saved: a photo still inline as a data URL (older CVs, or
   * API clients) is stored as a file and replaced by its link.
   */
  async moveInlinePhoto<T>(owner: TCvOwner, data: T): Promise<T> {
    const photo = photoOf(data);
    const match = /^data:image\/[a-z+.-]+;base64,(.+)$/i.exec(photo);
    if (!match?.[1]) return data;
    const { url } = await this.uploadPhoto(
      owner,
      Buffer.from(match[1], 'base64'),
    );
    return withPhoto(data, url) as T;
  }

  /**
   * After a CV is saved: the files it links to become its own, and ones it
   * no longer links to are removed. Only the owner's own uploads can be
   * taken on; a file another CV uses is copied, so each CV keeps its own.
   * Returns the data with any copied links.
   */
  async attach<T>(owner: TCvOwner, cvId: string, data: T): Promise<T> {
    const id = ASSET_URL.exec(photoOf(data))?.[1];
    let next = data;
    let keep: string | undefined;

    if (id) {
      const asset = await this.prisma.asset.findFirst({
        where: {
          id,
          ...(isUser(owner)
            ? { userId: owner }
            : {
                organizationId: owner.organizationId,
                externalUserId: owner.externalUserId,
              }),
        },
      });
      if (asset && (asset.cvId === null || asset.cvId === cvId)) {
        if (asset.cvId === null) {
          await this.prisma.asset.update({ where: { id }, data: { cvId } });
        }
        keep = id;
      } else if (asset) {
        const copy = await this.copy(asset, cvId);
        next = withPhoto(data, assetUrl(copy)) as T;
        keep = copy;
      }
      // Someone else's file (or none): the link is left as it is, but it
      // isn't counted as this CV's.
    }

    await this.removeWhere({ cvId, ...(keep && { id: { not: keep } }) });
    return next;
  }

  /** A CV's files, when the CV is deleted. */
  removeForCv(cvId: string) {
    return this.removeWhere({ cvId });
  }

  /**
   * Every file of an organization in our storage, once it's deleted. Files
   * in its own bucket are its own to keep.
   */
  async removeForOrganization(organizationId: string) {
    await this.platform.deletePrefix(`org/${organizationId}/`);
    await this.prisma.asset.deleteMany({ where: { organizationId } });
  }

  /** Uploads no CV was saved with, after a day. */
  async clearUnattached(now = new Date()) {
    const removed = await this.removeWhere({
      cvId: null,
      createdAt: { lt: new Date(now.getTime() - UNATTACHED_TTL_MS) },
    });
    if (removed > 0) this.logger.log(`Cleared ${removed} unused uploads`);
    return removed;
  }

  /** A copy of a file for another CV, in the same storage as the original. */
  private async copy(asset: Asset, cvId: string) {
    const store = await this.storeOf(asset);
    const source = store && (await store.get(asset.storageKey));
    if (!store || !source) throw new NotFoundException('File not found');
    const chunks: Buffer[] = [];
    for await (const chunk of source) chunks.push(Buffer.from(chunk));
    const id = randomUUID();
    const storageKey = `org/${asset.organizationId}/assets/${id}`;
    await store.put(storageKey, Buffer.concat(chunks), asset.contentType);
    await this.prisma.asset.create({
      data: {
        id,
        organizationId: asset.organizationId,
        cvId,
        userId: asset.userId,
        externalUserId: asset.externalUserId,
        kind: asset.kind,
        storage: asset.storage,
        storageKey,
        contentType: asset.contentType,
        sizeBytes: asset.sizeBytes,
      },
    });
    return id;
  }

  private async removeWhere(where: Prisma.AssetWhereInput) {
    const assets = await this.prisma.asset.findMany({
      where,
      select: {
        id: true,
        storageKey: true,
        storage: true,
        organizationId: true,
      },
    });
    for (const asset of assets) {
      // A bucket that's gone or failing doesn't stop the rest.
      try {
        await (await this.storeOf(asset))?.delete(asset.storageKey);
      } catch (error) {
        this.logger.warn(`Couldn't delete file ${asset.id}: ${String(error)}`);
      }
    }
    if (assets.length > 0) {
      await this.prisma.asset.deleteMany({
        where: { id: { in: assets.map(({ id }) => id) } },
      });
    }
    return assets.length;
  }
}
