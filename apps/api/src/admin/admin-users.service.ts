import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { hasPlatformRole } from '../authz/platform-roles.js';
import { EntitlementService } from '../entitlements/entitlements.service.js';
import { PlatformRole, type Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsageService } from '../usage/usage.service.js';
import type { ListUsersQuery } from './admin.dto.js';

/** What admins see of a user: never password hashes or tokens. */
const USER_FIELDS = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  emailVerifiedAt: true,
  disabledAt: true,
  lastActiveAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
  ) {}

  async list({ search, status, role, page, pageSize }: ListUsersQuery) {
    const where: Prisma.UserWhereInput = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(status && {
        disabledAt: status === 'disabled' ? { not: null } : null,
      }),
      ...(role && { role }),
    };
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          ...USER_FIELDS,
          _count: { select: { cvs: true } },
          personalOrganization: {
            select: {
              subscription: {
                select: {
                  status: true,
                  provider: true,
                  plan: { select: { key: true, name: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: users.map(({ _count, personalOrganization, ...user }) => ({
        ...user,
        cvCount: _count.cvs,
        subscription: personalOrganization?.subscription ?? null,
      })),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async detail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_FIELDS,
        _count: { select: { sessions: true } },
        memberships: {
          select: {
            role: true,
            organization: { select: { id: true, name: true, type: true } },
          },
        },
        personalOrganization: {
          select: {
            id: true,
            subscription: {
              select: {
                id: true,
                status: true,
                provider: true,
                providerSubscriptionId: true,
                currentPeriodEnd: true,
                cancelAtPeriodEnd: true,
                overrides: true,
                plan: { select: { key: true, name: true } },
                price: { select: { period: true } },
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const { _count, personalOrganization, ...profile } = user;
    const organizationId = personalOrganization?.id;
    const [usage, activity] = await Promise.all([
      organizationId
        ? this.entitlements
            .forOrganization(organizationId)
            .then((entitlements) =>
              this.usage.summary(organizationId, entitlements),
            )
        : null,
      this.prisma.auditLog.findMany({
        where: { OR: [{ actorId: id }, { resourceId: id }] },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);
    return {
      ...profile,
      activeSessions: _count.sessions,
      subscription: personalOrganization?.subscription ?? null,
      usage,
      recentActivity: activity,
    };
  }

  /**
   * Disables (or re-enables) an account. Disabling signs it out everywhere
   * at once. Only super admins can disable admins, and nobody themselves.
   */
  async setDisabled(admin: TAuthContext, id: string, disabled: boolean) {
    const target = await this.target(admin, id);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { disabledAt: disabled ? new Date() : null },
      }),
      ...(disabled
        ? [this.prisma.session.deleteMany({ where: { userId: id } })]
        : []),
    ]);
    await this.audit.record({
      actor: { type: 'USER', id: admin.userId },
      action: disabled ? 'USER_DISABLED' : 'USER_ENABLED',
      resource: { type: 'user', id: target.id },
    });
  }

  /** Changes someone's platform role; super admins only, never their own. */
  async setRole(admin: TAuthContext, id: string, role: PlatformRole) {
    if (admin.role !== PlatformRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can change roles.');
    }
    const target = await this.target(admin, id);
    if (target.role === role) return;
    await this.prisma.user.update({ where: { id }, data: { role } });
    await this.audit.record({
      actor: { type: 'USER', id: admin.userId },
      action: 'USER_ROLE_CHANGED',
      resource: { type: 'user', id },
      metadata: { from: target.role, to: role },
    });
  }

  /** Someone the admin may act on: not themselves, not someone above them. */
  private async target(admin: TAuthContext, id: string) {
    if (id === admin.userId) {
      throw new BadRequestException("You can't do this to your own account.");
    }
    const target = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!target) throw new NotFoundException('User not found');
    // Admins can act on users; only super admins on other admins.
    if (
      target.role !== PlatformRole.USER &&
      !hasPlatformRole(admin.role, PlatformRole.SUPER_ADMIN)
    ) {
      throw new ForbiddenException('Only super admins can change admins.');
    }
    return target;
  }
}
