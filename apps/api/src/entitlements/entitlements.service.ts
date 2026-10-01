import { Injectable, Logger } from '@nestjs/common';
import { PlansService } from '../plans/plans.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Entitlements } from './entitlements.js';
import {
  isSubscriptionEffective,
  resolveEntitlements,
  type TSubscriptionRecord,
} from './resolve-entitlements.js';

/** Works out what an organization's plan allows. See `Entitlements`. */
@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: PlansService,
  ) {}

  async forOrganization(organizationId: string): Promise<Entitlements> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    });
    return this.resolve(subscription);
  }

  /** For a user's own things: their personal organization's plan. */
  async forUser(userId: string): Promise<Entitlements> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { organization: { personalOwnerId: userId } },
      include: { plan: true },
    });
    return this.resolve(subscription);
  }

  private async resolve(subscription: TSubscriptionRecord | null) {
    const now = new Date();
    // The default plan is only used when the subscription doesn't apply (or
    // is missing), so it's only loaded then.
    const fallback =
      subscription && isSubscriptionEffective(subscription, now)
        ? subscription.plan
        : await this.plans.getDefault();
    return resolveEntitlements(subscription, fallback, now, (message) =>
      this.logger.warn(message),
    );
  }
}
