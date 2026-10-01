import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isApiScope, type TApiKey, type TApiScope } from '@repo/cv-core';
import { AuditService } from '../audit/audit.service.js';
import { EntitlementService } from '../entitlements/entitlements.service.js';
import type { ApiKey } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  apiKeyHashOf,
  apiKeyPreview,
  generateApiKey,
} from './api-key-format.js';

/** How often a key's "last used" time is written, at most. */
const LAST_USED_RESOLUTION_MS = 60_000;

/** Who a request with a valid key acts as. */
export type TApiPrincipal = {
  apiKeyId: string;
  organizationId: string;
  scopes: TApiScope[];
  /**
   * The user a personal organization belongs to: the API acts on their CVs.
   * Null for a team's key.
   */
  ownerUserId: string | null;
};

const toApiKey = (key: ApiKey, emails: Map<string, string>): TApiKey => ({
  id: key.id,
  name: key.name,
  preview: apiKeyPreview(key.prefix),
  scopes: key.scopes.filter(isApiScope),
  createdBy: (key.createdById && emails.get(key.createdById)) ?? null,
  lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
  expiresAt: key.expiresAt?.toISOString() ?? null,
  createdAt: key.createdAt.toISOString(),
});

/**
 * An organization's API keys: made with the scopes they need, shown once,
 * stored hashed, and checked on every request (so revoking is instant).
 */
@Injectable()
export class ApiKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementService,
    private readonly audit: AuditService,
  ) {}

  /** Keys that still work, newest first. */
  async list(organizationId: string): Promise<TApiKey[]> {
    const keys = await this.prisma.apiKey.findMany({
      where: { organizationId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    const creatorIds = [
      ...new Set(keys.flatMap(({ createdById }) => createdById ?? [])),
    ];
    const creators = creatorIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, email: true },
        })
      : [];
    const emails = new Map(creators.map(({ id, email }) => [id, email]));
    return keys.map((key) => toApiKey(key, emails));
  }

  /**
   * A new key. The plan must include API access and have room for another
   * key. Returns the key itself; it can't be shown again.
   */
  async create(
    organizationId: string,
    userId: string,
    input: { name: string; scopes: string[]; expiresInDays?: number },
  ) {
    const scopes = [...new Set(input.scopes)];
    const unknown = scopes.filter((scope) => !isApiScope(scope));
    if (unknown.length > 0) {
      throw new BadRequestException(`Unknown scopes: ${unknown.join(', ')}`);
    }
    if (scopes.length === 0) {
      throw new BadRequestException('Pick at least one scope.');
    }

    const entitlements =
      await this.entitlements.forOrganization(organizationId);
    entitlements.assertCan('api.access');
    entitlements.assertAllowsAnother(
      'apiKey.max',
      await this.prisma.apiKey.count({
        where: { organizationId, revokedAt: null },
      }),
    );

    const { key, prefix, secretHash } = generateApiKey();
    const apiKey = await this.prisma.apiKey.create({
      data: {
        organizationId,
        name: input.name,
        prefix,
        secretHash,
        scopes,
        createdById: userId,
        expiresAt: input.expiresInDays
          ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
          : null,
      },
    });
    await this.audit.record({
      actor: { type: 'USER', id: userId },
      action: 'API_KEY_CREATED',
      resource: { type: 'apiKey', id: apiKey.id },
      organizationId,
      metadata: { name: apiKey.name, scopes },
    });
    return { key, apiKey: toApiKey(apiKey, new Map()) };
  }

  /** Stops a key working at once. */
  async revoke(organizationId: string, keyId: string, userId: string) {
    const { count } = await this.prisma.apiKey.updateMany({
      where: { id: keyId, organizationId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) throw new NotFoundException('API key not found');
    await this.audit.record({
      actor: { type: 'USER', id: userId },
      action: 'API_KEY_REVOKED',
      resource: { type: 'apiKey', id: keyId },
      organizationId,
    });
  }

  /**
   * The principal behind a presented key, or null if it isn't a working
   * key (unknown, revoked or expired). Not cached, so a revoked key stops
   * at once.
   */
  async authenticate(
    presented: string,
    now = new Date(),
  ): Promise<TApiPrincipal | null> {
    const secretHash = apiKeyHashOf(presented);
    if (!secretHash) return null;
    const key = await this.prisma.apiKey.findUnique({
      where: { secretHash },
      include: {
        organization: { select: { personalOwnerId: true, deletedAt: true } },
      },
    });
    if (
      !key ||
      key.revokedAt ||
      (key.expiresAt && key.expiresAt <= now) ||
      key.organization.deletedAt
    ) {
      return null;
    }
    if (
      !key.lastUsedAt ||
      now.getTime() - key.lastUsedAt.getTime() > LAST_USED_RESOLUTION_MS
    ) {
      await this.prisma.apiKey.update({
        where: { id: key.id },
        data: { lastUsedAt: now },
      });
    }
    return {
      apiKeyId: key.id,
      organizationId: key.organizationId,
      scopes: key.scopes.filter(isApiScope),
      ownerUserId: key.organization.personalOwnerId,
    };
  }
}
