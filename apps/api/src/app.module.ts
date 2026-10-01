import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AccountModule } from './account/account.module.js';
import { AdminModule } from './admin/admin.module.js';
import { ApiKeysModule } from './api-keys/api-keys.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BillingModule } from './billing/billing.module.js';
import { CvPdfModule } from './cv-pdf/cv-pdf.module.js';
import { CvsModule } from './cvs/cvs.module.js';
import { EmbedsModule } from './embeds/embeds.module.js';
import { LocationsModule } from './locations/locations.module.js';
import { TeamsModule } from './organizations/teams.module.js';
import { PlansModule } from './plans/plans.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PublicApiModule } from './public-api/public-api.module.js';
import { TemplatesModule } from './templates/templates.module.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuditModule,
    TemplatesModule,
    AuthModule,
    AccountModule,
    AdminModule,
    BillingModule,
    PlansModule,
    TeamsModule,
    ApiKeysModule,
    PublicApiModule,
    EmbedsModule,
    CvPdfModule,
    CvsModule,
    LocationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
