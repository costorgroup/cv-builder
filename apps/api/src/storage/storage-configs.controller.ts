import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Auth } from '../auth/auth.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { RequireTeamRole, Team } from '../authz/require-team-role.decorator.js';
import type { TTeamContext } from '../authz/team-access.guard.js';
import { OrganizationRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageConfigsService } from './storage-configs.service.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** A bucket to connect; the service checks the values themselves. */
export class StorageConfigDto {
  @Transform(trim)
  @IsString()
  @MaxLength(63)
  bucket: string;

  @Transform(trim)
  @IsString()
  @MaxLength(32)
  region: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  endpoint?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  prefix?: string;

  /** Left out (with the secret) to keep the saved keys. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(128)
  accessKeyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  secretAccessKey?: string;
}

/** Checks reach out to the bucket, so they're limited. */
const CHECKS = { default: { limit: 10, ttl: 60_000 } };

/** The signed-in user's own bucket. */
@Controller('account/storage')
@UseGuards(AuthGuard)
export class AccountStorageController {
  constructor(
    private readonly configs: StorageConfigsService,
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
  async get(@Auth() { userId }: TAuthContext) {
    return {
      storage: await this.configs.get(await this.organizationId(userId)),
    };
  }

  @Patch()
  async save(@Auth() { userId }: TAuthContext, @Body() dto: StorageConfigDto) {
    return this.configs.save(await this.organizationId(userId), userId, dto);
  }

  @Post('verify')
  @HttpCode(200)
  @Throttle(CHECKS)
  async verify(@Auth() { userId }: TAuthContext) {
    return this.configs.verify(await this.organizationId(userId), userId);
  }

  @Delete()
  @HttpCode(204)
  async remove(@Auth() { userId }: TAuthContext) {
    await this.configs.remove(await this.organizationId(userId), userId);
  }
}

/** A team's bucket; its owners and admins manage it. */
@Controller('teams/:teamId/storage')
@RequireTeamRole(OrganizationRole.ADMIN)
export class TeamStorageController {
  constructor(private readonly configs: StorageConfigsService) {}

  @Get()
  async get(@Team() team: TTeamContext) {
    return { storage: await this.configs.get(team.id) };
  }

  @Patch()
  save(
    @Auth() { userId }: TAuthContext,
    @Team() team: TTeamContext,
    @Body() dto: StorageConfigDto,
  ) {
    return this.configs.save(team.id, userId, dto);
  }

  @Post('verify')
  @HttpCode(200)
  @Throttle(CHECKS)
  verify(@Auth() { userId }: TAuthContext, @Team() team: TTeamContext) {
    return this.configs.verify(team.id, userId);
  }

  @Delete()
  @HttpCode(204)
  async remove(@Auth() { userId }: TAuthContext, @Team() team: TTeamContext) {
    await this.configs.remove(team.id, userId);
  }
}
