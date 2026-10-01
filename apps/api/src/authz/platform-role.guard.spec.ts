import {
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TAuthContext } from '../auth/auth.types.js';
import { PlatformRole } from '../generated/prisma/client.js';
import { PLATFORM_ROLE_KEY, PlatformRoleGuard } from './platform-role.guard.js';

class TestController {
  open() {}

  @SetMetadata(PLATFORM_ROLE_KEY, PlatformRole.ADMIN)
  admin() {}

  @SetMetadata(PLATFORM_ROLE_KEY, PlatformRole.SUPER_ADMIN)
  superAdmin() {}
}

const contextFor = (
  handler: keyof TestController,
  role?: PlatformRole,
): ExecutionContext => {
  const auth: TAuthContext | undefined = role
    ? { userId: 'user', sessionId: 'session', role }
    : undefined;
  return {
    getHandler: () => TestController.prototype[handler],
    getClass: () => TestController,
    switchToHttp: () => ({ getRequest: () => ({ auth }) }),
  } as unknown as ExecutionContext;
};

describe('PlatformRoleGuard', () => {
  const guard = new PlatformRoleGuard(new Reflector());

  it('lets anyone through a route without a required role', () => {
    expect(guard.canActivate(contextFor('open', PlatformRole.USER))).toBe(true);
  });

  it('lets a role through routes that need it or a lower one', () => {
    expect(guard.canActivate(contextFor('admin', PlatformRole.ADMIN))).toBe(
      true,
    );
    expect(
      guard.canActivate(contextFor('admin', PlatformRole.SUPER_ADMIN)),
    ).toBe(true);
    expect(
      guard.canActivate(contextFor('superAdmin', PlatformRole.SUPER_ADMIN)),
    ).toBe(true);
  });

  it('rejects a role below the required one', () => {
    expect(() =>
      guard.canActivate(contextFor('admin', PlatformRole.USER)),
    ).toThrow(ForbiddenException);
    expect(() =>
      guard.canActivate(contextFor('superAdmin', PlatformRole.ADMIN)),
    ).toThrow(ForbiddenException);
  });

  it('fails loudly when the AuthGuard did not run first', () => {
    expect(() => guard.canActivate(contextFor('admin'))).toThrow(
      /without AuthGuard/,
    );
  });
});
