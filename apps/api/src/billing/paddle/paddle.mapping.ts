import { createHmac, timingSafeEqual } from 'node:crypto';
import { SubscriptionStatus } from '../../generated/prisma/client.js';
import type {
  TProviderEvent,
  TProviderSubscription,
} from '../billing.types.js';

/**
 * Currencies Paddle can charge in
 * (https://developer.paddle.com/concepts/sell/supported-currencies). Prices
 * in others (e.g. RSD) are shown but not sent to Paddle.
 */
export const PADDLE_CURRENCIES = new Set([
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
  'HKD',
  'SGD',
  'SEK',
  'ARS',
  'BRL',
  'CNY',
  'COP',
  'CZK',
  'DKK',
  'HUF',
  'ILS',
  'INR',
  'KRW',
  'MXN',
  'NOK',
  'NZD',
  'PLN',
  'RUB',
  'THB',
  'TRY',
  'TWD',
  'UAH',
  'VND',
  'ZAR',
  'PEN',
  'CLP',
]);

/** Our billing periods as Paddle billing cycles. */
export const PADDLE_BILLING_CYCLES = {
  MONTHLY: { interval: 'month', frequency: 1 },
  QUARTERLY: { interval: 'month', frequency: 3 },
  YEARLY: { interval: 'year', frequency: 1 },
} as const;

/** How old a webhook's timestamp may be, against replays. */
const WEBHOOK_TOLERANCE_SECONDS = 5;

type TPaddleSubscription = {
  id: string;
  status: string;
  customer_id: string;
  items?: { price?: { id?: string } }[];
  current_billing_period?: { starts_at: string; ends_at: string } | null;
  scheduled_change?: { action: string; effective_at: string } | null;
  canceled_at?: string | null;
  custom_data?: Record<string, unknown> | null;
};

const date = (value: string | null | undefined) =>
  value ? new Date(value) : null;

/**
 * Paddle's statuses in ours. Paddle's "canceled" and "paused" mean access has
 * ended; a cancellation that's only scheduled is still "active".
 */
const STATUS: Record<string, SubscriptionStatus> = {
  active: SubscriptionStatus.ACTIVE,
  trialing: SubscriptionStatus.TRIALING,
  past_due: SubscriptionStatus.PAST_DUE,
  paused: SubscriptionStatus.EXPIRED,
  canceled: SubscriptionStatus.EXPIRED,
};

export const fromPaddleSubscription = (
  subscription: TPaddleSubscription,
): TProviderSubscription => {
  const status = STATUS[subscription.status] ?? SubscriptionStatus.EXPIRED;
  const period = subscription.current_billing_period;
  const organizationId = subscription.custom_data?.organizationId;
  return {
    id: subscription.id,
    customerId: subscription.customer_id,
    status,
    priceId: subscription.items?.[0]?.price?.id ?? null,
    currentPeriodStart: date(period?.starts_at),
    // An ended subscription has no current period; it ended when canceled.
    currentPeriodEnd: date(period?.ends_at) ?? date(subscription.canceled_at),
    cancelAtPeriodEnd: subscription.scheduled_change?.action === 'cancel',
    canceledAt: date(subscription.canceled_at),
    trialEndsAt:
      status === SubscriptionStatus.TRIALING ? date(period?.ends_at) : null,
    organizationId: typeof organizationId === 'string' ? organizationId : null,
  };
};

const headerValue = (
  headers: Record<string, string | string[] | undefined>,
  name: string,
) => {
  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

/**
 * The event, if `Paddle-Signature` is an HMAC-SHA256 of "<ts>:<raw body>"
 * with the destination's secret and the timestamp is recent; null otherwise.
 * (https://developer.paddle.com/webhooks/signature-verification)
 */
export const parsePaddleWebhook = (
  rawBody: Buffer,
  headers: Record<string, string | string[] | undefined>,
  secret: string,
  now = Date.now(),
): TProviderEvent | null => {
  const signature = headerValue(headers, 'paddle-signature');
  if (!signature) return null;
  const parts = Object.fromEntries(
    signature.split(';').map((part) => {
      const index = part.indexOf('=');
      return [part.slice(0, index).trim(), part.slice(index + 1).trim()];
    }),
  );
  const timestamp = Number(parts.ts);
  if (!parts.h1 || !Number.isFinite(timestamp)) return null;
  if (Math.abs(now / 1000 - timestamp) > WEBHOOK_TOLERANCE_SECONDS) {
    return null;
  }

  const expected = createHmac('sha256', secret)
    .update(`${parts.ts}:`)
    .update(rawBody)
    .digest();
  const given = Buffer.from(parts.h1, 'hex');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return null;
  }

  const event = JSON.parse(rawBody.toString('utf8')) as {
    event_id: string;
    event_type: string;
    data?: { id?: string; subscription_id?: string | null };
  };
  const subscriptionId = event.event_type.startsWith('subscription.')
    ? (event.data?.id ?? null)
    : (event.data?.subscription_id ?? null);
  return { id: event.event_id, type: event.event_type, subscriptionId };
};
