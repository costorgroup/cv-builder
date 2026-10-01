import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { TAccountOverview } from '@repo/cv-core';
import { AuditService } from '../audit/audit.service.js';
import { toPublicUser } from '../auth/auth.service.js';
import { verifyPassword } from '../auth/utils/password.js';
import { EntitlementService } from '../entitlements/entitlements.service.js';
import {
  isStillBilling,
  TeamsService,
} from '../organizations/teams.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { organizationOverview } from '../usage/organization-overview.js';
import { UsageService } from '../usage/usage.service.js';
import type { UpdateProfileDto } from './account.dto.js';

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly teams: TeamsService,
  ) {}

  /** The user's plan, subscription and usage, for their dashboard. */
  async overview(userId: string): Promise<TAccountOverview> {
    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { personalOwnerId: userId },
      select: { id: true },
    });
    return organizationOverview(
      {
        prisma: this.prisma,
        entitlements: this.entitlements,
        usage: this.usage,
      },
      organization.id,
    );
  }

  async updateProfile(
    userId: string,
    { firstName, lastName }: UpdateProfileDto,
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName },
    });
    await this.audit.record({
      actor: { type: 'USER', id: userId },
      action: 'PROFILE_UPDATED',
      resource: { type: 'user', id: userId },
    });
    return toPublicUser(user);
  }

  /** Devices signed in to the account, most recently used first. */
  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
    return sessions.map((session) => ({
      ...session,
      current: session.id === currentSessionId,
    }));
  }

  /** Signs out another device; this one signs out with sign-out instead. */
  async revokeSession(userId: string, currentSessionId: string, id: string) {
    if (id === currentSessionId) {
      throw new BadRequestException(
        'This is the device you are using. Sign out instead.',
      );
    }
    // Scoped to the user, so nobody can sign out someone else's device.
    const { count } = await this.prisma.session.deleteMany({
      where: { id, userId },
    });
    if (count === 0) throw new NotFoundException('Session not found');
    await this.audit.record({
      actor: { type: 'USER', id: userId },
      action: 'SESSION_REVOKED',
      resource: { type: 'session', id },
    });
  }

  /** Signs out every device but this one. */
  async revokeOtherSessions(userId: string, currentSessionId: string) {
    const { count } = await this.prisma.session.deleteMany({
      where: { userId, id: { not: currentSessionId } },
    });
    await this.audit.record({
      actor: { type: 'USER', id: userId },
      action: 'SESSIONS_REVOKED',
      resource: { type: 'user', id: userId },
      metadata: { count },
    });
    return { count };
  }

  /**
   * Deletes the account and everything that belongs to it: CVs, the
   * personal organization with its subscription and usage, teams owned
   * alone, and sessions. Refused while a paid plan still renews, or while
   * it owns a team with other people in it.
   */
  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!(await verifyPassword(password, user.passwordHash))) {
      throw new BadRequestException('Password is incorrect');
    }
    await this.prisma.$transaction(async (tx) => {
      const personal = await tx.subscription.findFirst({
        where: { organization: { personalOwnerId: userId } },
      });
      if (isStillBilling(personal)) {
        throw new ConflictException(
          "Cancel your subscription first, so you're not charged again.",
        );
      }
      // Teams owned alone go with the account; others must be handed over.
      const teamIds = await this.teams.teamsToDeleteWithUser(tx, userId);
      await tx.organization.deleteMany({ where: { id: { in: teamIds } } });
      await tx.user.delete({ where: { id: userId } });
    });
    // Kept after the account is gone, without the person's details.
    await this.audit.record({
      actor: { type: 'USER', id: userId },
      action: 'ACCOUNT_DELETED',
      resource: { type: 'user', id: userId },
    });
  }
}
