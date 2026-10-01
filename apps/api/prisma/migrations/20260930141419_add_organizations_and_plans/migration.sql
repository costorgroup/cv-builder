-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('PERSONAL', 'TEAM');

-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- AlterTable
-- Nullable until every CV is given its owner's organization below.
ALTER TABLE "Cv" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "disabledAt" TIMESTAMP(3),
ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "role" "PlatformRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "personalOwnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("organizationId","userId")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "features" TEXT[],
    "limits" JSONB NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanPrice" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "period" "BillingPeriod" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "providerPriceId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "priceId" TEXT,
    "status" "SubscriptionStatus" NOT NULL,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "provider" TEXT NOT NULL DEFAULT 'none',
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT,
    "overrides" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_personalOwnerId_key" ON "Organization"("personalOwnerId");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_key_key" ON "Plan"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PlanPrice_providerPriceId_key" ON "PlanPrice"("providerPriceId");

-- CreateIndex
CREATE INDEX "PlanPrice_planId_active_idx" ON "PlanPrice"("planId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_organizationId_key" ON "Subscription"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_providerSubscriptionId_key" ON "Subscription"("providerSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_status_currentPeriodEnd_idx" ON "Subscription"("status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "Cv_organizationId_updatedAt_idx" ON "Cv"("organizationId", "updatedAt");

-- AddForeignKey
ALTER TABLE "Cv" ADD CONSTRAINT "Cv_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_personalOwnerId_fkey" FOREIGN KEY ("personalOwnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPrice" ADD CONSTRAINT "PlanPrice_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "PlanPrice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Exactly one plan is the default (the "at least one" part is kept by the app).
CREATE UNIQUE INDEX "Plan_isDefault_key" ON "Plan"("isDefault") WHERE "isDefault";

-- Only personal organizations have (and must have) a personal owner.
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_personalOwner_check"
  CHECK (("type" = 'PERSONAL') = ("personalOwnerId" IS NOT NULL));

-- Initial plans, matching the pricing page. Feature and limit keys are the
-- API's entitlement registry; admins can change the values later.
INSERT INTO "Plan" ("id", "key", "name", "description", "isDefault", "sortOrder", "features", "limits", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'free', 'Free', 'Everything you need for your first great CV.', true, 0,
   ARRAY['cv.download.pdf'],
   '{"cv.max": 1}', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'premium', 'Premium', 'For job seekers tailoring a CV to every application.', false, 1,
   ARRAY['cv.download.pdf', 'template.premium', 'appearance.allColorSchemes', 'appearance.allFonts', 'appearance.resizeSections', 'cv.multiPage'],
   '{"cv.max": null}', CURRENT_TIMESTAMP);

INSERT INTO "PlanPrice" ("id", "planId", "period", "amountCents")
SELECT gen_random_uuid()::text, "Plan"."id", price."period"::"BillingPeriod", price."amountCents"
FROM "Plan"
CROSS JOIN (VALUES ('MONTHLY', 999), ('QUARTERLY', 2499), ('YEARLY', 7999)) AS price ("period", "amountCents")
WHERE "Plan"."key" = 'premium';

-- Every existing user gets what sign-up now creates: a personal
-- organization they own, on the free plan.
INSERT INTO "Organization" ("id", "type", "name", "slug", "personalOwnerId", "updatedAt")
SELECT gen_random_uuid()::text, 'PERSONAL', trim("firstName" || ' ' || "lastName"), 'personal-' || "id", "id", CURRENT_TIMESTAMP
FROM "User";

INSERT INTO "OrganizationMember" ("organizationId", "userId", "role")
SELECT "id", "personalOwnerId", 'OWNER'
FROM "Organization"
WHERE "type" = 'PERSONAL';

INSERT INTO "Subscription" ("id", "organizationId", "planId", "status", "updatedAt")
SELECT gen_random_uuid()::text, "Organization"."id", "Plan"."id", 'ACTIVE', CURRENT_TIMESTAMP
FROM "Organization"
JOIN "Plan" ON "Plan"."isDefault";

-- Each CV belongs to its owner's personal organization.
UPDATE "Cv"
SET "organizationId" = "Organization"."id"
FROM "Organization"
WHERE "Organization"."personalOwnerId" = "Cv"."userId";

ALTER TABLE "Cv" ALTER COLUMN "organizationId" SET NOT NULL;
