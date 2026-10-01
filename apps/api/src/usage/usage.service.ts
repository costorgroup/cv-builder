import { Injectable } from '@nestjs/common';
import type { TUsage, TUsageMetric } from '@repo/cv-core';
import type { Entitlements } from '../entitlements/entitlements.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** The first instant of `date`'s calendar month, UTC. */
export const monthStart = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

/**
 * Usage per organization. Metered things (PDFs made) are counted per month
 * in `UsageCounter`; standing ones (CVs, storage) are counted from the data.
 */
@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  /** Counts one more `metric` for the user's personal organization. */
  async recordForUser(userId: string, metric: TUsageMetric, now = new Date()) {
    // One statement, so concurrent records never lose a count or collide.
    await this.prisma.$executeRaw`
      INSERT INTO "UsageCounter" ("organizationId", "metric", "periodStart", "count", "updatedAt")
      SELECT o."id", ${metric}, ${monthStart(now)}, 1, ${now}
      FROM "Organization" o
      WHERE o."personalOwnerId" = ${userId}
      ON CONFLICT ("organizationId", "metric", "periodStart")
      DO UPDATE SET "count" = "UsageCounter"."count" + 1, "updatedAt" = ${now}`;
  }

  /** How often `metric` happened this month in the user's own organization. */
  async countThisMonthForUser(
    userId: string,
    metric: TUsageMetric,
    now = new Date(),
  ) {
    const counter = await this.prisma.usageCounter.findFirst({
      where: {
        organization: { personalOwnerId: userId },
        metric,
        periodStart: monthStart(now),
      },
      select: { count: true },
    });
    return Number(counter?.count ?? 0);
  }

  /** Counts one more `metric` for an organization. */
  async record(organizationId: string, metric: TUsageMetric, now = new Date()) {
    await this.prisma.$executeRaw`
      INSERT INTO "UsageCounter" ("organizationId", "metric", "periodStart", "count", "updatedAt")
      VALUES (${organizationId}, ${metric}, ${monthStart(now)}, 1, ${now})
      ON CONFLICT ("organizationId", "metric", "periodStart")
      DO UPDATE SET "count" = "UsageCounter"."count" + 1, "updatedAt" = ${now}`;
  }

  /** How often `metric` happened this month in an organization. */
  async countThisMonth(
    organizationId: string,
    metric: TUsageMetric,
    now = new Date(),
  ) {
    const counter = await this.prisma.usageCounter.findUnique({
      where: {
        organizationId_metric_periodStart: {
          organizationId,
          metric,
          periodStart: monthStart(now),
        },
      },
      select: { count: true },
    });
    return Number(counter?.count ?? 0);
  }

  /** An organization's usage of each limit that applies to CVs. */
  async summary(
    organizationId: string,
    entitlements: Entitlements,
    now = new Date(),
  ): Promise<{ cvs: TUsage; storageBytes: TUsage; pdfsThisMonth: TUsage }> {
    const [cvs, pdfs] = await this.prisma.$transaction([
      this.prisma.cv.aggregate({
        where: { organizationId },
        _count: true,
        _sum: { sizeBytes: true },
      }),
      this.prisma.usageCounter.findUnique({
        where: {
          organizationId_metric_periodStart: {
            organizationId,
            metric: 'pdf.generated',
            periodStart: monthStart(now),
          },
        },
        select: { count: true },
      }),
    ]);
    return {
      cvs: { used: cvs._count, max: entitlements.limit('cv.max') },
      storageBytes: {
        used: cvs._sum.sizeBytes ?? 0,
        max: entitlements.limit('storage.bytes'),
      },
      pdfsThisMonth: {
        used: Number(pdfs?.count ?? 0),
        max: entitlements.limit('pdf.monthly'),
      },
    };
  }
}
