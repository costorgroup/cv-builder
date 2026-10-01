import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { AuditService } from '../audit/audit.service.js';
import type { TAuthContext } from '../auth/auth.types.js';
import type { EntitlementService } from '../entitlements/entitlements.service.js';
import { PlatformRole } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { UsageService } from '../usage/usage.service.js';
import { AdminUsersService } from './admin-users.service.js';

const admin: TAuthContext = {
  userId: 'admin',
  sessionId: 's',
  role: PlatformRole.ADMIN,
};
const superAdmin: TAuthContext = {
  ...admin,
  userId: 'super',
  role: PlatformRole.SUPER_ADMIN,
};

const setup = (targetRole: PlatformRole = PlatformRole.USER) => {
  const calls: string[] = [];
  const prisma = {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'target', role: targetRole }),
      update: vi.fn(({ data }) => {
        calls.push(`user.update ${JSON.stringify(data)}`);
        return Promise.resolve({});
      }),
    },
    session: {
      deleteMany: vi.fn(() => {
        calls.push('sessions.deleteMany');
        return Promise.resolve({ count: 2 });
      }),
    },
    $transaction: vi.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const service = new AdminUsersService(
    prisma as unknown as PrismaService,
    {} as EntitlementService,
    {} as UsageService,
    audit as unknown as AuditService,
  );
  return { service, calls, audit };
};

describe('AdminUsersService', () => {
  it('disables a user and signs them out everywhere', async () => {
    const { service, calls, audit } = setup();

    await service.setDisabled(admin, 'target', true);
    expect(calls).toContain('sessions.deleteMany');
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_DISABLED',
        actor: { type: 'USER', id: 'admin' },
      }),
    );
  });

  it('re-enables without touching sessions', async () => {
    const { service, calls, audit } = setup();

    await service.setDisabled(admin, 'target', false);
    expect(calls).not.toContain('sessions.deleteMany');
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_ENABLED' }),
    );
  });

  it("won't let anyone disable or change their own account", async () => {
    const { service } = setup();

    await expect(service.setDisabled(admin, 'admin', true)).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      service.setRole(superAdmin, 'super', PlatformRole.USER),
    ).rejects.toThrow(BadRequestException);
  });

  it('lets only super admins act on other admins', async () => {
    const { service } = setup(PlatformRole.ADMIN);

    await expect(service.setDisabled(admin, 'target', true)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(
      service.setDisabled(superAdmin, 'target', true),
    ).resolves.toBeUndefined();
  });

  it('lets only super admins change roles', async () => {
    const { service, audit } = setup();

    await expect(
      service.setRole(admin, 'target', PlatformRole.ADMIN),
    ).rejects.toThrow(ForbiddenException);
    await service.setRole(superAdmin, 'target', PlatformRole.ADMIN);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_ROLE_CHANGED',
        metadata: { from: PlatformRole.USER, to: PlatformRole.ADMIN },
      }),
    );
  });
});
