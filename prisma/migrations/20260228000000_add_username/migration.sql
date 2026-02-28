-- Add username as nullable first
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Backfill: use "user_" + first 8 chars of id for existing users (guaranteed unique)
UPDATE "User" SET "username" = 'user_' || SUBSTRING("id", 1, 8);

-- Make column required and unique
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
