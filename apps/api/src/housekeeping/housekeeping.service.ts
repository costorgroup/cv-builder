import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** How long finished invites are kept, so their audit trail still makes sense. */
const INVITE_KEEP_MS = 30 * DAY;

/**
 * Clears records that only matter until they expire: embed launch tokens,
 * email tokens, sessions and old invites. Hourly; nothing here is needed
 * once it's past its time, and keeping it would only grow the tables.
 */
@Injectable()
export class HousekeepingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HousekeepingService.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    this.timer = setInterval(
      () =>
        void this.run().catch((error: unknown) =>
          this.logger.error(`Housekeeping failed: ${String(error)}`),
        ),
      HOUR,
    );
    this.timer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  async run(now = new Date()) {
    const [launchTokens, authTokens, sessions, invites, rateLimits] =
      await this.prisma.$transaction([
        this.prisma.embedLaunchToken.deleteMany({
          where: { expiresAt: { lt: now } },
        }),
        this.prisma.authToken.deleteMany({ where: { expiresAt: { lt: now } } }),
        this.prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
        this.prisma.organizationInvite.deleteMany({
          where: {
            OR: [
              { expiresAt: { lt: new Date(now.getTime() - INVITE_KEEP_MS) } },
              { acceptedAt: { lt: new Date(now.getTime() - INVITE_KEEP_MS) } },
            ],
          },
        }),
        // Rate limit windows are at most a minute or an hour long.
        this.prisma.rateLimitCounter.deleteMany({
          where: { windowStart: { lt: new Date(now.getTime() - DAY) } },
        }),
      ]);
    const removed = {
      launchTokens: launchTokens.count,
      authTokens: authTokens.count,
      sessions: sessions.count,
      invites: invites.count,
      rateLimits: rateLimits.count,
    };
    if (Object.values(removed).some((count) => count > 0)) {
      this.logger.log(`Cleared expired records: ${JSON.stringify(removed)}`);
    }
    return removed;
  }
}
