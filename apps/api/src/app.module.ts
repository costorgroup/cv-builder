import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CvPdfModule } from './cv-pdf/cv-pdf.module.js';

@Module({
  imports: [CvPdfModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
