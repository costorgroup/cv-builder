import { PLAN_FEATURE_REQUIRED, PLAN_LIMIT_REACHED } from '@repo/cv-core';
import { SubscriptionStatus } from '../generated/prisma/client.js';
import {
  PlanFeatureRequiredException,
  PlanLimitReachedException,
} from './entitlements.errors.js';
import {
  resolveEntitlements,
  type TPlanRecord,
  type TSubscriptionRecord,
} from './resolve-entitlements.js';

const NOW = new Date('2026-09-30T12:00:00Z');
const PAST = new Date('2026-09-01T00:00:00Z');
const FUTURE = new Date('2026-10-30T00:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

const FREE: TPlanRecord = {
  key: 'free',
  name: 'Free',
  features: ['cv.download.pdf'],
  limits: { 'cv.max': 1 },
};

const PREMIUM: TPlanRecord = {
  key: 'premium',
  name: 'Premium',
  features: ['cv.download.pdf', 'template.premium'],
  limits: { 'cv.max': null, 'storage.bytes': 1000 },
};

const subscription = (
  overrides: Partial<TSubscriptionRecord> = {},
): TSubscriptionRecord => ({
  status: SubscriptionStatus.ACTIVE,
  currentPeriodEnd: FUTURE,
  trialEndsAt: null,
  overrides: null,
  plan: PREMIUM,
  ...overrides,
});

const planKeyFor = (sub: TSubscriptionRecord | null) =>
  resolveEntitlements(sub, FREE, NOW).plan.key;

describe('resolveEntitlements', () => {
  describe('which plan applies', () => {
    it.each([
      ['active', subscription(), 'premium'],
      [
        'past due (payment being retried)',
        subscription({ status: 'PAST_DUE' }),
        'premium',
      ],
      [
        'past due, retries still within the grace period',
        subscription({
          status: 'PAST_DUE',
          currentPeriodEnd: new Date(NOW.getTime() - 7 * DAY),
        }),
        'premium',
      ],
      [
        'past due long after the period ended',
        subscription({
          status: 'PAST_DUE',
          currentPeriodEnd: new Date(NOW.getTime() - 15 * DAY),
        }),
        'free',
      ],
      [
        'trialing',
        subscription({ status: 'TRIALING', trialEndsAt: FUTURE }),
        'premium',
      ],
      [
        'trial over',
        subscription({ status: 'TRIALING', trialEndsAt: PAST }),
        'free',
      ],
      [
        'canceled, period not over',
        subscription({ status: 'CANCELED' }),
        'premium',
      ],
      [
        'canceled, period over',
        subscription({ status: 'CANCELED', currentPeriodEnd: PAST }),
        'free',
      ],
      [
        'canceled, no period',
        subscription({ status: 'CANCELED', currentPeriodEnd: null }),
        'free',
      ],
      ['expired', subscription({ status: 'EXPIRED' }), 'free'],
      ['no subscription', null, 'free'],
    ])('%s → %s', (_, sub, expected) => {
      expect(planKeyFor(sub)).toBe(expected);
    });
  });

  it('gives the plan features and limits', () => {
    const entitlements = resolveEntitlements(subscription(), FREE, NOW);

    expect(entitlements.can('template.premium')).toBe(true);
    expect(entitlements.can('api.access')).toBe(false);
    expect(entitlements.limit('cv.max')).toBeNull();
    expect(entitlements.limit('storage.bytes')).toBe(1000);
  });

  it('treats a limit the plan leaves out as 0', () => {
    const entitlements = resolveEntitlements(null, FREE, NOW);

    expect(entitlements.limit('apiKey.max')).toBe(0);
    expect(entitlements.allowsAnother('apiKey.max', 0)).toBe(false);
  });

  it('applies admin overrides on top of the plan', () => {
    const entitlements = resolveEntitlements(
      subscription({
        plan: FREE,
        overrides: {
          features: ['api.access'],
          limits: { 'cv.max': 10, 'apiKey.max': null },
        },
      }),
      FREE,
      NOW,
    );

    expect(entitlements.can('api.access')).toBe(true);
    expect(entitlements.can('cv.download.pdf')).toBe(true);
    expect(entitlements.limit('cv.max')).toBe(10);
    expect(entitlements.limit('apiKey.max')).toBeNull();
  });

  it('keeps overrides when the subscription has lapsed', () => {
    const entitlements = resolveEntitlements(
      subscription({
        status: 'EXPIRED',
        overrides: { limits: { 'cv.max': 3 } },
      }),
      FREE,
      NOW,
    );

    expect(entitlements.plan.key).toBe('free');
    expect(entitlements.limit('cv.max')).toBe(3);
  });

  it('ignores and reports keys and values the registry does not allow', () => {
    const onInvalid = vi.fn();
    const entitlements = resolveEntitlements(
      null,
      {
        ...FREE,
        features: ['cv.download.pdf', 'everything'],
        limits: { 'cv.max': -1, 'made.up': 5, 'embed.max': 1.5 },
      },
      NOW,
      onInvalid,
    );

    expect(entitlements.toSummary().features).toEqual(['cv.download.pdf']);
    expect(entitlements.limit('cv.max')).toBe(0);
    expect(entitlements.limit('embed.max')).toBe(0);
    expect(onInvalid).toHaveBeenCalledTimes(4);
  });

  it('summarizes every registry limit, in registry order', () => {
    const { plan, features, limits } = resolveEntitlements(
      null,
      FREE,
      NOW,
    ).toSummary();

    expect(plan).toEqual({ key: 'free', name: 'Free' });
    expect(features).toEqual(['cv.download.pdf']);
    expect(Object.keys(limits)[0]).toBe('cv.max');
    expect(limits['cv.max']).toBe(1);
    expect(limits['org.members.max']).toBe(0);
  });
});

describe('Entitlements checks', () => {
  const free = resolveEntitlements(null, FREE, NOW);
  const premium = resolveEntitlements(subscription(), FREE, NOW);

  it('allows another only while below the limit', () => {
    expect(free.allowsAnother('cv.max', 0)).toBe(true);
    expect(free.allowsAnother('cv.max', 1)).toBe(false);
    // Over the limit after a downgrade: still nothing more.
    expect(free.allowsAnother('cv.max', 5)).toBe(false);
    expect(premium.allowsAnother('cv.max', 10_000)).toBe(true);
  });

  it('throws a coded 403 when a feature is missing', () => {
    expect(() => premium.assertCan('template.premium')).not.toThrow();
    try {
      free.assertCan('template.premium');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(PlanFeatureRequiredException);
      expect(
        (error as PlanFeatureRequiredException).getResponse(),
      ).toMatchObject({
        statusCode: 403,
        code: PLAN_FEATURE_REQUIRED,
        feature: 'template.premium',
      });
    }
  });

  it('throws a coded 403 with usage when a limit is reached', () => {
    expect(() => free.assertAllowsAnother('cv.max', 0)).not.toThrow();
    try {
      free.assertAllowsAnother('cv.max', 3);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(PlanLimitReachedException);
      expect((error as PlanLimitReachedException).getResponse()).toMatchObject({
        statusCode: 403,
        code: PLAN_LIMIT_REACHED,
        limit: 'cv.max',
        used: 3,
        max: 1,
      });
    }
  });
});
