import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Auth } from '../auth/auth.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { TAuthContext } from '../auth/auth.types.js';
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

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Auth() { userId }: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.cvsService.remove(userId, id);
  }
}
