import {
  Body,
  Controller,
  Header,
  HttpCode,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { CvPdfService } from './cv-pdf.service.js';

@Controller('cv')
export class CvPdfController {
  constructor(private readonly cvPdfService: CvPdfService) {}

  @Post('pdf')
  @HttpCode(200)
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="cv.pdf"')
  async createPdf(@Body() cvDocument: unknown): Promise<StreamableFile> {
    return new StreamableFile(await this.cvPdfService.render(cvDocument));
  }
}
