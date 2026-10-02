import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CvPdfModule } from '../cv-pdf/cv-pdf.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { UsageModule } from '../usage/usage.module.js';
import { CvDraftPdfController } from './cv-draft-pdf.controller.js';
import { CvsController } from './cvs.controller.js';
import { CvsService } from './cvs.service.js';

@Module({
  imports: [
    AuthModule,
    CvPdfModule,
    EntitlementsModule,
    UsageModule,
    StorageModule,
  ],
  controllers: [CvsController, CvDraftPdfController],
  providers: [CvsService],
  exports: [CvsService],
})
export class CvsModule {}
