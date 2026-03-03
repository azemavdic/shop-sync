-- CreateTable (IF NOT EXISTS for PostgreSQL 9.5+)
CREATE TABLE IF NOT EXISTS "Article" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLower" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "channelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- Add price to Item (IF NOT EXISTS for PostgreSQL 9.6+)
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "price" DECIMAL(10,2);

-- Update existing items: set quantity to 1 where null
UPDATE "Item" SET "quantity" = 1 WHERE "quantity" IS NULL;

-- Make quantity required with default (safe if already applied)
ALTER TABLE "Item" ALTER COLUMN "quantity" SET DEFAULT 1;
ALTER TABLE "Item" ALTER COLUMN "quantity" SET NOT NULL;

-- CreateIndex (IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS "Article_channelId_nameLower_key" ON "Article"("channelId", "nameLower");
CREATE INDEX IF NOT EXISTS "Article_channelId_idx" ON "Article"("channelId");

-- AddForeignKey (ignore if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Article_channelId_fkey'
  ) THEN
    ALTER TABLE "Article" ADD CONSTRAINT "Article_channelId_fkey" 
      FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
