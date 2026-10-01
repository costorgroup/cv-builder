import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { TResolvedEmbedConfig } from '@repo/cv-core';
import type { Request } from 'express';
import { bearerTokenOf } from '../api-keys/api-key-format.js';
import type { TExternalCvOwner } from '../cvs/cvs.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmbedTokens } from './embed-token.js';
import { EmbedsService } from './embeds.service.js';

/** An embedded builder's session, set on the request by the guard. */
export type TEmbedSession = {
  owner: TExternalCvOwner;
  config: TResolvedEmbedConfig;
};

type TEmbedRequest = Request & { embedSession?: TEmbedSession };

/**
 * Embed routes: a session token from the exchange, as a bearer token (no
 * cookies, which browsers block in frames). Each request re-checks that the
 * embed is on and the plan still includes embedding, and applies the embed
 * as it's set up now.
 */
@Injectable()
export class EmbedAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: EmbedTokens,
    private readonly embeds: EmbedsService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<TEmbedRequest>();
    const token = bearerTokenOf(request.headers.authorization);
    const claims = token ? await this.tokens.verify(token) : null;
    if (!claims) {
      throw new UnauthorizedException('The embed session has expired.');
    }
    const config = await this.prisma.embedConfig.findUnique({
      where: { id: claims.cfg },
    });
    const externalUser = await this.prisma.externalUser.findFirst({
      where: { id: claims.xu, organizationId: claims.org },
      select: { id: true },
    });
    if (!config || config.organizationId !== claims.org || !externalUser) {
      throw new UnauthorizedException('The embed session has expired.');
    }
    // Turned off, or the plan lost embedding: a 404, like a missing embed.
    await this.embeds.livePublicConfig(config.publicKey);
    const resolved = await this.embeds.resolve(config);
    request.embedSession = {
      owner: {
        organizationId: claims.org,
        externalUserId: claims.xu,
        templateIds: resolved.templateIds,
      },
      config: resolved,
    };
    return true;
  }
}

/** The embed session; only behind EmbedAuthGuard. */
export const EmbedSession = createParamDecorator(
  (_: unknown, context: ExecutionContext): TEmbedSession => {
    const { embedSession } = context.switchToHttp().getRequest<TEmbedRequest>();
    if (!embedSession)
      throw new Error('@EmbedSession() without EmbedAuthGuard');
    return embedSession;
  },
);
