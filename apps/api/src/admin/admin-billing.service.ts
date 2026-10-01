import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { BillingService } from '../billing/billing.service.js';
import { parseEntitlementInput } from '../entitlements/entitlement-input.js';
import { PlatformRole, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AddPriceDto,
  ListSubscriptionsQuery,
  OverridesDto,
  UpdatePlanDto,
} from './admin.dto.js';

/** Plans and extras decide what people get for free: super admins only. */
const requireSuperAdmin = (admin: TAuthContext) => {
  if (admin.role !== PlatformRole.SUPER_ADMIN) {
    throw new ForbiddenException(
      'Only super admins can change plans and extras.',
    );
  }
};

@Injectable()
export class AdminBillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly audit: AuditService,
  ) {}

  async listSubscriptions({
    status,
    planKey,
    paid,
    page,
    pageSize,
  }: ListSubscriptionsQuery) {
    const where: Prisma.SubscriptionWhereInput = {
      ...(status && { status }),
      ...(planKey && { plan: { key: planKey } }),
      ...(paid && { provider: { not: 'none' } }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          status: true,
          provider: true,
          providerSubscriptionId: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          overrides: true,
          createdAt: true,
          updatedAt: true,
          plan: { select: { key: true, name: true } },
          price: {
            select: { period: true, amountCents: true, currency: true },
          },
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              personalOwner: { select: { id: true, email: true } },
            },
          },
        },
      }),
      this.prisma.subscription.count({ where }),
    ]);
    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  /**
   * Sets one account's extras on top of its plan (e.g. more CVs for an early
   * user). They apply whatever plan the account is on; empty clears them.
   */
  async setOverrides(
    admin: TAuthContext,
    subscriptionId: string,
    dto: OverridesDto,
  ) {
    requireSuperAdmin(admin);
    const { features, limits } = parseEntitlementInput(dto);
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: { id: true, organizationId: true, overrides: true },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    const empty = !features?.length && !Object.keys(limits ?? {}).length;
    const overrides = empty
      ? null
      : {
          ...(features?.length && { features }),
          ...(limits && Object.keys(limits).length && { limits }),
        };
    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { overrides: overrides ?? Prisma.DbNull },
    });
    await this.audit.record({
      actor: { type: 'USER', id: admin.userId },
      action: 'SUBSCRIPTION_OVERRIDES_CHANGED',
      resource: { type: 'subscription', id: subscriptionId },
      organizationId: subscription.organizationId,
      metadata: { before: subscription.overrides, after: overrides },
    });
  }

  /** Every plan, archived ones too, with all prices and how many use it. */
  async listPlans() {
    const plans = await this.prisma.plan.findMany({
      orderBy: [{ archivedAt: 'asc' }, { sortOrder: 'asc' }],
      include: {
        prices: { orderBy: [{ active: 'desc' }, { createdAt: 'desc' }] },
        _count: { select: { subscriptions: true } },
      },
    });
    return plans.map(({ _count, ...plan }) => ({
      ...plan,
      subscriptions: _count.subscriptions,
    }));
  }

  async updatePlan(admin: TAuthContext, planId: string, dto: UpdatePlanDto) {
    requireSuperAdmin(admin);
    const { features, limits } = parseEntitlementInput(dto);
    const plan = await this.plan(planId);
    if (dto.archived && plan.isDefault) {
      throw new BadRequestException("The default plan can't be archived.");
    }

    const data: Prisma.PlanUpdateInput = {
      name: dto.name,
      description: dto.description,
      isPublic: dto.isPublic,
      sortOrder: dto.sortOrder,
      features,
      limits: limits as Prisma.InputJsonObject | undefined,
      archivedAt:
        dto.archived === undefined
          ? undefined
          : dto.archived
            ? new Date()
            : null,
    };
    await this.prisma.plan.update({ where: { id: planId }, data });
    await this.audit.record({
      actor: { type: 'USER', id: admin.userId },
      action: 'PLAN_UPDATED',
      resource: { type: 'plan', id: planId },
      metadata: {
        planKey: plan.key,
        changed: Object.keys(dto).filter(
          (key) => dto[key as keyof UpdatePlanDto] !== undefined,
        ),
      },
    });
  }

  /**
   * A new price for a period and currency. The one it replaces stops being
   * sold, but people already paying it keep it. Sync to the provider next.
   */
  async addPrice(
    admin: TAuthContext,
    planId: string,
    { period, currency, amountCents }: AddPriceDto,
  ) {
    requireSuperAdmin(admin);
    const plan = await this.plan(planId);
    if (plan.isDefault) {
      throw new BadRequestException(
        "The default plan is free; it can't have prices.",
      );
    }
    const [, price] = await this.prisma.$transaction([
      this.prisma.planPrice.updateMany({
        where: { planId, period, currency, active: true },
        data: { active: false },
      }),
      this.prisma.planPrice.create({
        data: { planId, period, currency, amountCents },
      }),
    ]);
    await this.audit.record({
      actor: { type: 'USER', id: admin.userId },
      action: 'PLAN_PRICE_ADDED',
      resource: { type: 'plan', id: planId },
      metadata: {
        planKey: plan.key,
        priceId: price.id,
        period,
        currency,
        amountCents,
      },
    });
    return price;
  }

  /** Stops selling a price; people paying it keep it. */
  async retirePrice(admin: TAuthContext, priceId: string) {
    requireSuperAdmin(admin);
    const price = await this.prisma.planPrice.findUnique({
      where: { id: priceId },
    });
    if (!price) throw new NotFoundException('Price not found');
    await this.prisma.planPrice.update({
      where: { id: priceId },
      data: { active: false },
    });
    await this.audit.record({
      actor: { type: 'USER', id: admin.userId },
      action: 'PLAN_PRICE_RETIRED',
      resource: { type: 'plan', id: price.planId },
      metadata: { priceId },
    });
  }

  /** Publishes the plans to the payment provider. */
  async syncCatalog(admin: TAuthContext) {
    requireSuperAdmin(admin);
    const synced = await this.billing.syncCatalog();
    await this.audit.record({
      actor: { type: 'USER', id: admin.userId },
      action: 'CATALOG_SYNCED',
      resource: { type: 'catalog' },
      metadata: { plans: synced.map(({ planKey }) => planKey) },
    });
    return synced;
  }

  private async plan(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }
}
