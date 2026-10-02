import type { PrismaService } from '../prisma/prisma.service.js';
import { DatabaseThrottlerStorage } from './database-throttler.storage.js';

describe('DatabaseThrottlerStorage', () => {
  const storageWith = (hits: number) => {
    const queryRaw = vi.fn().mockResolvedValue([{ hits }]);
    return {
      storage: new DatabaseThrottlerStorage({
        $queryRaw: queryRaw,
      } as unknown as PrismaService),
      queryRaw,
    };
  };

  it('counts per key and window, and blocks over the limit', async () => {
    const { storage, queryRaw } = storageWith(3);
    const record = await storage.increment('1.2.3.4', 60_000, 2, 0, 'default');
    expect(record).toMatchObject({ totalHits: 3, isBlocked: true });
    expect(record.timeToExpire).toBeGreaterThan(0);
    expect(record.timeToExpire).toBeLessThanOrEqual(60);
    // The key carries the limit's name, so limits never share a count.
    expect(queryRaw.mock.calls[0]).toContain('default:1.2.3.4');
  });

  it('lets requests through up to the limit', async () => {
    const { storage } = storageWith(2);
    expect(
      (await storage.increment('k', 60_000, 2, 0, 'apiKey')).isBlocked,
    ).toBe(false);
  });
});
