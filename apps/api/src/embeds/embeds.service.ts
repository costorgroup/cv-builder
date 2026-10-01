import { randomBytes } from 'node:crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { TEmbedConfig, TResolvedEmbedConfig } from '@repo/cv-core';
import { AuditService } from '../audit/audit.service.js';
import { createToken, hashToken } from '../auth/utils/token.js';
import { EntitlementService } from '../entitlements/entitlements.service.js';
import type { EmbedConfig, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TemplatesService } from '../templates/templates.service.js';
import {
  parseEmbedInput,
  resolveEmbedConfig,
  toEmbedConfig,
} from './embed-config.js';
import { EMBED_SESSION_TTL_SECONDS, EmbedTokens } from './embed-token.js';

/** How long a launch token can wait to be exchanged. */
export const LAUNCH_TOKEN_TTL_MS = 60_000;

export type TEmbedInput = Parameters<typeof parseEmbedInput>[0] & {
  name?: string;
  disabled?: boolean;
};

/** "pk_" and 24 hex characters: safe in a web page, unique per embed. */
const newPublicKey = () => `pk_${randomBytes(12).toString('hex')}`;

const json = (value: unknown) => value as Prisma.InputJsonObject;

/**
 * Embedded builders: their setup (for owners), launching a session for a
 * customer's end user (with an API key), and exchanging it in the frame.
 */
@Injectable()
export class EmbedsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementService,
    private readonly templates: TemplatesService,
    private readonly tokens: EmbedTokens,
    private readonly audit: AuditService,
  ) {}

  async list(organizationId: string): Promise<TEmbedConfig[]> {
    const configs = await this.prisma.embedConfig.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return configs.map(toEmbedConfig);
  }

  /** A new embed; the plan must include embedding and have room for one. */
  async create(organizationId: string, userId: string, input: TEmbedInput) {
    const entitlements =
      await this.entitlements.forOrganization(organizationId);
    entitlements.assertCan('embed.builder');
    entitlements.assertAllowsAnother(
      'embed.max',
      await this.prisma.embedConfig.count({ where: { organizationId } }),
    );
    const data = parseEmbedInput(input);
    const config = await this.prisma.embedConfig.create({
      data: {
        organizationId,
        name: input.name ?? 'Embed',
        publicKey: newPublicKey(),
        allowedOrigins: data.allowedOrigins ?? [],
        theme: json(data.theme ?? {}),
        branding: json(data.branding ?? {}),
        templateIds: data.templateIds ?? [],
        sections: data.sections ?? [],
        features: data.features ?? ['pdf.download'],
      },
    });
    await this.record(userId, organizationId, 'EMBED_CREATED', config.id);
    return toEmbedConfig(config);
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    input: TEmbedInput,
  ) {
    await this.owned(organizationId, id);
    const data = parseEmbedInput(input);
    const config = await this.prisma.embedConfig.update({
      where: { id },
      data: {
        name: input.name,
        allowedOrigins: data.allowedOrigins,
        theme: data.theme && json(data.theme),
        branding: data.branding && json(data.branding),
        templateIds: data.templateIds,
        sections: data.sections,
        features: data.features,
        disabledAt:
          input.disabled === undefined
            ? undefined
            : input.disabled
              ? new Date()
              : null,
      },
    });
    await this.record(userId, organizationId, 'EMBED_UPDATED', id, {
      changed: Object.keys(input),
    });
    return toEmbedConfig(config);
  }

  /** Deletes the embed; its users and their CVs stay with the organization. */
  async remove(organizationId: string, userId: string, id: string) {
    await this.owned(organizationId, id);
    await this.prisma.embedConfig.delete({ where: { id } });
    await this.record(userId, organizationId, 'EMBED_DELETED', id);
  }

  /**
   * For an API key's organization: a one-minute, single-use ticket for one
   * of its end users to open the embed. The user is made on first launch,
   * within the plan's limit of embedded users.
   */
  async launch(
    organizationId: string,
    input: {
      publicKey: string;
      externalUserId: string;
      email?: string;
      name?: string;
    },
  ) {
    const config = await this.prisma.embedConfig.findUnique({
      where: { publicKey: input.publicKey },
    });
    if (!config || config.organizationId !== organizationId) {
      throw new NotFoundException('No embed with that public key');
    }
    if (config.disabledAt)
      throw new ForbiddenException('This embed is turned off.');
    const entitlements =
      await this.entitlements.forOrganization(organizationId);
    entitlements.assertCan('embed.builder');

    const existing = await this.prisma.externalUser.findUnique({
      where: {
        organizationId_externalId: {
          organizationId,
          externalId: input.externalUserId,
        },
      },
    });
    if (!existing) {
      entitlements.assertAllowsAnother(
        'embed.externalUsers.max',
        await this.prisma.externalUser.count({ where: { organizationId } }),
      );
    }
    const externalUser = await this.prisma.externalUser.upsert({
      where: {
        organizationId_externalId: {
          organizationId,
          externalId: input.externalUserId,
        },
      },
      create: {
        organizationId,
        externalId: input.externalUserId,
        email: input.email,
        name: input.name,
      },
      update: {
        ...(input.email !== undefined && { email: input.email }),
        ...(input.name !== undefined && { name: input.name }),
      },
    });

    const launchToken = createToken(24);
    const expiresAt = new Date(Date.now() + LAUNCH_TOKEN_TTL_MS);
    await this.prisma.embedLaunchToken.create({
      data: {
        tokenHash: hashToken(launchToken),
        embedConfigId: config.id,
        externalUserId: externalUser.id,
        expiresAt,
      },
    });
    return {
      launchToken,
      expiresAt: expiresAt.toISOString(),
      externalUser: {
        id: externalUser.id,
        externalId: externalUser.externalId,
      },
    };
  }

  /**
   * In the frame: a launch token (used once, within a minute) for a session
   * token and the embed's settings. `origin` is the page the frame is on,
   * when the browser says; it must be one the embed allows.
   */
  async exchange(publicKey: string, launchToken: string, origin?: string) {
    const config = await this.livePublicConfig(publicKey);
    if (origin && !config.allowedOrigins.includes(origin)) {
      throw new ForbiddenException(
        "This site isn't allowed to show the embed.",
      );
    }
    const tokenHash = hashToken(launchToken);
    const token = await this.prisma.embedLaunchToken.findUnique({
      where: { tokenHash },
    });
    // Deleting it is what uses it up: of two exchanges at once, one wins.
    const { count } = await this.prisma.embedLaunchToken.deleteMany({
      where: { tokenHash, expiresAt: { gt: new Date() } },
    });
    if (!token || count === 0 || token.embedConfigId !== config.id) {
      throw new UnauthorizedException(
        'This link has expired. Open the builder again from the site.',
      );
    }
    await this.prisma.externalUser.update({
      where: { id: token.externalUserId },
      data: { lastSeenAt: new Date() },
    });
    const embedToken = await this.tokens.sign({
      org: config.organizationId,
      xu: token.externalUserId,
      cfg: config.id,
    });
    return {
      embedToken,
      expiresIn: EMBED_SESSION_TTL_SECONDS,
      config: await this.resolve(config),
    };
  }

  /**
   * What a page showing the embed needs before anyone signs in: the
   * origins that may frame it (for the frame-ancestors header). 404 for a
   * key that doesn't exist or is turned off.
   */
  async frameOrigins(publicKey: string) {
    const config = await this.livePublicConfig(publicKey);
    return { allowedOrigins: config.allowedOrigins };
  }

  /** The embed as it runs now, for an existing session. */
  async resolve(config: EmbedConfig): Promise<TResolvedEmbedConfig> {
    return resolveEmbedConfig(
      config,
      await this.entitlements.forOrganization(config.organizationId),
      await this.templates.catalog(),
    );
  }

  /** An enabled embed of an organization that still has embedding. */
  async livePublicConfig(publicKey: string) {
    const config = await this.prisma.embedConfig.findUnique({
      where: { publicKey },
      include: { organization: { select: { deletedAt: true } } },
    });
    if (!config || config.disabledAt || config.organization.deletedAt) {
      throw new NotFoundException('This embed is not available.');
    }
    const entitlements = await this.entitlements.forOrganization(
      config.organizationId,
    );
    if (!entitlements.can('embed.builder')) {
      throw new NotFoundException('This embed is not available.');
    }
    return config;
  }

  private async owned(organizationId: string, id: string) {
    const config = await this.prisma.embedConfig.findFirst({
      where: { id, organizationId },
    });
    if (!config) throw new NotFoundException('Embed not found');
    return config;
  }

  private record(
    userId: string,
    organizationId: string,
    action: 'EMBED_CREATED' | 'EMBED_UPDATED' | 'EMBED_DELETED',
    id: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.audit.record({
      actor: { type: 'USER', id: userId },
      action,
      resource: { type: 'embed', id },
      organizationId,
      metadata,
    });
  }
}
