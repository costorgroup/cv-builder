import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { UsageModule } from '../usage/usage.module.js';
import { ApiKeyGuard } from './api-key.guard.js';
import {
  AccountApiKeysController,
  TeamApiKeysController,
} from './api-keys.controller.js';
import { ApiKeysService } from './api-keys.service.js';

@Module({
  imports: [AuthModule, EntitlementsModule, UsageModule],
  controllers: [AccountApiKeysController, TeamApiKeysController],
  providers: [ApiKeysService, ApiKeyGuard],
  exports: [ApiKeysService, ApiKeyGuard],
})
export class ApiKeysModule {}
