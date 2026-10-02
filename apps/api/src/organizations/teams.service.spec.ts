import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { AuditService } from '../audit/audit.service.js';
import { hashToken } from '../auth/utils/token.js';
import type { TTeamContext } from '../authz/team-access.guard.js';
import {
  PlanFeatureRequiredException,
  PlanLimitReachedException,
} from '../entitlements/entitlements.errors.js';
import type { EntitlementService } from '../entitlements/entitlements.service.js';
import { resolveEntitlements } from '../entitlements/resolve-entitlements.js';
import {
  OrganizationRole,
  SubscriptionStatus,
} from '../generated/prisma/client.js';
import type { MailService } from '../mail/mail.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { AssetsService } from '../storage/assets.service.js';
import { isStillBilling, teamSlug, TeamsService } from './teams.service.js';

const owner: TTeamContext = { id: 'team', role: OrganizationRole.OWNER };
const admin: TTeamContext = { id: 'team', role: OrganizationRole.ADMIN };
const member: TTeamContext = { id: 'team', role: OrganizationRole.MEMBER };

const plan = (features: string[], limits: Record<string, number | null>) =>
  resolveEntitlements(
    null,
    { key: 'team', name: 'Team', features, limits },
    new Date(),
  );

const setup = ({
  roles = { me: 'OWNER', ann: 'ADMIN', bob: 'MEMBER' } as Record<
    string,
    OrganizationRole
  >,
  entitlements = plan(['organization.team'], { 'org.members.max': 5 }),
  pendingInvites = 0,
  userEmail = 'new@example.com',
} = {}) => {
  const writes: string[] = [];
  const track = (op: string, result: unknown = {}) =>
    vi.fn(() => {
      writes.push(op);
      return Promise.resolve(result);
    });
  const prisma = {
    organizationMember: {
      findUnique: vi.fn(
        ({ where }: { where: { organizationId_userId: { userId: string } } }) =>
          Promise.resolve(
            roles[where.organizationId_userId.userId]
              ? { role: roles[where.organizationId_userId.userId] }
              : null,
          ),
      ),
      findUniqueOrThrow: vi.fn().mockResolvedValue({ role: 'MEMBER' }),
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn(() =>
        Promise.resolve(
          Object.values(roles).filter((role) => role !== 'OWNER').length,
        ),
      ),
      update: track('member.update'),
      delete: track('member.delete'),
      upsert: track('member.upsert'),
    },
    organizationInvite: {
      count: vi.fn().mockResolvedValue(pendingInvites),
      deleteMany: track('invite.deleteMany', { count: 1 }),
      create: track('invite.create', {
        id: 'inv',
        organization: { name: 'Acme' },
      }),
      update: track('invite.update'),
      findUnique: vi.fn(({ where }: { where: { tokenHash: string } }) =>
        Promise.resolve(
          where.tokenHash === hashToken('good')
            ? {
                id: 'inv',
                organizationId: 'team',
                email: 'new@example.com',
                role: 'MEMBER',
                invitedById: null,
                acceptedAt: null,
                expiresAt: new Date(Date.now() + 60_000),
                organization: { name: 'Acme', slug: 'acme', deletedAt: null },
              }
            : null,
        ),
      ),
    },
    user: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({ email: userEmail }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    $transaction: vi.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };
  const mail = { sendTeamInvite: vi.fn() };
  const service = new TeamsService(
    prisma as unknown as PrismaService,
    {
      forOrganization: vi.fn().mockResolvedValue(entitlements),
    } as unknown as EntitlementService,
    mail as unknown as MailService,
    { record: vi.fn() } as unknown as AuditService,
    { removeForOrganization: vi.fn() } as unknown as AssetsService,
  );
  return { service, writes, mail };
};

describe('teamSlug', () => {
  it('makes a readable, unique-ish slug', () => {
    expect(teamSlug('Đorđe & Co. Design!')).toMatch(
      /^djordje-co-design-[0-9a-f]{6}$/,
    );
    expect(teamSlug('!!!')).toMatch(/^team-[0-9a-f]{6}$/);
  });
});

describe('isStillBilling', () => {
  const paid = {
    provider: 'paddle',
    status: SubscriptionStatus.ACTIVE,
    currentPeriodEnd: new Date('2099-01-01'),
    trialEndsAt: null,
    cancelAtPeriodEnd: false,
  };
  it('is true only for a paid plan that will renew', () => {
    expect(isStillBilling(paid)).toBe(true);
    expect(isStillBilling({ ...paid, cancelAtPeriodEnd: true })).toBe(false);
    expect(isStillBilling({ ...paid, provider: 'none' })).toBe(false);
    expect(isStillBilling(null)).toBe(false);
  });
});

describe('TeamsService', () => {
  describe('roles', () => {
    it("won't make anyone owner, or change the owner or yourself", async () => {
      const { service } = setup();
      await expect(
        service.setRole('ann', admin, 'bob', OrganizationRole.OWNER),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.setRole('ann', admin, 'me', OrganizationRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.setRole('ann', admin, 'ann', OrganizationRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lets an admin promote a member', async () => {
      const { service, writes } = setup();
      await service.setRole('ann', admin, 'bob', OrganizationRole.ADMIN);
      expect(writes).toEqual(['member.update']);
    });
  });

  describe('removing', () => {
    it('lets a member leave, but not remove others', async () => {
      const { service, writes } = setup();
      await expect(service.removeMember('bob', member, 'ann')).rejects.toThrow(
        ForbiddenException,
      );
      await service.removeMember('bob', member, 'bob');
      expect(writes).toEqual(['member.delete']);
    });

    it("won't remove the owner, who must transfer before leaving", async () => {
      const { service } = setup();
      await expect(service.removeMember('ann', admin, 'me')).rejects.toThrow(
        "The owner can't be removed.",
      );
      await expect(service.removeMember('me', owner, 'me')).rejects.toThrow(
        /Transfer ownership/,
      );
    });

    it('404s for someone not in the team', async () => {
      const { service } = setup();
      await expect(service.removeMember('me', owner, 'zed')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  it('transfers ownership, leaving the old owner an admin', async () => {
    const { service, writes } = setup();
    await service.transferOwnership('me', owner, 'bob');
    expect(writes).toEqual(['member.update', 'member.update']);
  });

  describe('invites', () => {
    it('needs a plan with teams', async () => {
      const { service, mail } = setup({ entitlements: plan([], {}) });
      await expect(
        service.invite('me', owner, 'new@example.com', OrganizationRole.MEMBER),
      ).rejects.toThrow(PlanFeatureRequiredException);
      expect(mail.sendTeamInvite).not.toHaveBeenCalled();
    });

    it('counts members and pending invites against the seat limit', async () => {
      const { service, writes } = setup({
        entitlements: plan(['organization.team'], { 'org.members.max': 3 }),
        pendingInvites: 1,
      });
      await expect(
        service.invite('me', owner, 'new@example.com', OrganizationRole.MEMBER),
      ).rejects.toThrow(PlanLimitReachedException);
      // The check comes first, so an earlier invite isn't lost to a refusal.
      expect(writes).toEqual([]);
    });

    it('lets only the owner invite admins', async () => {
      const { service } = setup();
      await expect(
        service.invite('ann', admin, 'new@example.com', OrganizationRole.ADMIN),
      ).rejects.toThrow(ForbiddenException);
    });

    it('replaces an earlier invite and emails the new link', async () => {
      const { service, writes, mail } = setup();
      await service.invite(
        'me',
        owner,
        ' New@Example.com ',
        OrganizationRole.MEMBER,
      );
      expect(writes).toEqual(['invite.deleteMany', 'invite.create']);
      expect(mail.sendTeamInvite).toHaveBeenCalledWith(
        'new@example.com',
        'Acme',
        expect.any(String),
      );
    });

    it('accepts only for the invited email', async () => {
      const { service } = setup({ userEmail: 'someone@example.com' });
      await expect(service.acceptInvite('u', 'good')).rejects.toThrow(
        /This invite is for new@example.com/,
      );
    });

    it("won't accept once the plan has no room", async () => {
      const { service } = setup({
        entitlements: plan(['organization.team'], { 'org.members.max': 2 }),
      });
      await expect(service.acceptInvite('u', 'good')).rejects.toThrow(
        ConflictException,
      );
    });

    it('joins the team with the invited role', async () => {
      const { service, writes } = setup();
      await expect(service.acceptInvite('u', 'good')).resolves.toMatchObject({
        id: 'team',
        name: 'Acme',
      });
      expect(writes).toEqual(['member.upsert', 'invite.update']);
    });

    it('404s for an unknown token', async () => {
      const { service } = setup();
      await expect(service.previewInvite('bad')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
