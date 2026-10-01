import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { PlatformRole } from '../generated/prisma/client.js';
import { PLATFORM_ROLE_KEY, PlatformRoleGuard } from './platform-role.guard.js';

/**
 * Signed-in users with at least `role` only, e.g. `@RequirePlatformRole('ADMIN')`
 * on a controller or route. The module needs to import AuthModule.
 */
export const RequirePlatformRole = (role: PlatformRole) =>
  applyDecorators(
    SetMetadata(PLATFORM_ROLE_KEY, role),
    UseGuards(AuthGuard, PlatformRoleGuard),
  );
