import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasOrganizationRole } from '@repo/cv-core';
import type { TAuthRequest } from '../auth/auth.types.js';
import {
  OrganizationType,
  type OrganizationRole,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export const TEAM_ROLE_KEY = 'teamRole';

/** Set on the request by the TeamAccessGuard. */
export type TTeamContext = { id: string; role: OrganizationRole };

export type TTeamRequest = TAuthRequest & { team?: TTeamContext };

/**
 * Lets a request through only if the signed-in user belongs to the team in
 * the `:teamId` route param with at least the role set by
 * `@RequireTeamRole()`. Anyone else gets a 404, so teams they're not in
 * can't be found by guessing ids. Runs after the AuthGuard.
 */
@Injectable()
export class TeamAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<
      OrganizationRole | undefined
    >(TEAM_ROLE_KEY, [context.getHandler(), context.getClass()]);
    const request = context.switchToHttp().getRequest<TTeamRequest>();
    if (!request.auth) {
      throw new Error('TeamAccessGuard used on a route without AuthGuard');
    }
    const teamId = request.params.teamId;
    if (typeof teamId !== 'string') {
      throw new Error('TeamAccessGuard used on a route without :teamId');
    }

    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId: request.auth.userId,
        organizationId: teamId,
        organization: { type: OrganizationType.TEAM, deletedAt: null },
      },
      select: { role: true },
    });
    if (!membership) throw new NotFoundException('Team not found');
    if (required && !hasOrganizationRole(membership.role, required)) {
      throw new ForbiddenException(
        required === 'OWNER'
          ? 'Only the team owner can do that.'
          : 'Only team owners and admins can do that.',
      );
    }
    request.team = { id: teamId, role: membership.role };
    return true;
  }
}
