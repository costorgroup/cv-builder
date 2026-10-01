import { Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { monthStart } from '../usage/usage.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Months a billing period lasts, for turning prices into monthly revenue. */
const PERIOD_MONTHS = { MONTHLY: 1, QUARTERLY: 3, YEARLY: 12 } as const;

/** Platform-wide numbers for the admin overview; counts only, no people. */
@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(now = new Date()) {
    const thisMonth = monthStart(now);
    const activeSince = new Date(now.getTime() - 30 * DAY_MS);
    const [
      users,
      activeUsers,
      disabledUsers,
      newUsers,
      cvs,
      newCvs,
      storage,
      pdfs,
      paid,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { lastActiveAt: { gte: activeSince } } }),
      this.prisma.user.count({ where: { disabledAt: { not: null } } }),
      this.prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
      this.prisma.cv.count(),
      this.prisma.cv.count({ where: { createdAt: { gte: thisMonth } } }),
      this.prisma.cv.aggregate({ _sum: { sizeBytes: true } }),
      this.prisma.usageCounter.aggregate({
        where: { metric: 'pdf.generated', periodStart: thisMonth },
        _sum: { count: true },
      }),
      // Paid subscriptions that still give access.
      this.prisma.subscription.findMany({
        where: {
          provider: { not: 'none' },
          OR: [
            {
              status: {
                in: [
                  SubscriptionStatus.ACTIVE,
                  SubscriptionStatus.TRIALING,
                  SubscriptionStatus.PAST_DUE,
                ],
              },
            },
            {
              status: SubscriptionStatus.CANCELED,
              currentPeriodEnd: { gt: now },
            },
          ],
        },
        select: {
          status: true,
          cancelAtPeriodEnd: true,
          plan: { select: { key: true } },
          price: {
            select: { period: true, amountCents: true, currency: true },
          },
        },
      }),
    ]);

    // Estimated monthly recurring revenue, per currency, before tax and fees.
    const mrrCents: Record<string, number> = {};
    for (const { price, status } of paid) {
      if (!price || status === SubscriptionStatus.TRIALING) continue;
      mrrCents[price.currency] =
        (mrrCents[price.currency] ?? 0) +
        price.amountCents / PERIOD_MONTHS[price.period];
    }
    const byPlan: Record<string, number> = {};
    for (const { plan } of paid) byPlan[plan.key] = (byPlan[plan.key] ?? 0) + 1;

    return {
      users: {
        total: users,
        activeLast30Days: activeUsers,
        disabled: disabledUsers,
        newThisMonth: newUsers,
      },
      cvs: { total: cvs, newThisMonth: newCvs },
      storageBytes: storage._sum.sizeBytes ?? 0,
      pdfsThisMonth: Number(pdfs._sum.count ?? 0),
      subscriptions: {
        paid: paid.length,
        pastDue: paid.filter(
          ({ status }) => status === SubscriptionStatus.PAST_DUE,
        ).length,
        endingAtPeriodEnd: paid.filter(
          ({ cancelAtPeriodEnd }) => cancelAtPeriodEnd,
        ).length,
        byPlan,
      },
      estimatedMonthlyRevenue: Object.fromEntries(
        Object.entries(mrrCents).map(([currency, cents]) => [
          currency,
          Math.round(cents),
        ]),
      ),
    };
  }
}
