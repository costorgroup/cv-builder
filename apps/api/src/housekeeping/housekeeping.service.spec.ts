import type { PrismaService } from '../prisma/prisma.service.js';
import { HousekeepingService } from './housekeeping.service.js';

describe('HousekeepingService', () => {
  it('clears only what is past its time', async () => {
    const now = new Date('2026-10-02T12:00:00Z');
    const calls: Record<string, unknown> = {};
    const table = (name: string, count: number) => ({
      deleteMany: vi.fn((args: unknown) => {
        calls[name] = args;
        return Promise.resolve({ count });
      }),
    });
    const prisma = {
      embedLaunchToken: table('launchTokens', 3),
      authToken: table('authTokens', 1),
      session: table('sessions', 2),
      organizationInvite: table('invites', 0),
      rateLimitCounter: table('rateLimits', 40),
      $transaction: vi.fn((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    };
    const service = new HousekeepingService(prisma as unknown as PrismaService);

    expect(await service.run(now)).toEqual({
      launchTokens: 3,
      authTokens: 1,
      sessions: 2,
      invites: 0,
      rateLimits: 40,
    });
    expect(calls.sessions).toEqual({ where: { expiresAt: { lt: now } } });
    // Finished invites are kept a month, for their audit trail.
    expect(JSON.stringify(calls.invites)).toContain('2026-09-02T12:00:00.000Z');
    expect(JSON.stringify(calls.rateLimits)).toContain(
      '2026-10-01T12:00:00.000Z',
    );
  });
});
