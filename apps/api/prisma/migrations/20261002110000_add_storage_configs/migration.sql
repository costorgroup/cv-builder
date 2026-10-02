-- CreateTable
CREATE TABLE "StorageConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" "StorageKind" NOT NULL,
    "settings" JSONB NOT NULL,
    "credentialsEncrypted" BYTEA NOT NULL,
    "accessKeyHint" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StorageConfig_organizationId_key" ON "StorageConfig"("organizationId");

-- AddForeignKey
ALTER TABLE "StorageConfig" ADD CONSTRAINT "StorageConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

