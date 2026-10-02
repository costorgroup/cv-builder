import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPrincipal, RequireApiScopes } from '../api-keys/api-key.guard.js';
import type { TApiPrincipal } from '../api-keys/api-keys.service.js';
import { CreateCvDto, ListCvsQuery, UpdateCvDto } from '../cvs/cvs.dto.js';
import { CvsService, type TCvOwner } from '../cvs/cvs.service.js';
import type { Cv } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
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

/** Which embedded user's CVs a request is about, by the customer's own id. */
const EXTERNAL_USER = 'externalUserId';

const ForExternalUser = () =>
  ApiQuery({
    name: EXTERNAL_USER,
    required: false,
    description:
      "Your own id for one of your embedded users (as sent to /v1/embed/sessions): the request is about their CVs. Required with a team's key; without it, a personal account's key works on the account's own CVs.",
  });

const actorOf = ({ apiKeyId }: TApiPrincipal) =>
  ({ type: 'API_KEY', id: apiKeyId }) as const;

/**
 * `/v1/cvs`: the same CVs, limits and checks as the web app, with an API
 * key instead of a session.
 */
@ApiTags('CVs')
@ApiBadRequestResponse({
  type: V1Error,
  description: "A team's key without externalUserId.",
})
@Controller('v1/cvs')
export class V1CvsController {
  constructor(
    private readonly cvs: CvsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Whose CVs the request works with: an embedded user of the key's
   * organization when `externalUserId` is given (they must have opened an
   * embed before, so the plan's limit on them holds), otherwise the owner
   * of a personal account. Teams have no CVs of their own.
   */
  private async ownerOf(
    principal: TApiPrincipal,
    externalId: string | undefined,
  ): Promise<TCvOwner> {
    if (externalId) {
      const externalUser = await this.prisma.externalUser.findUnique({
        where: {
          organizationId_externalId: {
            organizationId: principal.organizationId,
            externalId,
          },
        },
        select: { id: true },
      });
      if (!externalUser) {
        throw new NotFoundException(
          'No embedded user with that externalUserId. They appear once they first open your embed.',
        );
      }
      return {
        organizationId: principal.organizationId,
        externalUserId: externalUser.id,
        templateIds: [],
      };
    }
    if (!principal.ownerUserId) {
      throw new BadRequestException(
        "A team's key works with its embedded users' CVs: add ?externalUserId=…",
      );
    }
    return principal.ownerUserId;
  }

  /** Newest first; `search` matches the name. */
  @Get()
  @RequireApiScopes('cv:read')
  @ForExternalUser()
  @ApiOperation({ summary: 'List CVs', description: 'Scope: cv:read.' })
  @ApiOkResponse({ type: V1CvPage })
  async list(
    @ApiPrincipal() principal: TApiPrincipal,
    @Query() query: ListCvsQuery,
    @Query(EXTERNAL_USER) externalId?: string,
  ) {
    const page = await this.cvs.list(
      await this.ownerOf(principal, externalId),
      query,
    );
    return { ...page, items: page.items.map(toPublicCv) };
  }

  @Get(':id')
  @RequireApiScopes('cv:read')
  @ForExternalUser()
  @ApiOperation({ summary: 'Get a CV', description: 'Scope: cv:read.' })
  @ApiOkResponse({ type: V1Cv })
  @ApiNotFoundResponse({ type: V1Error })
  async get(
    @ApiPrincipal() principal: TApiPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Query(EXTERNAL_USER) externalId?: string,
  ) {
    return toPublicCv(
      await this.cvs.get(await this.ownerOf(principal, externalId), id),
    );
  }

  @Post()
  @RequireApiScopes('cv:create')
  @ForExternalUser()
  @ApiOperation({
    summary: 'Create a CV',
    description:
      "Scope: cv:create. Counts towards the plan's CV limit; premium templates and options need a plan with them.",
  })
  @ApiCreatedResponse({ type: V1Cv })
  async create(
    @ApiPrincipal() principal: TApiPrincipal,
    @Body() dto: CreateCvDto,
    @Query(EXTERNAL_USER) externalId?: string,
  ) {
    return toPublicCv(
      await this.cvs.create(
        await this.ownerOf(principal, externalId),
        dto,
        actorOf(principal),
      ),
    );
  }

  @Patch(':id')
  @RequireApiScopes('cv:update')
  @ForExternalUser()
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
    @Query(EXTERNAL_USER) externalId?: string,
  ) {
    return toPublicCv(
      await this.cvs.update(await this.ownerOf(principal, externalId), id, dto),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  @RequireApiScopes('cv:delete')
  @ForExternalUser()
  @ApiOperation({ summary: 'Delete a CV', description: 'Scope: cv:delete.' })
  @ApiNoContentResponse({ description: 'Deleted.' })
  @ApiNotFoundResponse({ type: V1Error })
  async remove(
    @ApiPrincipal() principal: TApiPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Query(EXTERNAL_USER) externalId?: string,
  ) {
    await this.cvs.remove(
      await this.ownerOf(principal, externalId),
      id,
      actorOf(principal),
    );
  }

  /** The CV as saved, as a PDF; counts towards the monthly PDF limit. */
  @Get(':id/pdf')
  @RequireApiScopes('cv:export')
  @ForExternalUser()
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
    @Query(EXTERNAL_USER) externalId?: string,
  ): Promise<StreamableFile> {
    return new StreamableFile(
      await this.cvs.savedPdf(await this.ownerOf(principal, externalId), id),
    );
  }
}
