import type { Prisma } from '../generated/prisma/client.js';
import type { TProviderSubscription } from './billing.types.js';

/**
 * Our subscription row for what the provider has: its plan (from the price),
 * status and billing period. Everything about access follows from these
 * (see `resolveEntitlements`); nothing is deleted when a subscription ends.
 */
export const subscriptionUpdateFrom = (
  provider: string,
  subscription: TProviderSubscription,
  price: { id: string; planId: string },
): Prisma.SubscriptionUncheckedUpdateInput => ({
  planId: price.planId,
  priceId: price.id,
  status: subscription.status,
  currentPeriodStart: subscription.currentPeriodStart,
  currentPeriodEnd: subscription.currentPeriodEnd,
  cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  canceledAt: subscription.canceledAt,
  trialEndsAt: subscription.trialEndsAt,
  provider,
  providerCustomerId: subscription.customerId,
  providerSubscriptionId: subscription.id,
});
