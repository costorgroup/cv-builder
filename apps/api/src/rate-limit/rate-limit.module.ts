import { Global, Logger, Module } from '@nestjs/common';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service.js';
import { DatabaseThrottlerStorage } from './database-throttler.storage.js';

/** Where every rate limit counts requests; see RateLimitModule. */
export const RATE_LIMIT_STORAGE = Symbol('RATE_LIMIT_STORAGE');

/**
 * One store for every rate limit (per IP, per API key). In memory by
 * default, which is per instance; RATE_LIMIT_STORE=database shares the
 * counts through Postgres, for running more than one API instance.
 */
@Global()
@Module({
  providers: [
    {
      provide: RATE_LIMIT_STORAGE,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => {
        if (process.env.RATE_LIMIT_STORE === 'database') {
          new Logger('RateLimit').log('Counting requests in the database');
          return new DatabaseThrottlerStorage(prisma);
        }
        return new ThrottlerStorageService();
      },
    },
  ],
  exports: [RATE_LIMIT_STORAGE],
})
export class RateLimitModule {}
