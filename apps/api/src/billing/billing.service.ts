import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DEFAULT_CURRENCY, type TPlanPeriod } from '@repo/cv-core';
import { isSubscriptionEffective } from '../entitlements/resolve-entitlements.js';
import {
  OrganizationRole,
  OrganizationType,
  SubscriptionStatus,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService, type TAuditActor } from '../audit/audit.service.js';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
  type TProviderSubscription,
} from './billing.types.js';
import { subscriptionUpdateFrom } from './subscription-sync.js';

/** How long to wait for the provider to create a paid checkout's subscription. */
const CHECKOUT_POLL_ATTEMPTS = 5;
const CHECKOUT_POLL_DELAY_MS = 1500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Paying for plans. Everything goes through `PaymentProvider`, and what the
 * provider says ends up in our `Subscription` rows, which are what
 * entitlements read.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider | null,
    private readonly audit: AuditService,
  ) {}

  /** What the browser needs to open a checkout, if payments are set up. */
  config() {
    return this.provider?.clientConfig() ?? { provider: 'none' };
  }

  /**
   * Starts paying for a plan: a checkout for its default-currency price (the
   * provider shows it in the buyer's currency). Only when not already paying;
   * a paid plan is changed with `changePlan`.
   */
  async startCheckout(
    userId: string,
    planKey: string,
    period: TPlanPeriod,
    teamId?: string,
  ) {
    const provider = this.requireProvider();
    const { organization, subscription, user } = await this.billedOrganization(
      userId,
      teamId,
    );
    if (
      subscription?.providerSubscriptionId &&
      isSubscriptionEffective(subscription, new Date())
    ) {
      throw new ConflictException(
        'You already have a subscription. Change or cancel it instead.',
      );
    }
    const price = await this.sellablePrice(planKey, period);

    const customerId =
      subscription?.providerCustomerId ??
      (await provider.ensureCustomer(
        user.email,
        `${user.firstName} ${user.lastName}`.trim(),
      ));
    if (subscription && !subscription.providerCustomerId) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { providerCustomerId: customerId },
      });
    }
    const checkout = await provider.createCheckout({
      customerId,
      priceId: price.providerPriceId,
      organizationId: organization.id,
    });
    await this.audit.record({
      actor: { type: 'USER', id: userId },
      action: 'CHECKOUT_STARTED',
      resource: { type: 'checkout', id: checkout.checkoutId },
      organizationId: organization.id,
      metadata: { planKey, period },
    });
    return checkout;
  }

  /**
   * After the buyer paid: takes the new subscription from the provider, so
   * the plan applies at once (webhooks would bring it too, a moment later).
   */
  async completeCheckout(userId: string, checkoutId: string, teamId?: string) {
    const provider = this.requireProvider();
    const { organization } = await this.billedOrganization(userId, teamId);
    for (let attempt = 1; attempt <= CHECKOUT_POLL_ATTEMPTS; attempt++) {
      const checkout = await provider.getCheckout(checkoutId);
      // Only a checkout made for this organization counts.
      if (checkout.organizationId !== organization.id) {
        throw new NotFoundException('Checkout not found');
      }
      if (checkout.subscriptionId) {
        await this.apply(
          await provider.getSubscription(checkout.subscriptionId),
          { type: 'USER', id: userId },
        );
        return { status: 'active' as const };
      }
      if (attempt < CHECKOUT_POLL_ATTEMPTS) await sleep(CHECKOUT_POLL_DELAY_MS);
    }
    // Still being processed; a webhook or the next sync will finish it.
    return { status: 'pending' as const };
  }

  /** Moves a paid subscription to another plan or period, prorated now. */
  async changePlan(
    userId: string,
    planKey: string,
    period: TPlanPeriod,
    teamId?: string,
  ) {
    const provider = this.requireProvider();
    const subscriptionId = await this.activeProviderSubscriptionId(
      userId,
      teamId,
    );
    const price = await this.sellablePrice(planKey, period);
    await this.apply(
      await provider.changePrice(subscriptionId, price.providerPriceId),
      { type: 'USER', id: userId },
    );
  }

  /** Ends the paid plan when the period that's paid for is over. */
  async cancel(userId: string, teamId?: string) {
    const provider = this.requireProvider();
    const subscriptionId = await this.activeProviderSubscriptionId(
      userId,
      teamId,
    );
    await this.apply(await provider.cancelAtPeriodEnd(subscriptionId), {
      type: 'USER',
      id: userId,
    });
  }

  /** Keeps a plan that was set to end. */
  async resume(userId: string, teamId?: string) {
    const provider = this.requireProvider();
    const subscriptionId = await this.activeProviderSubscriptionId(
      userId,
      teamId,
    );
    await this.apply(await provider.resume(subscriptionId), {
      type: 'USER',
      id: userId,
    });
  }

  /** The provider's billing portal: invoices and the payment method. */
  async portalUrl(userId: string, teamId?: string) {
    const provider = this.requireProvider();
    const { subscription } = await this.billedOrganization(userId, teamId);
    if (!subscription?.providerCustomerId) {
      throw new BadRequestException('There is no billing history yet.');
    }
    return {
      url: await provider.portalUrl(
        subscription.providerCustomerId,
        subscription.providerSubscriptionId,
      ),
    };
  }

  /**
   * A provider webhook: checked, recorded once, and its subscription re-read
   * from the provider (so events arriving out of order can't apply stale
   * data). Returns false for an invalid signature.
   */
  async handleWebhook(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ) {
    const provider = this.requireProvider();
    const event = provider.parseWebhook(rawBody, headers);
    if (!event) return false;

    const key = { provider: provider.name, providerEventId: event.id };
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { provider_providerEventId: key },
    });
    // A repeat of one that was already handled.
    if (existing?.processedAt) return true;
    if (!existing) {
      await this.prisma.webhookEvent.create({
        data: { ...key, type: event.type },
      });
    }

    try {
      if (event.subscriptionId) {
        await this.apply(await provider.getSubscription(event.subscriptionId), {
          type: 'SYSTEM',
          id: 'webhook',
        });
      }
      await this.prisma.webhookEvent.update({
        where: { provider_providerEventId: key },
        data: { processedAt: new Date(), error: null },
      });
    } catch (error) {
      await this.prisma.webhookEvent.update({
        where: { provider_providerEventId: key },
        data: { error: error instanceof Error ? error.message : String(error) },
      });
      // Failing makes the provider retry later.
      throw error;
    }
    return true;
  }

  /**
   * Publishes the plans to the provider: a product per paid plan and a price
   * per billing period (other currencies as country overrides), storing the
   * provider's ids on our rows. Safe to run again. New price rows become new
   * provider prices; people already paying stay on theirs.
   */
  async syncCatalog() {
    const provider = this.requireProvider();
    const countries = await this.prisma.country.findMany({
      where: { currency: { not: null } },
      select: { code: true, currency: true },
    });
    const countryCurrencies = Object.fromEntries(
      countries.map(({ code, currency }) => [code, currency!]),
    );
    const plans = await this.prisma.plan.findMany({
      where: { archivedAt: null },
      include: { prices: { where: { active: true } } },
      orderBy: { sortOrder: 'asc' },
    });

    const synced: { planKey: string; productId: string; prices: number }[] = [];
    for (const plan of plans) {
      // Free plans have nothing to sell.
      if (plan.prices.length === 0) continue;
      const result = await provider.syncCatalog(plan, countryCurrencies);
      await this.prisma.$transaction([
        this.prisma.plan.update({
          where: { id: plan.id },
          data: { providerProductId: result.providerProductId },
        }),
        ...Object.entries(result.providerPriceIds).map(
          ([id, providerPriceId]) =>
            this.prisma.planPrice.update({
              where: { id },
              data: { providerPriceId },
            }),
        ),
      ]);
      synced.push({
        planKey: plan.key,
        productId: result.providerProductId,
        prices: Object.keys(result.providerPriceIds).length,
      });
    }
    return synced;
  }

  /**
   * Brings every subscription in line with the provider, for anything a
   * webhook didn't bring (missed, or a checkout closed before it finished):
   * paid ones are re-read, and customers without one are checked for a new
   * one. One failing doesn't stop the rest; running twice changes nothing.
   */
  async reconcile() {
    const provider = this.provider;
    const summary = { checked: 0, updated: 0, failed: 0 };
    if (!provider) return summary;

    const rows = await this.prisma.subscription.findMany({
      where: {
        provider: { in: [provider.name, 'none'] },
        providerCustomerId: { not: null },
      },
      select: {
        organizationId: true,
        status: true,
        providerCustomerId: true,
        providerSubscriptionId: true,
      },
    });
    for (const row of rows) {
      summary.checked++;
      try {
        const current =
          row.providerSubscriptionId &&
          row.status !== SubscriptionStatus.EXPIRED
            ? [await provider.getSubscription(row.providerSubscriptionId)]
            : (
                await provider.listActiveSubscriptions(row.providerCustomerId!)
              ).filter((each) => each.organizationId === row.organizationId);
        for (const each of current) {
          await this.apply(each, { type: 'SYSTEM', id: 'reconcile' });
          summary.updated++;
        }
      } catch (error) {
        summary.failed++;
        this.logger.error(
          `Couldn't reconcile organization ${row.organizationId}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
    this.logger.log(
      `Reconciled subscriptions: ${summary.checked} checked, ${summary.updated} synced, ${summary.failed} failed`,
    );
    return summary;
  }

  /** Stores what the provider says about a subscription on our row. */
  private async apply(
    providerSubscription: TProviderSubscription,
    actor: TAuditActor,
  ) {
    const provider = this.requireProvider();
    const subscription =
      (await this.prisma.subscription.findUnique({
        where: { providerSubscriptionId: providerSubscription.id },
      })) ??
      (providerSubscription.organizationId
        ? await this.prisma.subscription.findUnique({
            where: { organizationId: providerSubscription.organizationId },
          })
        : null);
    if (!subscription) {
      throw new Error(
        `No organization for ${provider.name} subscription ${providerSubscription.id}`,
      );
    }
    // A different paid subscription the organization still has wins; this
    // one is logged for a person to look at.
    if (
      subscription.providerSubscriptionId &&
      subscription.providerSubscriptionId !== providerSubscription.id &&
      isSubscriptionEffective(subscription, new Date())
    ) {
      this.logger.warn(
        `Organization ${subscription.organizationId} already has subscription ${subscription.providerSubscriptionId}; ignoring ${providerSubscription.id}`,
      );
      return;
    }

    const price = providerSubscription.priceId
      ? await this.prisma.planPrice.findUnique({
          where: { providerPriceId: providerSubscription.priceId },
          select: { id: true, planId: true },
        })
      : null;
    if (!price) {
      throw new Error(
        `Unknown ${provider.name} price ${providerSubscription.priceId} on subscription ${providerSubscription.id}`,
      );
    }
    const update = subscriptionUpdateFrom(
      provider.name,
      providerSubscription,
      price,
    );
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: update,
    });
    // Logged only when something people care about changed.
    const before = {
      planId: subscription.planId,
      priceId: subscription.priceId,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
    const after = {
      planId: update.planId,
      priceId: update.priceId,
      status: update.status,
      cancelAtPeriodEnd: update.cancelAtPeriodEnd,
    };
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      await this.audit.record({
        actor,
        action: 'SUBSCRIPTION_CHANGED',
        resource: { type: 'subscription', id: subscription.id },
        organizationId: subscription.organizationId,
        metadata: { before, after },
      });
    }
  }

  private requireProvider() {
    if (!this.provider) {
      throw new ServiceUnavailableException("Payments aren't set up yet.");
    }
    return this.provider;
  }

  /**
   * The organization a billing action is for: the user's own, or with
   * `teamId` a team, whose billing only its owner handles. The checkout is
   * in the acting user's name either way.
   */
  private async billedOrganization(userId: string, teamId?: string) {
    if (!teamId) {
      const organization = await this.prisma.organization.findUniqueOrThrow({
        where: { personalOwnerId: userId },
        include: { subscription: true, personalOwner: true },
      });
      return {
        organization,
        subscription: organization.subscription,
        user: organization.personalOwner!,
      };
    }
    const team = await this.prisma.organization.findFirst({
      where: {
        id: teamId,
        type: OrganizationType.TEAM,
        deletedAt: null,
        members: { some: { userId } },
      },
      include: {
        subscription: true,
        members: { where: { userId }, include: { user: true } },
      },
    });
    const membership = team?.members[0];
    if (!team || !membership) throw new NotFoundException('Team not found');
    if (membership.role !== OrganizationRole.OWNER) {
      throw new ForbiddenException('Only the team owner can manage billing.');
    }
    return {
      organization: team,
      subscription: team.subscription,
      user: membership.user,
    };
  }

  private async activeProviderSubscriptionId(userId: string, teamId?: string) {
    const { subscription } = await this.billedOrganization(userId, teamId);
    if (
      !subscription?.providerSubscriptionId ||
      !isSubscriptionEffective(subscription, new Date())
    ) {
      throw new BadRequestException("You don't have a paid subscription.");
    }
    return subscription.providerSubscriptionId;
  }

  /** The default-currency price a public plan is sold at for a period. */
  private async sellablePrice(planKey: string, period: TPlanPeriod) {
    const price = await this.prisma.planPrice.findFirst({
      where: {
        period,
        currency: DEFAULT_CURRENCY,
        active: true,
        providerPriceId: { not: null },
        plan: { key: planKey, isPublic: true, archivedAt: null },
      },
    });
    if (!price?.providerPriceId) {
      throw new BadRequestException("That plan isn't available to buy.");
    }
    return { ...price, providerPriceId: price.providerPriceId };
  }
}
