import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { AuditService } from '../audit/audit.service.js';
import type { TAuthContext } from '../auth/auth.types.js';
import type { BillingService } from '../billing/billing.service.js';
import { parseEntitlementInput } from '../entitlements/entitlement-input.js';
import { PlatformRole, Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AdminBillingService } from './admin-billing.service.js';

const admin: TAuthContext = {
  userId: 'a',
  sessionId: 's',
  role: PlatformRole.ADMIN,
};
const superAdmin: TAuthContext = { ...admin, role: PlatformRole.SUPER_ADMIN };

const setup = (plan = { id: 'plan', key: 'premium', isDefault: false }) => {
  const writes: { op: string; args: unknown }[] = [];
  const track = (op: string) =>
    vi.fn((args: unknown) => {
      writes.push({ op, args });
      return Promise.resolve({ id: 'new_price' });
    });
  const prisma = {
    plan: {
      findUnique: vi.fn().mockResolvedValue(plan),
      update: track('plan.update'),
    },
    planPrice: {
      updateMany: track('price.updateMany'),
      create: track('price.create'),
    },
    subscription: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'sub',
        organizationId: 'org',
        overrides: null,
      }),
      update: track('subscription.update'),
    },
    $transaction: vi.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };
  const service = new AdminBillingService(
    prisma as unknown as PrismaService,
    {} as BillingService,
    { record: vi.fn() } as unknown as AuditService,
  );
  return { service, writes };
};

describe('parseEntitlementInput', () => {
  it('accepts registry keys, with null for unlimited', () => {
    expect(
      parseEntitlementInput({
        features: ['template.premium', 'template.premium'],
        limits: { 'cv.max': 5, 'pdf.monthly': null },
      }),
    ).toEqual({
      features: ['template.premium'],
      limits: { 'cv.max': 5, 'pdf.monthly': null },
    });
  });

  it('rejects unknown keys and bad values, naming them', () => {
    expect(() =>
      parseEntitlementInput({
        features: ['everything'],
        limits: { 'cv.max': -1, 'made.up': 3 },
      }),
    ).toThrow(
      /unknown features: everything.*cv\.max must be.*unknown limit: made\.up/,
    );
  });
});

describe('AdminBillingService', () => {
  it('lets only super admins change plans, prices and extras', async () => {
    const { service, writes } = setup();

    await expect(
      service.updatePlan(admin, 'plan', { name: 'Pro' }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.addPrice(admin, 'plan', {
        period: 'MONTHLY',
        currency: 'EUR',
        amountCents: 1299,
      }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.setOverrides(admin, 'sub', { limits: { 'cv.max': 10 } }),
    ).rejects.toThrow(ForbiddenException);
    expect(writes).toHaveLength(0);
  });

  it('replaces a price by retiring the old one, never editing it', async () => {
    const { service, writes } = setup();

    await service.addPrice(superAdmin, 'plan', {
      period: 'MONTHLY',
      currency: 'EUR',
      amountCents: 1299,
    });
    expect(writes.map(({ op }) => op)).toEqual([
      'price.updateMany',
      'price.create',
    ]);
    expect(writes[0]!.args).toEqual({
      where: {
        planId: 'plan',
        period: 'MONTHLY',
        currency: 'EUR',
        active: true,
      },
      data: { active: false },
    });
  });

  it("won't put prices on the free default plan or archive it", async () => {
    const { service } = setup({ id: 'plan', key: 'free', isDefault: true });

    await expect(
      service.addPrice(superAdmin, 'plan', {
        period: 'MONTHLY',
        currency: 'EUR',
        amountCents: 100,
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.updatePlan(superAdmin, 'plan', { archived: true }),
    ).rejects.toThrow(BadRequestException);
  });

  it('stores extras, and clears them to a real null', async () => {
    const { service, writes } = setup();

    await service.setOverrides(superAdmin, 'sub', { limits: { 'cv.max': 10 } });
    await service.setOverrides(superAdmin, 'sub', {});
    expect(writes.map(({ args }) => (args as { data: unknown }).data)).toEqual([
      { overrides: { limits: { 'cv.max': 10 } } },
      { overrides: Prisma.DbNull },
    ]);
  });
});
