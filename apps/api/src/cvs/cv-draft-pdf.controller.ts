import {
  Body,
  Controller,
  Header,
  HttpCode,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Auth } from '../auth/auth.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { PDF_THROTTLE } from '../cv-pdf/cv-pdf.constants.js';
import { DraftCvPdfDto } from './cvs.dto.js';
import { CvsService } from './cvs.service.js';

@Controller('cv')
@UseGuards(AuthGuard)
export class CvDraftPdfController {
  constructor(private readonly cvsService: CvsService) {}

  /**
   * A PDF of the CV in the body, for one that isn't saved yet (or has unsaved
   * changes). Saved CVs use `POST /cvs/:id/pdf`.
   */
  @Post('pdf')
  @HttpCode(200)
  @Throttle(PDF_THROTTLE)
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="cv.pdf"')
  async createPdf(
    @Auth() { userId }: TAuthContext,
    @Body() dto: DraftCvPdfDto,
  ): Promise<StreamableFile> {
    return new StreamableFile(await this.cvsService.draftPdf(userId, dto));
  }
}
