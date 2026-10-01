/**
 * Publishes the plans to the payment provider (see
 * `BillingService.syncCatalog`), and makes sure Paddle.js has a client-side
 * token. Run with `pnpm billing:sync-catalog`; admins can also sync from the
 * Plans page.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { AuditService } from '../audit/audit.service.js';
import { PrismaClient } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { createPaymentProvider } from './billing.module.js';
import { BillingService } from './billing.service.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const main = async () => {
  const provider = createPaymentProvider();
  if (!provider) throw new Error('Set PADDLE_API_KEY first.');
  console.log(`Syncing plans to ${provider.name} (${provider.environment})…`);

  const prismaService = prisma as unknown as PrismaService;
  const billing = new BillingService(
    prismaService,
    provider,
    new AuditService(prismaService),
  );
  for (const { planKey, productId, prices } of await billing.syncCatalog()) {
    console.log(`  ${planKey}: product ${productId}, ${prices} prices`);
  }

  const token = await provider.ensureClientToken('CV Builder web');
  if (process.env.PADDLE_CLIENT_TOKEN !== token) {
    console.log(
      `\nAdd to apps/api/.env (a public, browser-side token):\nPADDLE_CLIENT_TOKEN=${token}`,
    );
  }
};

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
