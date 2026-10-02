import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app-setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * With RATE_LIMIT_STORE=database, two API instances share one count: the
 * limit holds across them, not once per instance.
 */
describe('Shared rate limits (e2e)', () => {
  const apps: NestExpressApplication[] = [];
  const started = new Date();

  beforeAll(async () => {
    process.env.RATE_LIMIT_STORE = 'database';
    for (let i = 0; i < 2; i++) {
      const module = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      const app = configureApp(
        module.createNestApplication<NestExpressApplication>({ rawBody: true }),
      );
      await app.init();
      apps.push(app);
    }
  });

  afterAll(async () => {
    await apps[0]?.get(PrismaService).rateLimitCounter.deleteMany({
      where: {
        windowStart: { gte: new Date(started.getTime() - 60 * 60_000) },
      },
    });
    for (const app of apps) await app.close();
    delete process.env.RATE_LIMIT_STORE;
  });

  it('counts requests to either instance together', async () => {
    // Counts start over each minute: don't start just before one turns.
    const intoMinute = Date.now() % 60_000;
    if (intoMinute > 50_000) {
      await new Promise((resolve) => setTimeout(resolve, 60_500 - intoMinute));
    }
    const statuses: number[] = [];
    // Sign-in allows 5 a minute; alternate between the two instances.
    for (let i = 0; i < 6; i++) {
      const response = await request(apps[i % 2]!.getHttpServer())
        .post('/auth/sign-in')
        .send({
          email: `nobody-${started.getTime()}@example.com`,
          password: 'wrong-password',
        });
      statuses.push(response.status);
    }
    expect(statuses.slice(0, 5).every((status) => status !== 429)).toBe(true);
    expect(statuses[5]).toBe(429);
  });
});
