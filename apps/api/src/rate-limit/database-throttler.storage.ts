import type { ThrottlerStorage } from '@nestjs/throttler';
import type { PrismaService } from '../prisma/prisma.service.js';

type ThrottlerStorageRecord = Awaited<
  ReturnType<ThrottlerStorage['increment']>
>;

/**
 * Rate limit counts in Postgres, so every API instance shares them: one
 * atomic upsert per request, counted in fixed windows of `ttl`. A blocked
 * key stays blocked until its window ends.
 */
export class DatabaseThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly prisma: PrismaService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    _blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const now = Date.now();
    const windowStart = new Date(Math.floor(now / ttl) * ttl);
    const [row] = await this.prisma.$queryRaw<{ hits: number }[]>`
      INSERT INTO "RateLimitCounter" ("key", "windowStart", "hits")
      VALUES (${`${throttlerName}:${key}`}, ${windowStart}, 1)
      ON CONFLICT ("key", "windowStart")
      DO UPDATE SET "hits" = "RateLimitCounter"."hits" + 1
      RETURNING "hits"`;
    const totalHits = Number(row?.hits ?? 1);
    const timeToExpire = Math.ceil((windowStart.getTime() + ttl - now) / 1000);
    const isBlocked = totalHits > limit;
    return {
      totalHits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire: isBlocked ? timeToExpire : 0,
    };
  }
}
