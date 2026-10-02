import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Auth } from '../auth/auth.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { AssetsService, MAX_PHOTO_BYTES } from './assets.service.js';

/** The parts of an uploaded file this API reads. */
export type TUploadedFile = { buffer: Buffer; size: number };

/** Uploads are kept in memory (they're small) and capped before reading. */
export const PHOTO_UPLOAD = FileInterceptor('file', {
  limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
});

export const UPLOAD_THROTTLE = { default: { limit: 30, ttl: 60_000 } };

export const requireFile = (file: TUploadedFile | undefined) => {
  if (!file) throw new BadRequestException('Send the image as "file".');
  return file.buffer;
};

@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  /** A photo for one of the signed-in user's CVs; returns its link. */
  @Post('photos')
  @UseGuards(AuthGuard)
  @Throttle(UPLOAD_THROTTLE)
  @UseInterceptors(PHOTO_UPLOAD)
  uploadPhoto(
    @Auth() { userId }: TAuthContext,
    @UploadedFile() file: TUploadedFile | undefined,
  ) {
    return this.assets.uploadPhoto(userId, requireFile(file));
  }

  /**
   * A stored file. Public to whoever has the link (the id is random): the
   * editor, an embed and the PDF renderer all load it as a plain image.
   * Never changes, so browsers may keep it.
   */
  @Get(':id')
  async get(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { body, contentType, sizeBytes } = await this.assets.open(id);
    response.set({
      'Content-Type': contentType,
      'Content-Length': String(sizeBytes),
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    });
    return new StreamableFile(body);
  }
}
