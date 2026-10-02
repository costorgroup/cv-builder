-- CreateEnum
CREATE TYPE "AssetKind" AS ENUM ('PHOTO');

-- CreateEnum
CREATE TYPE "StorageKind" AS ENUM ('PLATFORM', 'S3');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cvId" TEXT,
    "userId" TEXT,
    "externalUserId" TEXT,
    "kind" "AssetKind" NOT NULL,
    "storage" "StorageKind" NOT NULL DEFAULT 'PLATFORM',
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asset_organizationId_idx" ON "Asset"("organizationId");

-- CreateIndex
CREATE INDEX "Asset_cvId_idx" ON "Asset"("cvId");

-- CreateIndex
CREATE INDEX "Asset_cvId_createdAt_idx" ON "Asset"("cvId", "createdAt");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "Cv"("id") ON DELETE SET NULL ON UPDATE CASCADE;

