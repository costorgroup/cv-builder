import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Auth } from '../auth/auth.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { RequireTeamRole, Team } from '../authz/require-team-role.decorator.js';
import type { TTeamContext } from '../authz/team-access.guard.js';
import { EntitlementService } from '../entitlements/entitlements.service.js';
import { OrganizationRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { organizationOverview } from '../usage/organization-overview.js';
import { UsageService } from '../usage/usage.service.js';
import {
  InviteDto,
  MemberRoleDto,
  TeamNameDto,
  TransferOwnershipDto,
} from './teams.dto.js';
import { TeamsService } from './teams.service.js';

/** Invites send email, so they're limited more tightly. */
const INVITES = { default: { limit: 20, ttl: 60 * 60_000 } };

/**
 * The signed-in user's teams. Everything under `:teamId` is for its members
 * only (others get a 404); the role each route needs is on it.
 */
@Controller('teams')
export class TeamsController {
  constructor(
    private readonly teams: TeamsService,
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementService,
    private readonly usage: UsageService,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  list(@Auth() { userId }: TAuthContext) {
    return this.teams.listForUser(userId);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Auth() { userId }: TAuthContext, @Body() { name }: TeamNameDto) {
    return this.teams.create(userId, name);
  }

  @Get(':teamId')
  @RequireTeamRole(OrganizationRole.MEMBER)
  get(@Team() team: TTeamContext) {
    return this.teams.get(team);
  }

  @Patch(':teamId')
  @RequireTeamRole(OrganizationRole.ADMIN)
  rename(
    @Auth() { userId }: TAuthContext,
    @Team() team: TTeamContext,
    @Body() { name }: TeamNameDto,
  ) {
    return this.teams.rename(userId, team, name);
  }

  @Delete(':teamId')
  @HttpCode(204)
  @RequireTeamRole(OrganizationRole.OWNER)
  async delete(@Auth() { userId }: TAuthContext, @Team() team: TTeamContext) {
    await this.teams.delete(userId, team);
  }

  /** What the team's plan allows, for limits and upgrade prompts. */
  @Get(':teamId/entitlements')
  @RequireTeamRole(OrganizationRole.MEMBER)
  async getEntitlements(@Team() team: TTeamContext) {
    return (await this.entitlements.forOrganization(team.id)).toSummary();
  }

  /** The team's plan, subscription and usage. */
  @Get(':teamId/overview')
  @RequireTeamRole(OrganizationRole.MEMBER)
  overview(@Team() team: TTeamContext) {
    return organizationOverview(
      {
        prisma: this.prisma,
        entitlements: this.entitlements,
        usage: this.usage,
      },
      team.id,
    );
  }

  @Get(':teamId/members')
  @RequireTeamRole(OrganizationRole.MEMBER)
  members(@Team() team: TTeamContext) {
    return this.teams.members(team);
  }

  @Patch(':teamId/members/:userId')
  @HttpCode(204)
  @RequireTeamRole(OrganizationRole.ADMIN)
  async setRole(
    @Auth() { userId }: TAuthContext,
    @Team() team: TTeamContext,
    @Param('userId', ParseUUIDPipe) memberId: string,
    @Body() { role }: MemberRoleDto,
  ) {
    await this.teams.setRole(userId, team, memberId, role);
  }

  /** Removes a member, or leaves the team when it's the caller's own id. */
  @Delete(':teamId/members/:userId')
  @HttpCode(204)
  @RequireTeamRole(OrganizationRole.MEMBER)
  async removeMember(
    @Auth() { userId }: TAuthContext,
    @Team() team: TTeamContext,
    @Param('userId', ParseUUIDPipe) memberId: string,
  ) {
    await this.teams.removeMember(userId, team, memberId);
  }

  @Post(':teamId/transfer-ownership')
  @HttpCode(204)
  @RequireTeamRole(OrganizationRole.OWNER)
  async transferOwnership(
    @Auth() { userId }: TAuthContext,
    @Team() team: TTeamContext,
    @Body() dto: TransferOwnershipDto,
  ) {
    await this.teams.transferOwnership(userId, team, dto.userId);
  }

  @Get(':teamId/invites')
  @RequireTeamRole(OrganizationRole.ADMIN)
  invites(@Team() team: TTeamContext) {
    return this.teams.invites(team);
  }

  @Post(':teamId/invites')
  @Throttle(INVITES)
  @RequireTeamRole(OrganizationRole.ADMIN)
  invite(
    @Auth() { userId }: TAuthContext,
    @Team() team: TTeamContext,
    @Body() { email, role }: InviteDto,
  ) {
    return this.teams.invite(userId, team, email, role);
  }

  @Delete(':teamId/invites/:inviteId')
  @HttpCode(204)
  @RequireTeamRole(OrganizationRole.ADMIN)
  async revokeInvite(
    @Auth() { userId }: TAuthContext,
    @Team() team: TTeamContext,
    @Param('inviteId', ParseUUIDPipe) inviteId: string,
  ) {
    await this.teams.revokeInvite(userId, team, inviteId);
  }
}
