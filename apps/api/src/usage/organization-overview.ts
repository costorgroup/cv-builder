import type { TAccountOverview } from '@repo/cv-core';
import type { EntitlementService } from '../entitlements/entitlements.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { UsageService } from './usage.service.js';

/**
 * An organization's plan, subscription and usage, for its dashboard: a
 * user's own (personal organization) or a team's.
 */
export const organizationOverview = async (
  services: {
    prisma: PrismaService;
    entitlements: EntitlementService;
    usage: UsageService;
  },
  organizationId: string,
): Promise<TAccountOverview> => {
  const [subscription, entitlements] = await Promise.all([
    services.prisma.subscription.findUnique({
      where: { organizationId },
      select: {
        status: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        trialEndsAt: true,
        provider: true,
        price: { select: { period: true } },
        plan: { select: { key: true, name: true } },
      },
    }),
    services.entitlements.forOrganization(organizationId),
  ]);

  return {
    plan: entitlements.plan,
    subscription: subscription && {
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
      period: subscription.price?.period ?? null,
      managed: subscription.provider !== 'none',
    },
    usage: await services.usage.summary(organizationId, entitlements),
  };
};
