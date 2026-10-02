import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { TCvAppearance } from '@repo/cv-core';
import { AuditService, type TAuditActor } from '../audit/audit.service.js';
import { CvPdfService } from '../cv-pdf/cv-pdf.service.js';
import type { Entitlements } from '../entitlements/entitlements.js';
import { EntitlementService } from '../entitlements/entitlements.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AssetsService } from '../storage/assets.service.js';
import { TemplatesService } from '../templates/templates.service.js';
import { UsageService } from '../usage/usage.service.js';
import {
  assertAppearanceAllowed,
  cvSizeBytes,
  parseAppearance,
  readSavedAppearance,
} from './cv-appearance.js';
import type {
  CreateCvDto,
  DraftCvPdfDto,
  ListCvsQuery,
  UpdateCvDto,
} from './cvs.dto.js';

const json = (value: unknown) => value as Prisma.InputJsonObject;

const NAME_MAX_LENGTH = 120;
const COPY_SUFFIX = ' (copy)';

const copyName = (name: string) =>
  `${name.slice(0, NAME_MAX_LENGTH - COPY_SUFFIX.length)}${COPY_SUFFIX}`;

type TNewCv = { name: string; data: unknown; appearance: TCvAppearance };

/** An embedded builder's end user, and what their embed allows. */
export type TExternalCvOwner = {
  organizationId: string;
  externalUserId: string;
  /** Templates the embed offers; a CV can't switch to another. */
  templateIds: string[];
};

/** Who CVs belong to: a platform user (by id), or an embed's end user. */
export type TCvOwner = string | TExternalCvOwner;

const isUser = (owner: TCvOwner): owner is string => typeof owner === 'string';

/** Every query on CVs is scoped to their owner with this. */
const ownedBy = (owner: TCvOwner): Prisma.CvWhereInput =>
  isUser(owner)
    ? { userId: owner }
    : {
        organizationId: owner.organizationId,
        externalUserId: owner.externalUserId,
      };

/** Who the audit log names when the owner acts themselves. */
const ownerActor = (owner: TCvOwner): TAuditActor =>
  isUser(owner)
    ? { type: 'USER', id: owner }
    : { type: 'EXTERNAL_USER', id: owner.externalUserId };

/**
 * CVs, always scoped to whoever owns them, and held to the plan: how many
 * they may have, which appearance options they may use, and how many PDFs
 * they may make. A user's plan is their own; an embedded user's is the
 * plan of the organization whose embed they came through.
 */
@Injectable()
export class CvsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementService,
    private readonly usage: UsageService,
    private readonly cvPdf: CvPdfService,
    private readonly audit: AuditService,
    private readonly templates: TemplatesService,
    private readonly assets: AssetsService,
  ) {}

  /** Newest first; `search` matches the CV name. */
  async list(owner: TCvOwner, { search, page, pageSize }: ListCvsQuery) {
    const where: Prisma.CvWhereInput = {
      ...ownedBy(owner),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.cv.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.cv.count({ where }),
    ]);
    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async get(owner: TCvOwner, id: string) {
    const cv = await this.prisma.cv.findFirst({
      where: { id, ...ownedBy(owner) },
    });
    if (!cv) throw new NotFoundException('CV not found');
    return cv;
  }

  /** `actor` is who the audit log names; the owner, unless an API key. */
  async create(
    owner: TCvOwner,
    { name, data, appearance }: CreateCvDto,
    actor: TAuditActor = ownerActor(owner),
  ) {
    const next = parseAppearance(appearance);
    const entitlements = await this.entitlementsOf(owner);
    await this.assertAllowed(owner, entitlements, next, null);
    return this.createWithinLimit(
      owner,
      entitlements,
      {
        name,
        data: await this.assets.moveInlinePhoto(owner, data),
        appearance: next,
      },
      { action: 'CV_CREATED', actor },
    );
  }

  /** A new CV with the same content and look; counts as creating one. */
  async duplicate(owner: TCvOwner, id: string) {
    const cv = await this.get(owner, id);
    const appearance = readSavedAppearance(cv.appearance);
    if (!appearance) {
      throw new BadRequestException("This CV's appearance can't be copied");
    }
    const entitlements = await this.entitlementsOf(owner);
    // A copy is a new CV: it can't keep a hidden template, or premium looks
    // a downgrade left on the original.
    await this.assertAllowed(owner, entitlements, appearance, null);
    return this.createWithinLimit(
      owner,
      entitlements,
      { name: copyName(cv.name), data: cv.data, appearance },
      { action: 'CV_DUPLICATED', actor: ownerActor(owner), copyOf: cv.id },
    );
  }

  async update(owner: TCvOwner, id: string, dto: UpdateCvDto) {
    const cv = await this.get(owner, id);
    let appearance: TCvAppearance | undefined;
    if (dto.appearance) {
      appearance = parseAppearance(dto.appearance);
      await this.assertAllowed(
        owner,
        await this.entitlementsOf(owner),
        appearance,
        readSavedAppearance(cv.appearance),
      );
    }
    const data =
      dto.data && (await this.assets.moveInlinePhoto(owner, dto.data));
    const contentChanged = data !== undefined || appearance !== undefined;
    const updated = await this.prisma.cv.update({
      where: { id },
      data: {
        name: dto.name,
        data: data && json(data),
        appearance: appearance && json(appearance),
        templateId: appearance?.templateId,
        sizeBytes: contentChanged
          ? cvSizeBytes(data ?? cv.data, appearance ?? cv.appearance)
          : undefined,
      },
    });
    return data === undefined ? updated : this.attachFiles(owner, updated);
  }

  async remove(
    owner: TCvOwner,
    id: string,
    actor: TAuditActor = ownerActor(owner),
  ) {
    const cv = await this.get(owner, id);
    await this.assets.removeForCv(id);
    await this.prisma.cv.delete({ where: { id } });
    await this.audit.record({
      actor,
      action: 'CV_DELETED',
      resource: { type: 'cv', id },
      organizationId: cv.organizationId,
    });
  }

  /** A PDF of the CV as saved. */
  async savedPdf(owner: TCvOwner, id: string) {
    const cv = await this.get(owner, id);
    const entitlements = await this.entitlementsOf(owner);
    return this.renderPdf(owner, entitlements, {
      data: cv.data,
      appearance: cv.appearance,
    });
  }

  /**
   * A PDF of the editor's current state. With `cvId` (a saved CV with
   * unsaved changes), what that CV already uses is allowed, as when saving.
   */
  async draftPdf(owner: TCvOwner, { cvId, data, appearance }: DraftCvPdfDto) {
    const next = parseAppearance(appearance);
    const previous = cvId
      ? readSavedAppearance((await this.get(owner, cvId)).appearance)
      : null;
    const entitlements = await this.entitlementsOf(owner);
    await this.assertAllowed(owner, entitlements, next, previous);
    return this.renderPdf(owner, entitlements, { data, appearance: next });
  }

  /**
   * Makes the files a saved CV links to its own (copying any another CV
   * uses, e.g. after duplicating), and stores the links if they changed.
   */
  private async attachFiles<T extends { id: string; data: Prisma.JsonValue }>(
    owner: TCvOwner,
    cv: T,
  ): Promise<T> {
    const data = await this.assets.attach(owner, cv.id, cv.data);
    if (data === cv.data) return cv;
    return (await this.prisma.cv.update({
      where: { id: cv.id },
      data: { data: json(data) },
    })) as unknown as T;
  }

  private entitlementsOf(owner: TCvOwner) {
    return isUser(owner)
      ? this.entitlements.forUser(owner)
      : this.entitlements.forOrganization(owner.organizationId);
  }

  /**
   * The plan's and the catalog's rules for an appearance, and for an
   * embedded user also their embed's templates (a CV can keep one it
   * already has).
   */
  private async assertAllowed(
    owner: TCvOwner,
    entitlements: Entitlements,
    next: TCvAppearance,
    previous: TCvAppearance | null,
  ) {
    assertAppearanceAllowed(
      entitlements,
      await this.templates.catalog(),
      next,
      previous,
    );
    if (
      !isUser(owner) &&
      owner.templateIds.length > 0 &&
      !owner.templateIds.includes(next.templateId) &&
      previous?.templateId !== next.templateId
    ) {
      throw new BadRequestException("This template isn't offered here.");
    }
  }

  /**
   * Renders a PDF if the plan allows one more this month, and counts it once
   * it's made (a failed render doesn't use up the allowance).
   */
  private async renderPdf(
    owner: TCvOwner,
    entitlements: Entitlements,
    cvDocument: { data: unknown; appearance: unknown },
  ) {
    entitlements.assertCan('cv.download.pdf');
    entitlements.assertAllowsAnother(
      'pdf.monthly',
      isUser(owner)
        ? await this.usage.countThisMonthForUser(owner, 'pdf.generated')
        : await this.usage.countThisMonth(
            owner.organizationId,
            'pdf.generated',
          ),
    );
    const pdf = await this.cvPdf.render(cvDocument);
    if (isUser(owner)) {
      await this.usage.recordForUser(owner, 'pdf.generated');
    } else {
      await this.usage.record(owner.organizationId, 'pdf.generated');
    }
    return pdf;
  }

  /**
   * Creates the CV if the plan allows one more for this owner (`cv.max` is
   * per user, and per embedded user). The organization's subscription row
   * is locked for the count, so two creates at once can't both take the
   * last free slot.
   */
  private async createWithinLimit(
    owner: TCvOwner,
    entitlements: Entitlements,
    { name, data, appearance }: TNewCv,
    audit: {
      action: 'CV_CREATED' | 'CV_DUPLICATED';
      actor: TAuditActor;
      copyOf?: string;
    },
  ) {
    const cv = await this.prisma.$transaction(async (tx) => {
      if (isUser(owner)) {
        await tx.$queryRaw`
          SELECT s."id" FROM "Subscription" s
          JOIN "Organization" o ON o."id" = s."organizationId"
          WHERE o."personalOwnerId" = ${owner}
          FOR UPDATE OF s`;
      } else {
        await tx.$queryRaw`
          SELECT s."id" FROM "Subscription" s
          WHERE s."organizationId" = ${owner.organizationId}
          FOR UPDATE OF s`;
      }
      entitlements.assertAllowsAnother(
        'cv.max',
        await tx.cv.count({ where: ownedBy(owner) }),
      );
      return tx.cv.create({
        data: {
          ...(isUser(owner)
            ? {
                user: { connect: { id: owner } },
                // A user's own CVs belong to their personal organization.
                organization: { connect: { personalOwnerId: owner } },
              }
            : {
                externalUser: { connect: { id: owner.externalUserId } },
                organization: { connect: { id: owner.organizationId } },
              }),
          name,
          data: json(data),
          appearance: json(appearance),
          templateId: appearance.templateId,
          sizeBytes: cvSizeBytes(data, appearance),
        },
      });
    });
    const saved = await this.attachFiles(owner, cv);
    await this.audit.record({
      actor: audit.actor,
      action: audit.action,
      resource: { type: 'cv', id: cv.id },
      organizationId: cv.organizationId,
      metadata: {
        templateId: appearance.templateId,
        ...(audit.copyOf && { copyOf: audit.copyOf }),
      },
    });
    return saved;
  }
}
