import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { defaultTemplateSpec, findTemplateSpec } from '@repo/cv-core';
import { AuditService } from '../audit/audit.service.js';
import type { TAuthContext } from '../auth/auth.types.js';
import {
  PlatformRole,
  TemplateStatus,
  TemplateTier,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TemplatesService } from '../templates/templates.service.js';
import type { UpdateTemplateDto } from './admin.dto.js';

@Injectable()
export class AdminTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: TemplatesService,
    private readonly audit: AuditService,
  ) {}

  /** Every template in code, hidden ones too, with how many CVs use it. */
  async list() {
    const [rows, usage] = await Promise.all([
      this.prisma.template.findMany({
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.cv.groupBy({ by: ['templateId'], _count: { _all: true } }),
    ]);
    const cvs = new Map(
      usage.map((each) => [each.templateId, each._count._all]),
    );
    return rows.flatMap((row) => {
      const spec = findTemplateSpec(row.id);
      return spec
        ? [{ ...row, name: spec.name, cvs: cvs.get(row.id) ?? 0 }]
        : [];
    });
  }

  /**
   * Super admins only. The default template is where new CVs start, so it
   * stays published and free.
   */
  async update(admin: TAuthContext, id: string, dto: UpdateTemplateDto) {
    if (admin.role !== PlatformRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can change templates.');
    }
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template || !findTemplateSpec(id)) {
      throw new NotFoundException('Template not found');
    }
    if (
      id === defaultTemplateSpec.id &&
      (dto.status === TemplateStatus.HIDDEN ||
        dto.tier === TemplateTier.PREMIUM)
    ) {
      throw new BadRequestException(
        'New CVs start on the default template, so it stays published and free.',
      );
    }

    await this.prisma.template.update({
      where: { id },
      data: {
        tier: dto.tier,
        status: dto.status,
        category: dto.category === undefined ? undefined : dto.category || null,
        sortOrder: dto.sortOrder,
      },
    });
    this.templates.clearCache();
    await this.audit.record({
      actor: { type: 'USER', id: admin.userId },
      action: 'TEMPLATE_UPDATED',
      resource: { type: 'template', id },
      metadata: {
        changed: Object.keys(dto).filter(
          (key) => dto[key as keyof UpdateTemplateDto] !== undefined,
        ),
        ...(dto.tier && { tier: dto.tier }),
        ...(dto.status && { status: dto.status }),
      },
    });
  }
}
