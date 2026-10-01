/**
 * Brings every subscription in line with the payment provider now, instead
 * of waiting for the next scheduled run. Run with `pnpm billing:reconcile`.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { createPaymentProvider } from './billing.module.js';
import { AuditService } from '../audit/audit.service.js';
import { BillingService } from './billing.service.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const prismaService = prisma as unknown as PrismaService;
new BillingService(
  prismaService,
  createPaymentProvider(),
  new AuditService(prismaService),
)
  .reconcile()
  .then((summary) => console.log(summary))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
