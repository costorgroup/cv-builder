-- CreateEnum
CREATE TYPE "TemplateTier" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('PUBLISHED', 'HIDDEN');

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "tier" "TemplateTier" NOT NULL DEFAULT 'PREMIUM',
    "status" "TemplateStatus" NOT NULL DEFAULT 'HIDDEN',
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Template_status_sortOrder_idx" ON "Template"("status", "sortOrder");


-- The templates as they were offered in code: default, classic and minimal
-- free, the rest premium, in the order the editor listed them.
INSERT INTO "Template" ("id", "tier", "status", "category", "sortOrder", "updatedAt") VALUES
  ('default',   'FREE',    'PUBLISHED', 'Simple',       10,  CURRENT_TIMESTAMP),
  ('modern',    'PREMIUM', 'PUBLISHED', 'Modern',       20,  CURRENT_TIMESTAMP),
  ('classic',   'FREE',    'PUBLISHED', 'Professional', 30,  CURRENT_TIMESTAMP),
  ('minimal',   'FREE',    'PUBLISHED', 'Simple',       40,  CURRENT_TIMESTAMP),
  ('executive', 'PREMIUM', 'PUBLISHED', 'Professional', 50,  CURRENT_TIMESTAMP),
  ('creative',  'PREMIUM', 'PUBLISHED', 'Creative',     60,  CURRENT_TIMESTAMP),
  ('columns',   'PREMIUM', 'PUBLISHED', 'Modern',       70,  CURRENT_TIMESTAMP),
  ('elegant',   'PREMIUM', 'PUBLISHED', 'Professional', 80,  CURRENT_TIMESTAMP),
  ('tech',      'PREMIUM', 'PUBLISHED', 'Modern',       90,  CURRENT_TIMESTAMP),
  ('timeline',  'PREMIUM', 'PUBLISHED', 'Creative',     100, CURRENT_TIMESTAMP),
  ('bold',      'PREMIUM', 'PUBLISHED', 'Creative',     110, CURRENT_TIMESTAMP);
