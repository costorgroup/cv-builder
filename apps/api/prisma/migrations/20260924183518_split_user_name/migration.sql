-- Split "name" into "firstName" / "lastName", keeping existing users' names:
-- the first word becomes the first name, the rest the last name.
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;

UPDATE "User"
SET "firstName" = split_part(btrim("name"), ' ', 1),
    "lastName" = btrim(substr(btrim("name"), length(split_part(btrim("name"), ' ', 1)) + 1));

ALTER TABLE "User" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "lastName" SET NOT NULL;
ALTER TABLE "User" DROP COLUMN "name";
