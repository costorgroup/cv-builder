import {
  FEATURES,
  LIMITS,
  type TEntitlementsSummary,
  type TFeature,
  type TLimit,
  type TLimitValue,
} from '@repo/cv-core';
import {
  PlanFeatureRequiredException,
  PlanLimitReachedException,
} from './entitlements.errors.js';

/**
 * What an organization's plan allows right now: the features it has and the
 * limits it's held to. Checks go through here, never through the plan's key.
 */
export class Entitlements {
  constructor(
    readonly plan: { key: string; name: string },
    private readonly features: ReadonlySet<TFeature>,
    private readonly limits: Readonly<Record<TLimit, TLimitValue>>,
  ) {}

  can(feature: TFeature) {
    return this.features.has(feature);
  }

  /** The maximum, or null for unlimited. */
  limit(limit: TLimit): TLimitValue {
    return this.limits[limit];
  }

  /** Whether one more fits, given how many are `used` now. */
  allowsAnother(limit: TLimit, used: number) {
    const max = this.limits[limit];
    return max === null || used < max;
  }

  assertCan(feature: TFeature) {
    if (!this.can(feature)) throw new PlanFeatureRequiredException(feature);
  }

  /** Throws unless one more fits, given how many are `used` now. */
  assertAllowsAnother(limit: TLimit, used: number) {
    if (!this.allowsAnother(limit, used)) {
      throw new PlanLimitReachedException(limit, used, this.limits[limit] ?? 0);
    }
  }

  toSummary(): TEntitlementsSummary {
    return {
      plan: this.plan,
      // In registry order, so the output doesn't depend on the plan's order.
      features: FEATURES.filter((feature) => this.features.has(feature)),
      limits: Object.fromEntries(
        LIMITS.map((limit) => [limit, this.limits[limit]]),
      ) as Record<TLimit, TLimitValue>,
    };
  }
}
