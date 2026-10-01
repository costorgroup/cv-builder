import {
  applyDecorators,
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { OrganizationRole } from '../generated/prisma/client.js';
import {
  TEAM_ROLE_KEY,
  TeamAccessGuard,
  type TTeamContext,
  type TTeamRequest,
} from './team-access.guard.js';

/**
 * Members of the `:teamId` team with at least `role` only, e.g.
 * `@RequireTeamRole('ADMIN')`. The module needs to import AuthModule.
 */
export const RequireTeamRole = (role: OrganizationRole) =>
  applyDecorators(
    SetMetadata(TEAM_ROLE_KEY, role),
    UseGuards(AuthGuard, TeamAccessGuard),
  );

/** The team from `:teamId` and the caller's role in it. */
export const Team = createParamDecorator(
  (_: unknown, context: ExecutionContext): TTeamContext => {
    const { team } = context.switchToHttp().getRequest<TTeamRequest>();
    if (!team) throw new Error('@Team() used on a route without a team role');
    return team;
  },
);
