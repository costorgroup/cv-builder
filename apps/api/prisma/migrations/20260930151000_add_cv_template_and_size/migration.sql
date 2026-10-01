-- AlterTable
ALTER TABLE "Cv" ADD COLUMN     "sizeBytes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "templateId" TEXT;

-- Existing CVs: the template they use, and roughly their size (Postgres
-- prints JSON with a little more whitespace than the API does; each CV's
-- next save stores the exact figure).
UPDATE "Cv"
SET "templateId" = "appearance"->>'templateId',
    "sizeBytes" = octet_length("data"::text) + octet_length("appearance"::text);
