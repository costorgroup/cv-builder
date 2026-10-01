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
  Query,
  UseFilters,
} from '@nestjs/common';
import { Auth } from '../auth/auth.decorator.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { RequirePlatformRole } from '../authz/require-platform-role.decorator.js';
import { PaymentProviderErrorFilter } from '../billing/payment-provider-error.filter.js';
import { PlatformRole } from '../generated/prisma/client.js';
import { AdminActivityService } from './admin-activity.service.js';
import { AdminBillingService } from './admin-billing.service.js';
import {
  AddPriceDto,
  ListAuditLogsQuery,
  ListSubscriptionsQuery,
  OverridesDto,
  UpdatePlanDto,
} from './admin.dto.js';

/**
 * Subscriptions, plans, usage and the audit log. Admins can look; changes
 * to plans and extras are for super admins (checked in the service).
 */
@Controller('admin')
@RequirePlatformRole(PlatformRole.ADMIN)
@UseFilters(PaymentProviderErrorFilter)
export class AdminBillingController {
  constructor(
    private readonly billing: AdminBillingService,
    private readonly activity: AdminActivityService,
  ) {}

  @Get('subscriptions')
  listSubscriptions(@Query() query: ListSubscriptionsQuery) {
    return this.billing.listSubscriptions(query);
  }

  @Patch('subscriptions/:id/overrides')
  @HttpCode(204)
  async setOverrides(
    @Auth() admin: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OverridesDto,
  ) {
    await this.billing.setOverrides(admin, id, dto);
  }

  @Get('plans')
  listPlans() {
    return this.billing.listPlans();
  }

  @Patch('plans/:id')
  @HttpCode(204)
  async updatePlan(
    @Auth() admin: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    await this.billing.updatePlan(admin, id, dto);
  }

  @Post('plans/:id/prices')
  addPrice(
    @Auth() admin: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddPriceDto,
  ) {
    return this.billing.addPrice(admin, id, dto);
  }

  @Delete('prices/:id')
  @HttpCode(204)
  async retirePrice(
    @Auth() admin: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.billing.retirePrice(admin, id);
  }

  @Post('plans/sync')
  @HttpCode(200)
  syncCatalog(@Auth() admin: TAuthContext) {
    return this.billing.syncCatalog(admin);
  }

  @Get('usage')
  usage() {
    return this.activity.usage();
  }

  @Get('audit-logs')
  auditLogs(@Query() query: ListAuditLogsQuery) {
    return this.activity.auditLogs(query);
  }
}
