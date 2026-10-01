import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { monthStart } from '../usage/usage.service.js';
import type { ListAuditLogsQuery } from './admin.dto.js';

/** How many months back the usage trends go. */
const USAGE_MONTHS = 6;
const TOP_ACCOUNTS = 10;

/** "2026-09" for the month a date is in (UTC). */
const monthKey = (date: Date) => date.toISOString().slice(0, 7);

@Injectable()
export class AdminActivityService {
  constructor(private readonly prisma: PrismaService) {}

  /** The audit log, newest first, with who did each thing where known. */
  async auditLogs({
    action,
    actorId,
    resourceType,
    resourceId,
    page,
    pageSize,
  }: ListAuditLogsQuery) {
    const where: Prisma.AuditLogWhereInput = {
      ...(action && { action }),
      ...(actorId && { actorId }),
      ...(resourceType && { resourceType }),
      ...(resourceId && { resourceId }),
    };
    const [entries, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    // Emails of the people involved who still have an account.
    const userIds = [
      ...new Set(
        entries.flatMap((entry) => [
          ...(entry.actorType === 'USER' && entry.actorId
            ? [entry.actorId]
            : []),
          ...(entry.resourceType === 'user' && entry.resourceId
            ? [entry.resourceId]
            : []),
        ]),
      ),
    ];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });
    return {
      items: entries,
      emails: Object.fromEntries(users.map(({ id, email }) => [id, email])),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  /** Month-by-month trends and the heaviest accounts. */
  async usage(now = new Date()) {
    const since = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (USAGE_MONTHS - 1), 1),
    );
    const [signups, cvs, pdfs, byCvs, byStorage] = await Promise.all([
      this.prisma.$queryRaw<{ month: Date; count: bigint }[]>`
        SELECT date_trunc('month', "createdAt") AS month, count(*) AS count
        FROM "User" WHERE "createdAt" >= ${since} GROUP BY 1`,
      this.prisma.$queryRaw<{ month: Date; count: bigint }[]>`
        SELECT date_trunc('month', "createdAt") AS month, count(*) AS count
        FROM "Cv" WHERE "createdAt" >= ${since} GROUP BY 1`,
      this.prisma.usageCounter.groupBy({
        by: ['periodStart'],
        where: { metric: 'pdf.generated', periodStart: { gte: since } },
        _sum: { count: true },
      }),
      this.prisma.cv.groupBy({
        by: ['userId'],
        // Platform accounts; embedded users' CVs have no user.
        where: { userId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { userId: 'desc' } },
        take: TOP_ACCOUNTS,
      }),
      this.prisma.cv.groupBy({
        by: ['userId'],
        // Platform accounts; embedded users' CVs have no user.
        where: { userId: { not: null } },
        _sum: { sizeBytes: true },
        orderBy: { _sum: { sizeBytes: 'desc' } },
        take: TOP_ACCOUNTS,
      }),
    ]);

    const months = Array.from({ length: USAGE_MONTHS }, (_, index) =>
      monthKey(
        new Date(
          Date.UTC(since.getUTCFullYear(), since.getUTCMonth() + index, 1),
        ),
      ),
    );
    const byMonth = (rows: { month: Date; count: number | bigint }[]) => {
      const counts = new Map(
        rows.map(({ month, count }) => [monthKey(month), Number(count)]),
      );
      return months.map((month) => counts.get(month) ?? 0);
    };

    const userIds = [
      ...new Set([...byCvs, ...byStorage].map(({ userId }) => userId)),
    ].filter((id): id is string => !!id);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });
    const emailOf = new Map(users.map(({ id, email }) => [id, email]));

    return {
      months,
      signups: byMonth(signups),
      cvsCreated: byMonth(cvs),
      pdfsGenerated: byMonth(
        pdfs.map(({ periodStart, _sum }) => ({
          month: periodStart,
          count: _sum.count ?? 0,
        })),
      ),
      thisMonth: monthKey(monthStart(now)),
      mostCvs: byCvs.map(({ userId, _count }) => ({
        userId,
        email: userId ? (emailOf.get(userId) ?? null) : null,
        cvs: _count._all,
      })),
      mostStorage: byStorage.map(({ userId, _sum }) => ({
        userId,
        email: userId ? (emailOf.get(userId) ?? null) : null,
        bytes: _sum.sizeBytes ?? 0,
      })),
    };
  }
}
