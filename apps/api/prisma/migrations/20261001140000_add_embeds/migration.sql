-- AlterTable
ALTER TABLE "Cv" ADD COLUMN     "externalUserId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "EmbedConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "allowedOrigins" TEXT[],
    "theme" JSONB NOT NULL DEFAULT '{}',
    "branding" JSONB NOT NULL DEFAULT '{}',
    "templateIds" TEXT[],
    "sections" TEXT[],
    "features" TEXT[],
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmbedConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalUser" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),

    CONSTRAINT "ExternalUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbedLaunchToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "embedConfigId" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmbedLaunchToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmbedConfig_publicKey_key" ON "EmbedConfig"("publicKey");

-- CreateIndex
CREATE INDEX "EmbedConfig_organizationId_idx" ON "EmbedConfig"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalUser_organizationId_externalId_key" ON "ExternalUser"("organizationId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "EmbedLaunchToken_tokenHash_key" ON "EmbedLaunchToken"("tokenHash");

-- CreateIndex
CREATE INDEX "Cv_externalUserId_updatedAt_idx" ON "Cv"("externalUserId", "updatedAt");

-- AddForeignKey
ALTER TABLE "Cv" ADD CONSTRAINT "Cv_externalUserId_fkey" FOREIGN KEY ("externalUserId") REFERENCES "ExternalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbedConfig" ADD CONSTRAINT "EmbedConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalUser" ADD CONSTRAINT "ExternalUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbedLaunchToken" ADD CONSTRAINT "EmbedLaunchToken_embedConfigId_fkey" FOREIGN KEY ("embedConfigId") REFERENCES "EmbedConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbedLaunchToken" ADD CONSTRAINT "EmbedLaunchToken_externalUserId_fkey" FOREIGN KEY ("externalUserId") REFERENCES "ExternalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- A CV has exactly one owner: a platform user or an external user.
ALTER TABLE "Cv" ADD CONSTRAINT "Cv_one_owner" CHECK (("userId" IS NULL) <> ("externalUserId" IS NULL));
