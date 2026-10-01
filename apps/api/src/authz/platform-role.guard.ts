import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TAuthRequest } from '../auth/auth.types.js';
import type { PlatformRole } from '../generated/prisma/client.js';
import { hasPlatformRole } from './platform-roles.js';

export const PLATFORM_ROLE_KEY = 'platformRole';

/**
 * Lets a request through only if the signed-in user has at least the role
 * set by `@RequirePlatformRole()`. Runs after the AuthGuard, which reads the
 * role from the database.
 */
@Injectable()
export class PlatformRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<PlatformRole | undefined>(
      PLATFORM_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const { auth } = context.switchToHttp().getRequest<TAuthRequest>();
    if (!auth) {
      throw new Error('PlatformRoleGuard used on a route without AuthGuard');
    }
    if (!hasPlatformRole(auth.role, required)) throw new ForbiddenException();
    return true;
  }
}
