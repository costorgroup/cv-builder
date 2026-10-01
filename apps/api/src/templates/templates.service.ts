import { Injectable, type OnModuleInit } from '@nestjs/common';
import {
  templateCatalogOf,
  templateSpecs,
  type TPublicTemplate,
  type TTemplateCatalog,
} from '@repo/cv-core';
import { TemplateStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** How long the published list is reused before it's read again. */
const CACHE_MS = 30_000;

const CODE_TEMPLATE_IDS = templateSpecs.map(({ id }) => id);

/**
 * Which templates are offered, and on which plans. The published list is
 * read on every CV save, so it's cached briefly; changes made here clear it
 * at once, and other API instances pick them up within `CACHE_MS`.
 */
@Injectable()
export class TemplatesService implements OnModuleInit {
  private cache?: { at: number; templates: Promise<TPublicTemplate[]> };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Templates added in code get a row, hidden and premium, so none goes
   * live before an admin publishes it.
   */
  async onModuleInit() {
    await this.prisma.template.createMany({
      data: CODE_TEMPLATE_IDS.map((id) => ({ id })),
      skipDuplicates: true,
    });
  }

  /** Published templates in order. Rows with no template in code are left out. */
  listPublic(): Promise<TPublicTemplate[]> {
    if (!this.cache || Date.now() - this.cache.at > CACHE_MS) {
      const templates = this.prisma.template.findMany({
        where: {
          status: TemplateStatus.PUBLISHED,
          id: { in: CODE_TEMPLATE_IDS },
        },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: { id: true, tier: true, category: true },
      });
      this.cache = { at: Date.now(), templates };
      // A failed read isn't kept.
      templates.catch(() => (this.cache = undefined));
    }
    return this.cache.templates;
  }

  async catalog(): Promise<TTemplateCatalog> {
    return templateCatalogOf(await this.listPublic());
  }

  /** After a change, so this instance serves it at once. */
  clearCache() {
    this.cache = undefined;
  }
}
