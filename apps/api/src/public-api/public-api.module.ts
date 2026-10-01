import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { CvsModule } from '../cvs/cvs.module.js';
import { V1EmbedSessionsController } from '../embeds/embeds.controller.js';
import { EmbedsModule } from '../embeds/embeds.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { UsageModule } from '../usage/usage.module.js';
import { V1CvsController } from './v1-cvs.controller.js';
import { V1TemplatesController } from './v1-templates.controller.js';
import { V1UsageController } from './v1-usage.controller.js';

/** The public API under `/v1`, for API keys. */
@Module({
  imports: [
    ApiKeysModule,
    CvsModule,
    EmbedsModule,
    EntitlementsModule,
    UsageModule,
  ],
  controllers: [
    V1CvsController,
    V1TemplatesController,
    V1UsageController,
    V1EmbedSessionsController,
  ],
})
export class PublicApiModule {}
