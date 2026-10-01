import {
  Body,
  ConflictException,
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
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPrincipal, RequireApiScopes } from '../api-keys/api-key.guard.js';
import type { TApiPrincipal } from '../api-keys/api-keys.service.js';
import { CreateCvDto, ListCvsQuery, UpdateCvDto } from '../cvs/cvs.dto.js';
import { CvsService } from '../cvs/cvs.service.js';
import type { Cv } from '../generated/prisma/client.js';
import { V1Cv, V1CvPage, V1Error } from './v1.schemas.js';

/** A CV as the public API returns it: no internal ids or sizes. */
const toPublicCv = (cv: Cv) => ({
  id: cv.id,
  name: cv.name,
  templateId: cv.templateId,
  data: cv.data,
  appearance: cv.appearance,
  createdAt: cv.createdAt.toISOString(),
  updatedAt: cv.updatedAt.toISOString(),
});

/**
 * Whose CVs the key works with. A personal account's key acts on its
 * owner's CVs; teams have no CVs of their own yet (their keys will manage
 * embedded users' CVs).
 */
const ownerOf = ({ ownerUserId }: TApiPrincipal) => {
  if (!ownerUserId) {
    throw new ConflictException(
      "Team API keys can't manage CVs yet. Use a key from your own account.",
    );
  }
  return ownerUserId;
};

const actorOf = ({ apiKeyId }: TApiPrincipal) =>
  ({ type: 'API_KEY', id: apiKeyId }) as const;

/**
 * `/v1/cvs`: the same CVs, limits and checks as the web app, with an API
 * key instead of a session.
 */
@ApiTags('CVs')
@ApiConflictResponse({
  type: V1Error,
  description: "A team's key: teams have no CVs of their own yet.",
})
@Controller('v1/cvs')
export class V1CvsController {
  constructor(private readonly cvs: CvsService) {}

  /** Newest first; `search` matches the name. */
  @Get()
  @RequireApiScopes('cv:read')
  @ApiOperation({ summary: 'List CVs', description: 'Scope: cv:read.' })
  @ApiOkResponse({ type: V1CvPage })
  async list(
    @ApiPrincipal() principal: TApiPrincipal,
    @Query() query: ListCvsQuery,
  ) {
    const page = await this.cvs.list(ownerOf(principal), query);
    return { ...page, items: page.items.map(toPublicCv) };
  }

  @Get(':id')
  @RequireApiScopes('cv:read')
  @ApiOperation({ summary: 'Get a CV', description: 'Scope: cv:read.' })
  @ApiOkResponse({ type: V1Cv })
  @ApiNotFoundResponse({ type: V1Error })
  async get(
    @ApiPrincipal() principal: TApiPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return toPublicCv(await this.cvs.get(ownerOf(principal), id));
  }

  @Post()
  @RequireApiScopes('cv:create')
  @ApiOperation({
    summary: 'Create a CV',
    description:
      "Scope: cv:create. Counts towards the plan's CV limit; premium templates and options need a plan with them.",
  })
  @ApiCreatedResponse({ type: V1Cv })
  async create(
    @ApiPrincipal() principal: TApiPrincipal,
    @Body() dto: CreateCvDto,
  ) {
    return toPublicCv(
      await this.cvs.create(ownerOf(principal), dto, actorOf(principal)),
    );
  }

  @Patch(':id')
  @RequireApiScopes('cv:update')
  @ApiOperation({
    summary: 'Update a CV',
    description:
      'Scope: cv:update. Only the fields sent change; options the CV already uses may stay after a downgrade.',
  })
  @ApiOkResponse({ type: V1Cv })
  @ApiNotFoundResponse({ type: V1Error })
  async update(
    @ApiPrincipal() principal: TApiPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCvDto,
  ) {
    return toPublicCv(await this.cvs.update(ownerOf(principal), id, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  @RequireApiScopes('cv:delete')
  @ApiOperation({ summary: 'Delete a CV', description: 'Scope: cv:delete.' })
  @ApiNoContentResponse({ description: 'Deleted.' })
  @ApiNotFoundResponse({ type: V1Error })
  async remove(
    @ApiPrincipal() principal: TApiPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.cvs.remove(ownerOf(principal), id, actorOf(principal));
  }

  /** The CV as saved, as a PDF; counts towards the monthly PDF limit. */
  @Get(':id/pdf')
  @RequireApiScopes('cv:export')
  @ApiOperation({
    summary: 'Download a CV as PDF',
    description:
      "Scope: cv:export. The CV as saved, on A4. Counts towards the plan's monthly PDFs.",
  })
  @ApiProduces('application/pdf')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  @ApiNotFoundResponse({ type: V1Error })
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="cv.pdf"')
  async pdf(
    @ApiPrincipal() principal: TApiPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    return new StreamableFile(await this.cvs.savedPdf(ownerOf(principal), id));
  }
}
