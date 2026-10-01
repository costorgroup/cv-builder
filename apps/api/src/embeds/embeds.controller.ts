import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { ApiPrincipal, RequireApiScopes } from '../api-keys/api-key.guard.js';
import type { TApiPrincipal } from '../api-keys/api-keys.service.js';
import { Auth } from '../auth/auth.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { RequireTeamRole, Team } from '../authz/require-team-role.decorator.js';
import type { TTeamContext } from '../authz/team-access.guard.js';
import { PDF_THROTTLE } from '../cv-pdf/cv-pdf.constants.js';
import {
  CreateCvDto,
  DraftCvPdfDto,
  ListCvsQuery,
  UpdateCvDto,
} from '../cvs/cvs.dto.js';
import { CvsService } from '../cvs/cvs.service.js';
import { OrganizationRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  EmbedAuthGuard,
  EmbedSession,
  type TEmbedSession,
} from './embed-auth.guard.js';
import {
  EmbedConfigDto,
  ExchangeEmbedDto,
  LaunchEmbedDto,
} from './embeds.dto.js';
import { EmbedsService } from './embeds.service.js';

/** The signed-in user's own embeds. */
@Controller('account/embeds')
@UseGuards(AuthGuard)
export class AccountEmbedsController {
  constructor(
    private readonly embeds: EmbedsService,
    private readonly prisma: PrismaService,
  ) {}

  private async organizationId(userId: string) {
    const { id } = await this.prisma.organization.findUniqueOrThrow({
      where: { personalOwnerId: userId },
      select: { id: true },
    });
    return id;
  }

  @Get()
  async list(@Auth() { userId }: TAuthContext) {
    return this.embeds.list(await this.organizationId(userId));
  }

  @Post()
  async create(@Auth() { userId }: TAuthContext, @Body() dto: EmbedConfigDto) {
    return this.embeds.create(await this.organizationId(userId), userId, dto);
  }

  @Patch(':id')
  async update(
    @Auth() { userId }: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EmbedConfigDto,
  ) {
    return this.embeds.update(
      await this.organizationId(userId),
      userId,
      id,
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Auth() { userId }: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.embeds.remove(await this.organizationId(userId), userId, id);
  }
}

/** A team's embeds; its owners and admins manage them. */
@Controller('teams/:teamId/embeds')
@RequireTeamRole(OrganizationRole.ADMIN)
export class TeamEmbedsController {
  constructor(private readonly embeds: EmbedsService) {}

  @Get()
  list(@Team() team: TTeamContext) {
    return this.embeds.list(team.id);
  }

  @Post()
  create(
    @Auth() { userId }: TAuthContext,
    @Team() team: TTeamContext,
    @Body() dto: EmbedConfigDto,
  ) {
    return this.embeds.create(team.id, userId, dto);
  }

  @Patch(':id')
  update(
    @Auth() { userId }: TAuthContext,
    @Team() team: TTeamContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EmbedConfigDto,
  ) {
    return this.embeds.update(team.id, userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Auth() { userId }: TAuthContext,
    @Team() team: TTeamContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.embeds.remove(team.id, userId, id);
  }
}

class V1EmbedLaunch {
  @ApiProperty({ description: 'Single use; expires a minute after it’s made.' })
  launchToken: string;

  @ApiProperty({ format: 'date-time' })
  expiresAt: string;
}

/** `/v1/embed/sessions`: the customer's server starts an end user's session. */
@ApiTags('Embedding')
@Controller('v1/embed/sessions')
export class V1EmbedSessionsController {
  constructor(private readonly embeds: EmbedsService) {}

  @Post()
  @RequireApiScopes('embed:session')
  @ApiOperation({
    summary: 'Start an embedded builder session',
    description:
      "Scope: embed:session. Call from your server when one of your users opens the builder, then pass the launch token to the page (to `CvBuilder.mount`). The user is created on first launch, within the plan's limit of embedded users; the same `externalUserId` always reaches the same CVs.",
  })
  @ApiCreatedResponse({ type: V1EmbedLaunch })
  launch(
    @ApiPrincipal() principal: TApiPrincipal,
    @Body() dto: LaunchEmbedDto,
  ) {
    return this.embeds.launch(principal.organizationId, dto);
  }
}

/**
 * What the embedded builder itself calls, from inside the frame: the
 * public frame settings, the launch-token exchange, and the end user's CVs.
 */
@Controller('embed/v1')
export class EmbedRuntimeController {
  constructor(
    private readonly embeds: EmbedsService,
    private readonly cvs: CvsService,
  ) {}

  /** Public: who may frame the embed, for its frame-ancestors header. */
  @Get('frames/:publicKey')
  frameOrigins(@Param('publicKey') publicKey: string) {
    return this.embeds.frameOrigins(publicKey);
  }

  @Post('sessions/exchange')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  exchange(@Body() dto: ExchangeEmbedDto, @Req() req: Request) {
    // The frame's own origin when it calls; the parent page's comes along
    // from the loader as `Origin` only in some browsers, so it's optional.
    const parent = req.headers['x-embed-parent-origin'];
    return this.embeds.exchange(
      dto.publicKey,
      dto.launchToken,
      typeof parent === 'string' && parent ? parent : undefined,
    );
  }

  /** The embed as it runs now, e.g. after its owner changed it. */
  @Get('config')
  @UseGuards(EmbedAuthGuard)
  config(@EmbedSession() session: TEmbedSession) {
    return session.config;
  }

  @Get('cvs')
  @UseGuards(EmbedAuthGuard)
  list(@EmbedSession() session: TEmbedSession, @Query() query: ListCvsQuery) {
    return this.cvs.list(session.owner, query);
  }

  @Get('cvs/:id')
  @UseGuards(EmbedAuthGuard)
  get(
    @EmbedSession() session: TEmbedSession,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cvs.get(session.owner, id);
  }

  @Post('cvs')
  @UseGuards(EmbedAuthGuard)
  create(@EmbedSession() session: TEmbedSession, @Body() dto: CreateCvDto) {
    return this.cvs.create(session.owner, dto);
  }

  @Patch('cvs/:id')
  @UseGuards(EmbedAuthGuard)
  update(
    @EmbedSession() session: TEmbedSession,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCvDto,
  ) {
    return this.cvs.update(session.owner, id, dto);
  }

  @Delete('cvs/:id')
  @HttpCode(204)
  @UseGuards(EmbedAuthGuard)
  async remove(
    @EmbedSession() session: TEmbedSession,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.cvs.remove(session.owner, id);
  }

  /** A PDF of a saved CV, if the embed offers downloads. */
  @Post('cvs/:id/pdf')
  @HttpCode(200)
  @Throttle(PDF_THROTTLE)
  @UseGuards(EmbedAuthGuard)
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="cv.pdf"')
  async savedPdf(
    @EmbedSession() session: TEmbedSession,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    assertDownloads(session);
    return new StreamableFile(await this.cvs.savedPdf(session.owner, id));
  }

  /** A PDF of the editor's current state, if the embed offers downloads. */
  @Post('cvs/draft-pdf')
  @HttpCode(200)
  @Throttle(PDF_THROTTLE)
  @UseGuards(EmbedAuthGuard)
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="cv.pdf"')
  async draftPdf(
    @EmbedSession() session: TEmbedSession,
    @Body() dto: DraftCvPdfDto,
  ): Promise<StreamableFile> {
    assertDownloads(session);
    return new StreamableFile(await this.cvs.draftPdf(session.owner, dto));
  }
}

const assertDownloads = (session: TEmbedSession) => {
  if (!session.config.features.includes('pdf.download')) {
    throw new ForbiddenException("Downloads aren't offered here.");
  }
};
