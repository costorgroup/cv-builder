import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Auth } from '../auth/auth.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { PDF_THROTTLE } from '../cv-pdf/cv-pdf.constants.js';
import { CreateCvDto, ListCvsQuery, UpdateCvDto } from './cvs.dto.js';
import { CvsService } from './cvs.service.js';

@Controller('cvs')
@UseGuards(AuthGuard)
export class CvsController {
  constructor(private readonly cvsService: CvsService) {}

  @Get()
  list(@Auth() { userId }: TAuthContext, @Query() query: ListCvsQuery) {
    return this.cvsService.list(userId, query);
  }

  @Get(':id')
  get(
    @Auth() { userId }: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cvsService.get(userId, id);
  }

  @Post()
  create(@Auth() { userId }: TAuthContext, @Body() dto: CreateCvDto) {
    return this.cvsService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @Auth() { userId }: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCvDto,
  ) {
    return this.cvsService.update(userId, id, dto);
  }

  @Post(':id/duplicate')
  duplicate(
    @Auth() { userId }: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cvsService.duplicate(userId, id);
  }

  /** A PDF of the CV as saved. */
  @Post(':id/pdf')
  @HttpCode(200)
  @Throttle(PDF_THROTTLE)
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="cv.pdf"')
  async createPdf(
    @Auth() { userId }: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    return new StreamableFile(await this.cvsService.savedPdf(userId, id));
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Auth() { userId }: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.cvsService.remove(userId, id);
  }
}
