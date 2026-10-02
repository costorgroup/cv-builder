import {
  ExecutionContext,
  ForbiddenException,
  HttpException,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlanFeatureRequiredException } from '../entitlements/entitlements.errors.js';
import type { EntitlementService } from '../entitlements/entitlements.service.js';
import { resolveEntitlements } from '../entitlements/resolve-entitlements.js';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { UsageService } from '../usage/usage.service.js';
import {
  apiKeyHashOf,
  bearerTokenOf,
  generateApiKey,
} from './api-key-format.js';
import { ApiKeyGuard, type TApiRequest } from './api-key.guard.js';
import type { ApiKeysService, TApiPrincipal } from './api-keys.service.js';

describe('API key format', () => {
  it('makes keys that parse back to the stored hash', () => {
    const { key, prefix, secretHash } = generateApiKey();
    expect(key).toMatch(new RegExp(`^cvb_live_${prefix}_[\\w-]{43}$`));
    expect(apiKeyHashOf(key)).toBe(secretHash);
  });

  it("doesn't hash anything that isn't shaped like a key", () => {
    expect(apiKeyHashOf('cvb_live_nothex00_short')).toBeNull();
    expect(apiKeyHashOf('Bearer something')).toBeNull();
  });

  it('reads the bearer token', () => {
    expect(bearerTokenOf('Bearer cvb_live_x')).toBe('cvb_live_x');
    expect(bearerTokenOf('bearer   abc')).toBe('abc');
    expect(bearerTokenOf('Basic abc')).toBeUndefined();
    expect(bearerTokenOf(undefined)).toBeUndefined();
  });
});

class TestController {
  @SetMetadata('apiScopes', ['cv:read'])
  read() {}
}

const plan = (features: string[], limits: Record<string, number | null>) =>
  resolveEntitlements(
    null,
    { key: 'p', name: 'P', features, limits },
    new Date(),
  );

const setup = ({
  principal = {
    apiKeyId: 'key',
    organizationId: 'org',
    scopes: ['cv:read'],
    ownerUserId: 'user',
  } as TApiPrincipal | null,
  entitlements = plan(['api.access'], { 'api.requests.monthly': 100 }),
  used = 0,
  authorization = 'Bearer cvb_live_00000000_x',
  blocked = false,
} = {}) => {
  const record = vi.fn();
  const guard = new ApiKeyGuard(
    new Reflector(),
    {
      authenticate: vi.fn().mockResolvedValue(principal),
    } as unknown as ApiKeysService,
    {
      forOrganization: vi.fn().mockResolvedValue(entitlements),
    } as unknown as EntitlementService,
    {
      countThisMonth: vi.fn().mockResolvedValue(used),
      record,
    } as unknown as UsageService,
    {
      increment: vi.fn().mockResolvedValue({
        totalHits: blocked ? 121 : 1,
        timeToExpire: 42,
        isBlocked: blocked,
        timeToBlockExpire: blocked ? 42 : 0,
      }),
    } as unknown as ThrottlerStorage,
  );
  const request = { headers: { authorization } } as unknown as TApiRequest;
  const context = {
    getHandler: () => TestController.prototype.read,
    getClass: () => TestController,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ setHeader: vi.fn() }),
    }),
  } as unknown as ExecutionContext;
  return { guard, context, request, record };
};

describe('ApiKeyGuard', () => {
  it('401s without a working key', async () => {
    await expect(
      setup({ principal: null }).guard.canActivate(setup().context),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('needs a plan with API access, checked on every request', async () => {
    const { guard, context, record } = setup({ entitlements: plan([], {}) });
    await expect(guard.canActivate(context)).rejects.toThrow(
      PlanFeatureRequiredException,
    );
    expect(record).not.toHaveBeenCalled();
  });

  it('403s for a missing scope, without counting the request', async () => {
    const { guard, context, record } = setup({
      principal: {
        apiKeyId: 'key',
        organizationId: 'org',
        scopes: ['template:read'],
        ownerUserId: 'user',
      },
    });
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    expect(record).not.toHaveBeenCalled();
  });

  it('429s once the monthly requests are used up', async () => {
    const { guard, context } = setup({ used: 100 });
    const error = await guard.canActivate(context).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(429);
    expect((error as HttpException).getResponse()).toMatchObject({
      code: 'PLAN_LIMIT_REACHED',
      limit: 'api.requests.monthly',
    });
  });

  it('429s over the per-minute limit, saying when to retry', async () => {
    const { guard, context, record } = setup({ blocked: true });
    const error = await guard.canActivate(context).catch((e: unknown) => e);
    expect((error as HttpException).getStatus()).toBe(429);
    expect(record).not.toHaveBeenCalled();
  });

  it('counts the request and puts the key on it', async () => {
    const { guard, context, request, record } = setup();
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(record).toHaveBeenCalledWith('org', 'api.request');
    expect(request.apiPrincipal?.organizationId).toBe('org');
  });
});
