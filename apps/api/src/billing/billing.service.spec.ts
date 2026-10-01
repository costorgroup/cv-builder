import { ConflictException, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { AuditService } from '../audit/audit.service.js';
import { BillingService } from './billing.service.js';
import type {
  PaymentProvider,
  TProviderSubscription,
} from './billing.types.js';

const providerSubscription: TProviderSubscription = {
  id: 'sub_1',
  customerId: 'ctm_1',
  status: SubscriptionStatus.ACTIVE,
  priceId: 'pri_premium_monthly',
  currentPeriodStart: new Date('2026-09-30'),
  currentPeriodEnd: new Date('2099-10-30'),
  cancelAtPeriodEnd: false,
  canceledAt: null,
  trialEndsAt: null,
  organizationId: 'org_me',
};

/** A free-plan subscription row, as sign-up creates. */
const freeRow = {
  id: 'row_1',
  organizationId: 'org_me',
  status: SubscriptionStatus.ACTIVE,
  currentPeriodEnd: null,
  trialEndsAt: null,
  providerCustomerId: null as string | null,
  providerSubscriptionId: null as string | null,
};

const setup = (row = freeRow) => {
  const updates: unknown[] = [];
  const events = new Map<string, { processedAt: Date | null }>();
  const prisma = {
    organization: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: 'org_me',
        subscription: row,
        personalOwner: {
          email: 'me@example.com',
          firstName: 'Me',
          lastName: 'Myself',
        },
      }),
    },
    subscription: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(({ where }) =>
        Promise.resolve(
          where.organizationId === row.organizationId ||
            (where.providerSubscriptionId &&
              where.providerSubscriptionId === row.providerSubscriptionId)
            ? row
            : null,
        ),
      ),
      update: vi.fn(({ data }) => {
        updates.push(data);
        return Promise.resolve(row);
      }),
    },
    planPrice: {
      findUnique: vi
        .fn()
        .mockResolvedValue({ id: 'price_row', planId: 'plan_premium' }),
      findFirst: vi.fn().mockResolvedValue({
        id: 'price_row',
        providerPriceId: 'pri_premium_monthly',
      }),
    },
    webhookEvent: {
      findUnique: vi.fn(({ where }) =>
        Promise.resolve(
          events.get(where.provider_providerEventId.providerEventId) ?? null,
        ),
      ),
      create: vi.fn(({ data }) => {
        events.set(data.providerEventId, { processedAt: null });
        return Promise.resolve();
      }),
      update: vi.fn(({ where, data }) => {
        events.set(where.provider_providerEventId.providerEventId, data);
        return Promise.resolve();
      }),
    },
  };
  const provider = {
    name: 'paddle',
    ensureCustomer: vi.fn().mockResolvedValue('ctm_1'),
    createCheckout: vi.fn().mockResolvedValue({ checkoutId: 'txn_1' }),
    getCheckout: vi
      .fn()
      .mockResolvedValue({ organizationId: 'org_me', subscriptionId: 'sub_1' }),
    getSubscription: vi.fn().mockResolvedValue(providerSubscription),
    listActiveSubscriptions: vi.fn().mockResolvedValue([]),
    parseWebhook: vi.fn().mockReturnValue({
      id: 'evt_1',
      type: 'subscription.updated',
      subscriptionId: 'sub_1',
    }),
  };
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const service = new BillingService(
    prisma as unknown as PrismaService,
    provider as unknown as PaymentProvider,
    audit as unknown as AuditService,
  );
  return { service, prisma, provider, updates, audit };
};

describe('BillingService', () => {
  it("starts a checkout for the user's own organization", async () => {
    const { service, provider } = setup();

    await expect(
      service.startCheckout('user', 'premium', 'MONTHLY'),
    ).resolves.toEqual({
      checkoutId: 'txn_1',
    });
    expect(provider.createCheckout).toHaveBeenCalledWith({
      customerId: 'ctm_1',
      priceId: 'pri_premium_monthly',
      organizationId: 'org_me',
    });
  });

  it("won't start a second paid subscription", async () => {
    const { service } = setup({
      ...freeRow,
      providerSubscriptionId: 'sub_1',
      currentPeriodEnd: new Date('2099-01-01') as unknown as null,
    });

    await expect(
      service.startCheckout('user', 'premium', 'MONTHLY'),
    ).rejects.toThrow(ConflictException);
  });

  it('applies the paid subscription after checkout', async () => {
    const { service, updates } = setup();

    await expect(service.completeCheckout('user', 'txn_1')).resolves.toEqual({
      status: 'active',
    });
    expect(updates[0]).toMatchObject({
      planId: 'plan_premium',
      status: SubscriptionStatus.ACTIVE,
      provider: 'paddle',
      providerSubscriptionId: 'sub_1',
      providerCustomerId: 'ctm_1',
    });
  });

  it('refuses a checkout made for another organization', async () => {
    const { service, provider, updates } = setup();
    provider.getCheckout.mockResolvedValue({
      organizationId: 'org_other',
      subscriptionId: 'sub_2',
    });

    await expect(service.completeCheckout('user', 'txn_9')).rejects.toThrow(
      NotFoundException,
    );
    expect(updates).toHaveLength(0);
  });

  it('acts on a webhook once, however often it arrives', async () => {
    const { service, provider, updates } = setup();

    await expect(service.handleWebhook(Buffer.from('{}'), {})).resolves.toBe(
      true,
    );
    await expect(service.handleWebhook(Buffer.from('{}'), {})).resolves.toBe(
      true,
    );
    expect(provider.getSubscription).toHaveBeenCalledTimes(1);
    expect(updates).toHaveLength(1);
  });

  it('rejects a webhook whose signature is wrong', async () => {
    const { service, provider, updates } = setup();
    provider.parseWebhook.mockReturnValue(null);

    await expect(service.handleWebhook(Buffer.from('{}'), {})).resolves.toBe(
      false,
    );
    expect(updates).toHaveLength(0);
  });

  it('retries a webhook that failed before', async () => {
    const { service, provider, updates } = setup();
    provider.getSubscription.mockRejectedValueOnce(new Error('Paddle is down'));

    await expect(service.handleWebhook(Buffer.from('{}'), {})).rejects.toThrow(
      'Paddle is down',
    );
    await expect(service.handleWebhook(Buffer.from('{}'), {})).resolves.toBe(
      true,
    );
    expect(updates).toHaveLength(1);
  });

  describe('reconcile', () => {
    it('re-reads paid subscriptions from the provider', async () => {
      const { service, prisma, provider, updates } = setup({
        ...freeRow,
        providerSubscriptionId: 'sub_1',
      });
      prisma.subscription.findMany.mockResolvedValue([
        {
          organizationId: 'org_me',
          status: SubscriptionStatus.ACTIVE,
          providerCustomerId: 'ctm_1',
          providerSubscriptionId: 'sub_1',
        },
      ]);

      await expect(service.reconcile()).resolves.toEqual({
        checked: 1,
        updated: 1,
        failed: 0,
      });
      expect(provider.getSubscription).toHaveBeenCalledWith('sub_1');
      expect(updates).toHaveLength(1);
    });

    it('finds a paid subscription that never reached us, for its own organization only', async () => {
      const { service, prisma, provider, updates } = setup();
      prisma.subscription.findMany.mockResolvedValue([
        {
          organizationId: 'org_me',
          status: SubscriptionStatus.ACTIVE,
          providerCustomerId: 'ctm_1',
          providerSubscriptionId: null,
        },
      ]);
      provider.listActiveSubscriptions.mockResolvedValue([
        providerSubscription,
        {
          ...providerSubscription,
          id: 'sub_other',
          organizationId: 'org_other',
        },
      ]);

      await expect(service.reconcile()).resolves.toEqual({
        checked: 1,
        updated: 1,
        failed: 0,
      });
      expect(updates).toHaveLength(1);
      expect(updates[0]).toMatchObject({ providerSubscriptionId: 'sub_1' });
    });

    it('keeps going when one organization fails', async () => {
      const { service, prisma, provider } = setup();
      prisma.subscription.findMany.mockResolvedValue([
        {
          organizationId: 'org_a',
          status: SubscriptionStatus.ACTIVE,
          providerCustomerId: 'ctm_a',
          providerSubscriptionId: 'sub_a',
        },
        {
          organizationId: 'org_me',
          status: SubscriptionStatus.ACTIVE,
          providerCustomerId: 'ctm_1',
          providerSubscriptionId: 'sub_1',
        },
      ]);
      provider.getSubscription
        .mockRejectedValueOnce(new Error('Paddle is down'))
        .mockResolvedValueOnce(providerSubscription);

      await expect(service.reconcile()).resolves.toEqual({
        checked: 2,
        updated: 1,
        failed: 1,
      });
    });
  });
});
