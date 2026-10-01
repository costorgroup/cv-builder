import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  TInvitePreview,
  TTeamInvite,
  TTeamMember,
  TTeamSummary,
} from '@repo/cv-core';
import { AuditService } from '../audit/audit.service.js';
import { createToken, hashToken } from '../auth/utils/token.js';
import { isSubscriptionEffective } from '../entitlements/resolve-entitlements.js';
import { EntitlementService } from '../entitlements/entitlements.service.js';
import {
  OrganizationRole,
  OrganizationType,
  SubscriptionStatus,
  type Prisma,
} from '../generated/prisma/client.js';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { TTeamContext } from '../authz/team-access.guard.js';

/** How long an invite link works. */
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Teams one person may own, so accounts can't be used to make thousands. */
export const MAX_OWNED_TEAMS = 10;

/** "Đorđe Design Co." → "djordje-design-co", then a random suffix for uniqueness. */
export const teamSlug = (name: string) => {
  const base =
    name
      .normalize('NFKD')
      // Accents split off by NFKD.
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      // Letters that don't decompose, as Serbian Latin spells them out.
      .replace(/đ/g, 'dj')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'team';
  return `${base}-${randomBytes(3).toString('hex')}`;
};

/**
 * Whether a subscription still takes money: paid, in effect and not set to
 * end. Such a team (or account) can't be deleted until it's cancelled.
 */
export const isStillBilling = (
  subscription: {
    provider: string;
    status: SubscriptionStatus;
    currentPeriodEnd: Date | null;
    trialEndsAt: Date | null;
    cancelAtPeriodEnd: boolean;
  } | null,
  now = new Date(),
) =>
  !!subscription &&
  subscription.provider !== 'none' &&
  !subscription.cancelAtPeriodEnd &&
  isSubscriptionEffective(subscription, now);

/**
 * Team organizations: the people in them, invites, and who owns them. Each
 * team is its own customer with its own subscription, starting on the
 * default plan. Access is checked by the TeamAccessGuard before these run;
 * rules between members (who may change whom) are checked here.
 */
@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
  ) {}

  /** The teams a user belongs to, by name. */
  async listForUser(userId: string): Promise<TTeamSummary[]> {
    const memberships = await this.prisma.organizationMember.findMany({
      where: {
        userId,
        organization: { type: OrganizationType.TEAM, deletedAt: null },
      },
      select: {
        role: true,
        organization: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { organization: { name: 'asc' } },
    });
    return memberships.map(({ role, organization }) => ({
      ...organization,
      role,
    }));
  }

  async get(team: TTeamContext): Promise<TTeamSummary> {
    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { id: team.id },
      select: { id: true, name: true, slug: true },
    });
    return { ...organization, role: team.role };
  }

  /** A new team, owned by its creator, on the default plan. */
  async create(userId: string, name: string): Promise<TTeamSummary> {
    const owned = await this.prisma.organizationMember.count({
      where: {
        userId,
        role: OrganizationRole.OWNER,
        organization: { type: OrganizationType.TEAM, deletedAt: null },
      },
    });
    if (owned >= MAX_OWNED_TEAMS) {
      throw new BadRequestException(
        `You can own up to ${MAX_OWNED_TEAMS} teams.`,
      );
    }
    const plan = await this.prisma.plan.findFirstOrThrow({
      where: { isDefault: true },
    });
    const team = await this.prisma.organization.create({
      data: {
        type: OrganizationType.TEAM,
        name,
        slug: teamSlug(name),
        members: { create: { userId, role: OrganizationRole.OWNER } },
        subscription: {
          create: { planId: plan.id, status: SubscriptionStatus.ACTIVE },
        },
      },
      select: { id: true, name: true, slug: true },
    });
    await this.audit.record({
      actor: { type: 'USER', id: userId },
      action: 'TEAM_CREATED',
      resource: { type: 'organization', id: team.id },
      organizationId: team.id,
    });
    return { ...team, role: OrganizationRole.OWNER };
  }

  async rename(userId: string, team: TTeamContext, name: string) {
    await this.prisma.organization.update({
      where: { id: team.id },
      data: { name },
    });
    await this.record(userId, team.id, 'TEAM_UPDATED', {
      type: 'organization',
      id: team.id,
    });
    return this.get(team);
  }

  /**
   * Deletes the team, its members and invites. Refused while its paid plan
   * still renews, so nobody keeps being charged for a team that's gone.
   */
  async delete(userId: string, team: TTeamContext) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId: team.id },
    });
    if (isStillBilling(subscription)) {
      throw new ConflictException(
        "Cancel the team's subscription first, so it isn't charged again.",
      );
    }
    await this.prisma.organization.delete({ where: { id: team.id } });
    await this.record(userId, team.id, 'TEAM_DELETED', {
      type: 'organization',
      id: team.id,
    });
  }

  async members(team: TTeamContext): Promise<TTeamMember[]> {
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId: team.id },
      select: {
        role: true,
        createdAt: true,
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return members.map(({ role, createdAt, user }) => ({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role,
      joinedAt: createdAt.toISOString(),
    }));
  }

  /**
   * Makes a member an admin or a member again. Owners change hands only by
   * a transfer; nobody changes their own role.
   */
  async setRole(
    userId: string,
    team: TTeamContext,
    memberId: string,
    role: OrganizationRole,
  ) {
    if (role === OrganizationRole.OWNER) {
      throw new BadRequestException(
        'Transfer ownership to make someone owner.',
      );
    }
    if (memberId === userId) {
      throw new ForbiddenException("You can't change your own role.");
    }
    const member = await this.member(team.id, memberId);
    if (member.role === OrganizationRole.OWNER) {
      throw new ForbiddenException("The owner's role can't be changed.");
    }
    await this.prisma.organizationMember.update({
      where: {
        organizationId_userId: { organizationId: team.id, userId: memberId },
      },
      data: { role },
    });
    await this.record(
      userId,
      team.id,
      'MEMBER_ROLE_CHANGED',
      { type: 'user', id: memberId },
      { from: member.role, to: role },
    );
  }

  /**
   * Removes someone from the team. Anyone but the owner can leave; owners
   * and admins can remove others except the owner.
   */
  async removeMember(userId: string, team: TTeamContext, memberId: string) {
    const member = await this.member(team.id, memberId);
    const leaving = memberId === userId;
    if (member.role === OrganizationRole.OWNER) {
      throw new ForbiddenException(
        leaving
          ? 'Transfer ownership before leaving the team.'
          : "The owner can't be removed.",
      );
    }
    if (!leaving && team.role === OrganizationRole.MEMBER) {
      throw new ForbiddenException('Only team owners and admins can do that.');
    }
    await this.prisma.organizationMember.delete({
      where: {
        organizationId_userId: { organizationId: team.id, userId: memberId },
      },
    });
    await this.record(
      userId,
      team.id,
      leaving ? 'MEMBER_LEFT' : 'MEMBER_REMOVED',
      { type: 'user', id: memberId },
    );
  }

  /** Makes another member the owner; the previous owner becomes an admin. */
  async transferOwnership(
    userId: string,
    team: TTeamContext,
    memberId: string,
  ) {
    if (memberId === userId) {
      throw new BadRequestException('You already own this team.');
    }
    await this.member(team.id, memberId);
    await this.prisma.$transaction([
      this.prisma.organizationMember.update({
        where: {
          organizationId_userId: { organizationId: team.id, userId: memberId },
        },
        data: { role: OrganizationRole.OWNER },
      }),
      this.prisma.organizationMember.update({
        where: {
          organizationId_userId: { organizationId: team.id, userId },
        },
        data: { role: OrganizationRole.ADMIN },
      }),
    ]);
    await this.record(userId, team.id, 'OWNERSHIP_TRANSFERRED', {
      type: 'user',
      id: memberId,
    });
  }

  /** Invites that haven't been accepted and still work, newest first. */
  async invites(team: TTeamContext): Promise<TTeamInvite[]> {
    const invites = await this.prisma.organizationInvite.findMany({
      where: {
        organizationId: team.id,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    const inviters = await this.emailsOf(
      invites.flatMap(({ invitedById }) => (invitedById ? [invitedById] : [])),
    );
    return invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      invitedBy:
        (invite.invitedById && inviters.get(invite.invitedById)) ?? null,
      expiresAt: invite.expiresAt.toISOString(),
      createdAt: invite.createdAt.toISOString(),
    }));
  }

  /**
   * Emails an invite. The team's plan must include teams and have room for
   * one more (members besides the owner and pending invites both count).
   * Inviting the same email again replaces the earlier invite.
   */
  async invite(
    userId: string,
    team: TTeamContext,
    email: string,
    role: OrganizationRole,
  ) {
    if (role === OrganizationRole.OWNER) {
      throw new BadRequestException('Invite as an admin or a member.');
    }
    if (
      role === OrganizationRole.ADMIN &&
      team.role !== OrganizationRole.OWNER
    ) {
      throw new ForbiddenException('Only the team owner can invite admins.');
    }
    const normalized = email.trim().toLowerCase();
    const existing = await this.prisma.organizationMember.findFirst({
      where: { organizationId: team.id, user: { email: normalized } },
    });
    if (existing) {
      throw new ConflictException('That person is already in the team.');
    }

    const entitlements = await this.entitlements.forOrganization(team.id);
    entitlements.assertCan('organization.team');
    const now = new Date();
    // An earlier invite to this email is replaced, so it doesn't count.
    entitlements.assertAllowsAnother(
      'org.members.max',
      await this.seatsTaken(team.id, now, normalized),
    );
    await this.prisma.organizationInvite.deleteMany({
      where: { organizationId: team.id, email: normalized, acceptedAt: null },
    });

    const token = createToken(16);
    const invite = await this.prisma.organizationInvite.create({
      data: {
        organizationId: team.id,
        email: normalized,
        role,
        tokenHash: hashToken(token),
        invitedById: userId,
        expiresAt: new Date(now.getTime() + INVITE_TTL_MS),
      },
      include: { organization: { select: { name: true } } },
    });
    await this.mail.sendTeamInvite(normalized, invite.organization.name, token);
    await this.record(
      userId,
      team.id,
      'MEMBER_INVITED',
      { type: 'invite', id: invite.id },
      { role },
    );
    return { id: invite.id };
  }

  async revokeInvite(userId: string, team: TTeamContext, inviteId: string) {
    const { count } = await this.prisma.organizationInvite.deleteMany({
      where: { id: inviteId, organizationId: team.id, acceptedAt: null },
    });
    if (count === 0) throw new NotFoundException('Invite not found');
    await this.record(userId, team.id, 'INVITE_REVOKED', {
      type: 'invite',
      id: inviteId,
    });
  }

  /** What an invite link is for; 404 once it's used, revoked or expired. */
  async previewInvite(token: string): Promise<TInvitePreview> {
    const invite = await this.usableInvite(token);
    const inviters = await this.emailsOf(
      invite.invitedById ? [invite.invitedById] : [],
    );
    return {
      teamName: invite.organization.name,
      email: invite.email,
      role: invite.role,
      invitedBy:
        (invite.invitedById && inviters.get(invite.invitedById)) ?? null,
      expiresAt: invite.expiresAt.toISOString(),
    };
  }

  /**
   * Joins the team an invite is for. Only the invited email can accept it,
   * so a forwarded link doesn't let someone else in.
   */
  async acceptInvite(userId: string, token: string): Promise<TTeamSummary> {
    const invite = await this.usableInvite(token);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true },
    });
    if (user.email !== invite.email) {
      throw new ForbiddenException(
        `This invite is for ${invite.email}. Sign in with that email to accept it.`,
      );
    }
    // The plan may have changed since the invite was sent.
    const entitlements = await this.entitlements.forOrganization(
      invite.organizationId,
    );
    const max = entitlements.limit('org.members.max');
    const members = await this.prisma.organizationMember.count({
      where: {
        organizationId: invite.organizationId,
        role: { not: OrganizationRole.OWNER },
      },
    });
    if (
      !entitlements.can('organization.team') ||
      (max !== null && members >= max)
    ) {
      throw new ConflictException(
        "The team's plan has no room for another member. Ask its owner to upgrade.",
      );
    }
    await this.prisma.$transaction([
      this.prisma.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: invite.organizationId,
            userId,
          },
        },
        create: {
          organizationId: invite.organizationId,
          userId,
          role: invite.role,
        },
        update: {},
      }),
      this.prisma.organizationInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ]);
    await this.record(userId, invite.organizationId, 'INVITE_ACCEPTED', {
      type: 'invite',
      id: invite.id,
    });
    const membership = await this.prisma.organizationMember.findUniqueOrThrow({
      where: {
        organizationId_userId: {
          organizationId: invite.organizationId,
          userId,
        },
      },
      select: { role: true },
    });
    return {
      id: invite.organizationId,
      name: invite.organization.name,
      slug: invite.organization.slug,
      role: membership.role,
    };
  }

  /**
   * Before an account is deleted: teams it owns with other people in them
   * must be handed over first, and none may still be billing. Returns the
   * teams it owns alone, to delete with it.
   */
  async teamsToDeleteWithUser(tx: Prisma.TransactionClient, userId: string) {
    const owned = await tx.organization.findMany({
      where: {
        type: OrganizationType.TEAM,
        members: { some: { userId, role: OrganizationRole.OWNER } },
      },
      select: {
        id: true,
        name: true,
        subscription: true,
        _count: { select: { members: true } },
      },
    });
    for (const team of owned) {
      if (team._count.members > 1) {
        throw new ConflictException(
          `Transfer ownership of ${team.name} to someone else first.`,
        );
      }
      if (isStillBilling(team.subscription)) {
        throw new ConflictException(
          `Cancel the subscription of ${team.name} first, so it isn't charged again.`,
        );
      }
    }
    return owned.map(({ id }) => id);
  }

  /**
   * Members besides the owner plus invites still pending (other than one to
   * `exceptEmail`, which is being replaced).
   */
  private async seatsTaken(
    organizationId: string,
    now: Date,
    exceptEmail?: string,
  ) {
    const [members, invites] = await Promise.all([
      this.prisma.organizationMember.count({
        where: { organizationId, role: { not: OrganizationRole.OWNER } },
      }),
      this.prisma.organizationInvite.count({
        where: {
          organizationId,
          acceptedAt: null,
          expiresAt: { gt: now },
          ...(exceptEmail && { email: { not: exceptEmail } }),
        },
      }),
    ]);
    return members + invites;
  }

  private async usableInvite(token: string) {
    const invite = await this.prisma.organizationInvite.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        organization: {
          select: { name: true, slug: true, deletedAt: true },
        },
      },
    });
    if (
      !invite ||
      invite.acceptedAt ||
      invite.expiresAt <= new Date() ||
      invite.organization.deletedAt
    ) {
      throw new NotFoundException(
        'This invite has expired or was already used. Ask for a new one.',
      );
    }
    return invite;
  }

  private async member(organizationId: string, userId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  private async emailsOf(ids: string[]) {
    const users = ids.length
      ? await this.prisma.user.findMany({
          where: { id: { in: [...new Set(ids)] } },
          select: { id: true, email: true },
        })
      : [];
    return new Map(users.map(({ id, email }) => [id, email]));
  }

  private record(
    userId: string,
    organizationId: string,
    action: Parameters<AuditService['record']>[0]['action'],
    resource: { type: string; id: string },
    metadata?: Record<string, unknown>,
  ) {
    return this.audit.record({
      actor: { type: 'USER', id: userId },
      action,
      resource,
      organizationId,
      metadata,
    });
  }
}
