import { Injectable } from '@nestjs/common';
import {
  OrganizationRole,
  OrganizationType,
  SubscriptionStatus,
  type Prisma,
  type User,
} from '../generated/prisma/client.js';

@Injectable()
export class OrganizationsService {
  /**
   * Gives a new user their personal organization: owned by them, on the
   * default plan. Runs in the caller's transaction, so a user never exists
   * without one.
   */
  async createPersonal(tx: Prisma.TransactionClient, user: User) {
    const plan = await tx.plan.findFirstOrThrow({
      where: { isDefault: true },
    });
    return tx.organization.create({
      data: {
        type: OrganizationType.PERSONAL,
        name: `${user.firstName} ${user.lastName}`.trim(),
        slug: `personal-${user.id}`,
        personalOwnerId: user.id,
        members: {
          create: { userId: user.id, role: OrganizationRole.OWNER },
        },
        subscription: {
          create: { planId: plan.id, status: SubscriptionStatus.ACTIVE },
        },
      },
    });
  }
}
