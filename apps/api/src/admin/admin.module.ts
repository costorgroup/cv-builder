import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BillingModule } from '../billing/billing.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { UsageModule } from '../usage/usage.module.js';
import { AdminActivityService } from './admin-activity.service.js';
import { AdminBillingController } from './admin-billing.controller.js';
import { AdminBillingService } from './admin-billing.service.js';
import { AdminTemplatesController } from './admin-templates.controller.js';
import { AdminTemplatesService } from './admin-templates.service.js';
import { AdminStatsService } from './admin-stats.service.js';
import { AdminUsersService } from './admin-users.service.js';
import { AdminController } from './admin.controller.js';

@Module({
  imports: [AuthModule, BillingModule, EntitlementsModule, UsageModule],
  controllers: [
    AdminController,
    AdminBillingController,
    AdminTemplatesController,
  ],
  providers: [
    AdminStatsService,
    AdminUsersService,
    AdminBillingService,
    AdminActivityService,
    AdminTemplatesService,
  ],
})
export class AdminModule {}
