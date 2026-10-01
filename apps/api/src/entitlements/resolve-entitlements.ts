import {
  isFeature,
  isLimit,
  LIMITS,
  type TFeature,
  type TLimit,
  type TLimitValue,
} from '@repo/cv-core';
import {
  SubscriptionStatus,
  type Plan,
  type Prisma,
  type Subscription,
} from '../generated/prisma/client.js';
import { Entitlements } from './entitlements.js';

export type TPlanRecord = Pick<Plan, 'key' | 'name' | 'features' | 'limits'>;

export type TSubscriptionRecord = Pick<
  Subscription,
  'status' | 'currentPeriodEnd' | 'trialEndsAt' | 'overrides'
> & { plan: TPlanRecord };

/** Reports plan data the registry doesn't allow; it's left out, not trusted. */
export type TOnInvalidEntitlement = (message: string) => void;

/**
 * Whether the subscription's plan applies right now. Canceled plans last to
 * the end of the paid period; past-due ones keep working while the payment
 * provider retries.
 */
export const isSubscriptionEffective = (
  {
    status,
    currentPeriodEnd,
    trialEndsAt,
  }: Pick<TSubscriptionRecord, 'status' | 'currentPeriodEnd' | 'trialEndsAt'>,
  now: Date,
) => {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
    case SubscriptionStatus.PAST_DUE:
      return true;
    case SubscriptionStatus.TRIALING:
      return !trialEndsAt || trialEndsAt > now;
    case SubscriptionStatus.CANCELED:
      return !!currentPeriodEnd && currentPeriodEnd > now;
    case SubscriptionStatus.EXPIRED:
      return false;
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isLimitValue = (value: unknown): value is TLimitValue =>
  value === null || (Number.isInteger(value) && (value as number) >= 0);

const readFeatures = (
  values: unknown,
  source: string,
  onInvalid: TOnInvalidEntitlement,
): TFeature[] => {
  if (!Array.isArray(values)) {
    if (values !== undefined) onInvalid(`${source}: features isn't a list`);
    return [];
  }
  return values.filter((value): value is TFeature => {
    if (isFeature(value)) return true;
    onInvalid(`${source}: unknown feature ${JSON.stringify(value)}`);
    return false;
  });
};

const readLimits = (
  values: Prisma.JsonValue | undefined,
  source: string,
  onInvalid: TOnInvalidEntitlement,
): Partial<Record<TLimit, TLimitValue>> => {
  if (!isObject(values)) {
    if (values !== undefined) onInvalid(`${source}: limits isn't an object`);
    return {};
  }
  const limits: Partial<Record<TLimit, TLimitValue>> = {};
  for (const [key, value] of Object.entries(values)) {
    if (!isLimit(key)) {
      onInvalid(`${source}: unknown limit ${JSON.stringify(key)}`);
    } else if (!isLimitValue(value)) {
      onInvalid(`${source}: invalid value for ${key}`);
    } else {
      limits[key] = value;
    }
  }
  return limits;
};

/**
 * What an organization may do: its subscription's plan while that applies,
 * the default plan otherwise, with the subscription's admin overrides on top.
 */
export const resolveEntitlements = (
  subscription: TSubscriptionRecord | null,
  defaultPlan: TPlanRecord,
  now: Date,
  onInvalid: TOnInvalidEntitlement = () => {},
): Entitlements => {
  const plan =
    subscription && isSubscriptionEffective(subscription, now)
      ? subscription.plan
      : defaultPlan;
  const planSource = `plan ${plan.key}`;
  const overrides = isObject(subscription?.overrides)
    ? subscription.overrides
    : {};

  const features = new Set([
    ...readFeatures(plan.features, planSource, onInvalid),
    ...readFeatures(overrides.features, 'subscription overrides', onInvalid),
  ]);
  const planLimits = readLimits(plan.limits, planSource, onInvalid);
  const overrideLimits = readLimits(
    overrides.limits as Prisma.JsonValue | undefined,
    'subscription overrides',
    onInvalid,
  );
  // Not `??`: null means unlimited and must win over the fallbacks.
  const limitOf = (limit: TLimit): TLimitValue => {
    if (overrideLimits[limit] !== undefined) return overrideLimits[limit];
    if (planLimits[limit] !== undefined) return planLimits[limit];
    return 0;
  };
  const limits = Object.fromEntries(
    LIMITS.map((limit) => [limit, limitOf(limit)]),
  ) as Record<TLimit, TLimitValue>;

  return new Entitlements({ key: plan.key, name: plan.name }, features, limits);
};
