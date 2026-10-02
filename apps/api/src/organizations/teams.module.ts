import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { MailModule } from '../mail/mail.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { UsageModule } from '../usage/usage.module.js';
import { InvitesController } from './invites.controller.js';
import { TeamsController } from './teams.controller.js';
import { TeamsService } from './teams.service.js';

/** Teams, their members and invites. */
@Module({
  imports: [
    AuthModule,
    EntitlementsModule,
    MailModule,
    UsageModule,
    StorageModule,
  ],
  controllers: [TeamsController, InvitesController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
