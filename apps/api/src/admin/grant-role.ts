/**
 * Gives someone a platform role from the command line, e.g. the first
 * super admin: `pnpm admin:grant person@example.com SUPER_ADMIN`. After that,
 * super admins can change roles in the admin area.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PlatformRole, PrismaClient } from '../generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const main = async () => {
  const [email, role = PlatformRole.SUPER_ADMIN] = process.argv.slice(2);
  if (!email || !(role in PlatformRole)) {
    throw new Error(
      `Usage: pnpm admin:grant <email> [${Object.values(PlatformRole).join('|')}]`,
    );
  }
  const user = await prisma.user.update({
    where: { email: email.trim().toLowerCase() },
    data: { role: role as PlatformRole },
  });
  await prisma.auditLog.create({
    data: {
      actorType: 'SYSTEM',
      actorId: 'cli',
      action: 'USER_ROLE_CHANGED',
      resourceType: 'user',
      resourceId: user.id,
      metadata: { to: user.role },
    },
  });
  console.log(`${user.email} is now ${user.role}.`);
};

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
