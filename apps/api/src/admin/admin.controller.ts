import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { Auth } from '../auth/auth.decorator.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { RequirePlatformRole } from '../authz/require-platform-role.decorator.js';
import { PlatformRole } from '../generated/prisma/client.js';
import { AdminStatsService } from './admin-stats.service.js';
import { AdminUsersService } from './admin-users.service.js';
import { ListUsersQuery, SetDisabledDto, SetRoleDto } from './admin.dto.js';

/** The admin area. Every route needs at least the ADMIN platform role. */
@Controller('admin')
@RequirePlatformRole(PlatformRole.ADMIN)
export class AdminController {
  constructor(
    private readonly stats: AdminStatsService,
    private readonly users: AdminUsersService,
  ) {}

  @Get('stats')
  getStats() {
    return this.stats.overview();
  }

  @Get('users')
  listUsers(@Query() query: ListUsersQuery) {
    return this.users.list(query);
  }

  @Get('users/:id')
  getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.detail(id);
  }

  @Patch('users/:id/disabled')
  @HttpCode(204)
  async setDisabled(
    @Auth() admin: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { disabled }: SetDisabledDto,
  ) {
    await this.users.setDisabled(admin, id, disabled);
  }

  /** Super admins only (checked in the service, with the other rules). */
  @Patch('users/:id/role')
  @HttpCode(204)
  async setRole(
    @Auth() admin: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { role }: SetRoleDto,
  ) {
    await this.users.setRole(admin, id, role);
  }
}
