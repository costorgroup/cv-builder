import { Module } from '@nestjs/common';
import { CvPdfController } from './cv-pdf.controller.js';
import { CvPdfService } from './cv-pdf.service.js';

@Module({
  controllers: [CvPdfController],
  providers: [CvPdfService],
})
export class CvPdfModule {}
