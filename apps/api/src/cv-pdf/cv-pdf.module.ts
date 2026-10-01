import { Module } from '@nestjs/common';
import { CvPdfService } from './cv-pdf.service.js';

/** Renders CV documents as PDFs; the CV routes decide what may be rendered. */
@Module({
  providers: [CvPdfService],
  exports: [CvPdfService],
})
export class CvPdfModule {}
