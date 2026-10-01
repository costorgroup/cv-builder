import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { CvsModule } from '../cvs/cvs.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { UsageModule } from '../usage/usage.module.js';
import { EmbedAuthGuard } from './embed-auth.guard.js';
import { EmbedTokens } from './embed-token.js';
import {
  AccountEmbedsController,
  EmbedRuntimeController,
  TeamEmbedsController,
} from './embeds.controller.js';
import { EmbedsService } from './embeds.service.js';

/** Embedded builders: their setup, sessions and the frame's API. */
@Module({
  imports: [
    AuthModule,
    ApiKeysModule,
    CvsModule,
    EntitlementsModule,
    UsageModule,
  ],
  controllers: [
    AccountEmbedsController,
    TeamEmbedsController,
    EmbedRuntimeController,
  ],
  providers: [EmbedsService, EmbedTokens, EmbedAuthGuard],
  exports: [EmbedsService],
})
export class EmbedsModule {}
