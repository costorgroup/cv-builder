import { createHmac } from 'node:crypto';
import { SubscriptionStatus } from '../../generated/prisma/client.js';
import {
  fromPaddleSubscription,
  parsePaddleWebhook,
} from './paddle.mapping.js';

const base = {
  id: 'sub_1',
  customer_id: 'ctm_1',
  items: [{ price: { id: 'pri_1' } }],
  current_billing_period: {
    starts_at: '2026-09-30T00:00:00Z',
    ends_at: '2026-10-30T00:00:00Z',
  },
  scheduled_change: null,
  canceled_at: null,
  custom_data: { organizationId: 'org_1' },
};

describe('fromPaddleSubscription', () => {
  it('maps an active subscription', () => {
    expect(fromPaddleSubscription({ ...base, status: 'active' })).toEqual({
      id: 'sub_1',
      customerId: 'ctm_1',
      status: SubscriptionStatus.ACTIVE,
      priceId: 'pri_1',
      currentPeriodStart: new Date('2026-09-30T00:00:00Z'),
      currentPeriodEnd: new Date('2026-10-30T00:00:00Z'),
      cancelAtPeriodEnd: false,
      canceledAt: null,
      trialEndsAt: null,
      organizationId: 'org_1',
    });
  });

  it('keeps access until the period ends when a cancellation is scheduled', () => {
    const mapped = fromPaddleSubscription({
      ...base,
      status: 'active',
      scheduled_change: {
        action: 'cancel',
        effective_at: '2026-10-30T00:00:00Z',
      },
    });
    expect(mapped.status).toBe(SubscriptionStatus.ACTIVE);
    expect(mapped.cancelAtPeriodEnd).toBe(true);
  });

  it('ends access once Paddle has canceled or paused it', () => {
    const canceled = fromPaddleSubscription({
      ...base,
      status: 'canceled',
      current_billing_period: null,
      canceled_at: '2026-10-30T00:00:00Z',
    });
    expect(canceled.status).toBe(SubscriptionStatus.EXPIRED);
    expect(canceled.currentPeriodEnd).toEqual(new Date('2026-10-30T00:00:00Z'));
    expect(fromPaddleSubscription({ ...base, status: 'paused' }).status).toBe(
      SubscriptionStatus.EXPIRED,
    );
  });

  it('maps trials and payment problems', () => {
    const trial = fromPaddleSubscription({ ...base, status: 'trialing' });
    expect(trial.status).toBe(SubscriptionStatus.TRIALING);
    expect(trial.trialEndsAt).toEqual(new Date('2026-10-30T00:00:00Z'));
    expect(fromPaddleSubscription({ ...base, status: 'past_due' }).status).toBe(
      SubscriptionStatus.PAST_DUE,
    );
  });

  it('has no organization unless our checkout set one', () => {
    expect(
      fromPaddleSubscription({ ...base, status: 'active', custom_data: null })
        .organizationId,
    ).toBeNull();
  });
});

describe('parsePaddleWebhook', () => {
  const secret = 'pdl_ntfset_secret';
  const now = Date.UTC(2026, 8, 30, 12, 0, 0);
  const ts = String(Math.floor(now / 1000));
  const body = Buffer.from(
    JSON.stringify({
      event_id: 'evt_1',
      event_type: 'subscription.updated',
      data: { id: 'sub_1' },
    }),
  );
  const sign = (payload: Buffer, key = secret, timestamp = ts) =>
    `ts=${timestamp};h1=${createHmac('sha256', key).update(`${timestamp}:`).update(payload).digest('hex')}`;

  it('accepts a correctly signed, recent event', () => {
    expect(
      parsePaddleWebhook(body, { 'paddle-signature': sign(body) }, secret, now),
    ).toEqual({
      id: 'evt_1',
      type: 'subscription.updated',
      subscriptionId: 'sub_1',
    });
  });

  it('takes the subscription from a transaction event', () => {
    const transaction = Buffer.from(
      JSON.stringify({
        event_id: 'evt_2',
        event_type: 'transaction.completed',
        data: { id: 'txn_1', subscription_id: 'sub_9' },
      }),
    );
    expect(
      parsePaddleWebhook(
        transaction,
        { 'paddle-signature': sign(transaction) },
        secret,
        now,
      )?.subscriptionId,
    ).toBe('sub_9');
  });

  it.each([
    ['no signature', {}],
    [
      'a changed body',
      { 'paddle-signature': sign(Buffer.from('{"tampered":true}')) },
    ],
    ['another secret', { 'paddle-signature': sign(body, 'other-secret') }],
    [
      'a replayed old event',
      { 'paddle-signature': sign(body, secret, String(Number(ts) - 60)) },
    ],
    ['a malformed header', { 'paddle-signature': 'garbage' }],
  ])('rejects %s', (_, headers) => {
    expect(parsePaddleWebhook(body, headers, secret, now)).toBeNull();
  });
});
