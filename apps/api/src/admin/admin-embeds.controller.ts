import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { AuditService } from '../audit/audit.service.js';
import { Auth } from '../auth/auth.decorator.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { RequirePlatformRole } from '../authz/require-platform-role.decorator.js';
import { PlatformRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export class SetEmbedDisabledDto {
  @IsBoolean()
  disabled: boolean;
}

/** Most embeds the list loads; the admin table pages through them. */
const MAX_EMBEDS = 500;

/**
 * Every account's embeds: where they're shown, how many people use them,
 * and switching one off (e.g. for abuse). Admins and super admins.
 */
@Controller('admin/embeds')
@RequirePlatformRole(PlatformRole.ADMIN)
export class AdminEmbedsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Newest first, with their organization's embedded users and their CVs. */
  @Get()
  async list() {
    const embeds = await this.prisma.embedConfig.findMany({
      orderBy: { createdAt: 'desc' },
      take: MAX_EMBEDS,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            personalOwner: { select: { id: true, email: true } },
          },
        },
      },
    });
    const organizationIds = [...new Set(embeds.map((e) => e.organizationId))];
    const [users, cvs] = await Promise.all([
      this.prisma.externalUser.groupBy({
        by: ['organizationId'],
        // Owners' preview users aren't real users.
        where: {
          organizationId: { in: organizationIds },
          externalId: { not: 'cvb-preview' },
        },
        _count: { _all: true },
      }),
      this.prisma.cv.groupBy({
        by: ['organizationId'],
        where: {
          organizationId: { in: organizationIds },
          externalUserId: { not: null },
        },
        _count: { _all: true },
      }),
    ]);
    const countOf = (rows: typeof users, id: string) =>
      rows.find((row) => row.organizationId === id)?._count._all ?? 0;

    return embeds.map((embed) => ({
      id: embed.id,
      name: embed.name,
      publicKey: embed.publicKey,
      allowedOrigins: embed.allowedOrigins,
      disabled: !!embed.disabledAt,
      createdAt: embed.createdAt.toISOString(),
      organization: {
        id: embed.organization.id,
        name: embed.organization.name,
        type: embed.organization.type,
        owner: embed.organization.personalOwner,
      },
      externalUsers: countOf(users, embed.organizationId),
      externalCvs: countOf(cvs, embed.organizationId),
    }));
  }

  /** Turns an embed off or back on; sites stop (or start) showing it at once. */
  @Patch(':id/disabled')
  @HttpCode(204)
  async setDisabled(
    @Auth() admin: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { disabled }: SetEmbedDisabledDto,
  ) {
    const embed = await this.prisma.embedConfig.findUnique({ where: { id } });
    if (!embed) throw new NotFoundException('Embed not found');
    await this.prisma.embedConfig.update({
      where: { id },
      data: { disabledAt: disabled ? new Date() : null },
    });
    await this.audit.record({
      actor: { type: 'USER', id: admin.userId },
      action: 'EMBED_UPDATED',
      resource: { type: 'embed', id },
      organizationId: embed.organizationId,
      metadata: { disabled, byAdmin: true },
    });
  }
}
