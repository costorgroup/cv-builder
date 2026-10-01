import {
  applyDecorators,
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ApiBearerAuth,
  ApiExtension,
  ApiForbiddenResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PLAN_LIMIT_REACHED, type TApiScope } from '@repo/cv-core';
import type { Request, Response } from 'express';
import { EntitlementService } from '../entitlements/entitlements.service.js';
import { V1Error } from '../public-api/v1.schemas.js';
import { UsageService } from '../usage/usage.service.js';
import { bearerTokenOf } from './api-key-format.js';
import { ApiKeysService, type TApiPrincipal } from './api-keys.service.js';
import { RateLimiter } from './rate-limiter.js';

const SCOPES_KEY = 'apiScopes';

/** Requests one key may make per minute. */
export const API_REQUESTS_PER_MINUTE = 120;

export type TApiRequest = Request & { apiPrincipal?: TApiPrincipal };

/**
 * Lets a request through with a working API key that has `scopes`, on a
 * plan with API access and requests left this month; counts it. The key is
 * looked up on every request, so revoking it or downgrading takes effect at
 * once.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly limiter = new RateLimiter(API_REQUESTS_PER_MINUTE);

  constructor(
    private readonly reflector: Reflector,
    private readonly apiKeys: ApiKeysService,
    private readonly entitlements: EntitlementService,
    private readonly usage: UsageService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const http = context.switchToHttp();
    const request = http.getRequest<TApiRequest>();
    const response = http.getResponse<Response>();

    const presented = bearerTokenOf(request.headers.authorization);
    const principal = presented
      ? await this.apiKeys.authenticate(presented)
      : null;
    if (!principal) {
      throw new UnauthorizedException(
        presented
          ? 'Invalid API key.'
          : 'Send an API key as "Authorization: Bearer cvb_live_…".',
      );
    }

    const entitlements = await this.entitlements.forOrganization(
      principal.organizationId,
    );
    entitlements.assertCan('api.access');

    const retryAfter = this.limiter.hit(principal.apiKeyId);
    if (retryAfter > 0) {
      response.setHeader('Retry-After', String(retryAfter));
      throw new HttpException(
        `Too many requests: up to ${API_REQUESTS_PER_MINUTE} a minute per key.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const required =
      this.reflector.getAllAndOverride<TApiScope[] | undefined>(SCOPES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    const missing = required.filter(
      (scope) => !principal.scopes.includes(scope),
    );
    if (missing.length > 0) {
      throw new ForbiddenException(
        `This API key needs the ${missing.join(', ')} scope.`,
      );
    }

    const max = entitlements.limit('api.requests.monthly');
    if (max !== null) {
      const used = await this.usage.countThisMonth(
        principal.organizationId,
        'api.request',
      );
      if (used >= max) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            code: PLAN_LIMIT_REACHED,
            limit: 'api.requests.monthly',
            used,
            max,
            message:
              max === 0
                ? 'This plan includes no API requests. Upgrade to use the API.'
                : `This month's ${max} API requests are used up. Upgrade, or wait until next month.`,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
    await this.usage.record(principal.organizationId, 'api.request');

    request.apiPrincipal = principal;
    return true;
  }
}

/**
 * Public API routes: an API key with `scopes`, instead of a session. Not
 * limited by IP like the rest of the API; the ApiKeyGuard limits per key.
 */
export const RequireApiScopes = (...scopes: TApiScope[]) =>
  applyDecorators(
    SetMetadata(SCOPES_KEY, scopes),
    UseGuards(ApiKeyGuard),
    SkipThrottle(),
    ApiBearerAuth(),
    ApiExtension('x-required-scopes', scopes),
    ApiUnauthorizedResponse({
      type: V1Error,
      description: 'No key, or one that was revoked or has expired.',
    }),
    ApiForbiddenResponse({
      type: V1Error,
      description: `The key lacks ${scopes.join(', ')}, or the plan doesn't allow it.`,
    }),
    ApiTooManyRequestsResponse({
      type: V1Error,
      description: 'Over the per-minute or the monthly limit.',
    }),
  );

/** The API key's organization and scopes; only behind RequireApiScopes. */
export const ApiPrincipal = createParamDecorator(
  (_: unknown, context: ExecutionContext): TApiPrincipal => {
    const { apiPrincipal } = context.switchToHttp().getRequest<TApiRequest>();
    if (!apiPrincipal) {
      throw new Error('@ApiPrincipal() used without RequireApiScopes');
    }
    return apiPrincipal;
  },
);
