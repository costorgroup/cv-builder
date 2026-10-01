import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { TeamsModule } from '../organizations/teams.module.js';
import { UsageModule } from '../usage/usage.module.js';
import { AccountController } from './account.controller.js';
import { AccountService } from './account.service.js';

@Module({
  imports: [AuthModule, EntitlementsModule, TeamsModule, UsageModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
