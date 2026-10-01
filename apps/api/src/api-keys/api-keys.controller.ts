import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Auth } from '../auth/auth.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { RequireTeamRole, Team } from '../authz/require-team-role.decorator.js';
import type { TTeamContext } from '../authz/team-access.guard.js';
import { OrganizationRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateApiKeyDto } from './api-keys.dto.js';
import { ApiKeysService } from './api-keys.service.js';

/** The signed-in user's own API keys. */
@Controller('account/api-keys')
@UseGuards(AuthGuard)
export class AccountApiKeysController {
  constructor(
    private readonly apiKeys: ApiKeysService,
    private readonly prisma: PrismaService,
  ) {}

  private async organizationId(userId: string) {
    const { id } = await this.prisma.organization.findUniqueOrThrow({
      where: { personalOwnerId: userId },
      select: { id: true },
    });
    return id;
  }

  @Get()
  async list(@Auth() { userId }: TAuthContext) {
    return this.apiKeys.list(await this.organizationId(userId));
  }

  @Post()
  async create(@Auth() { userId }: TAuthContext, @Body() dto: CreateApiKeyDto) {
    return this.apiKeys.create(await this.organizationId(userId), userId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async revoke(
    @Auth() { userId }: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.apiKeys.revoke(await this.organizationId(userId), id, userId);
  }
}

/** A team's API keys; its owners and admins manage them. */
@Controller('teams/:teamId/api-keys')
@RequireTeamRole(OrganizationRole.ADMIN)
export class TeamApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Get()
  list(@Team() team: TTeamContext) {
    return this.apiKeys.list(team.id);
  }

  @Post()
  create(
    @Auth() { userId }: TAuthContext,
    @Team() team: TTeamContext,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeys.create(team.id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async revoke(
    @Auth() { userId }: TAuthContext,
    @Team() team: TTeamContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.apiKeys.revoke(team.id, id, userId);
  }
}
