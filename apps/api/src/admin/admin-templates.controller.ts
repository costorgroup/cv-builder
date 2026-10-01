import { Body, Controller, Get, HttpCode, Param, Patch } from '@nestjs/common';
import { Auth } from '../auth/auth.decorator.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { RequirePlatformRole } from '../authz/require-platform-role.decorator.js';
import { PlatformRole } from '../generated/prisma/client.js';
import { AdminTemplatesService } from './admin-templates.service.js';
import { UpdateTemplateDto } from './admin.dto.js';

/** Which templates are offered. Admins can look; super admins change them. */
@Controller('admin/templates')
@RequirePlatformRole(PlatformRole.ADMIN)
export class AdminTemplatesController {
  constructor(private readonly templates: AdminTemplatesService) {}

  @Get()
  list() {
    return this.templates.list();
  }

  @Patch(':id')
  @HttpCode(204)
  async update(
    @Auth() admin: TAuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    await this.templates.update(admin, id, dto);
  }
}
