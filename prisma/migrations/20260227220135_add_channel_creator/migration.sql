-- Add createdById as nullable first
ALTER TABLE "Channel" ADD COLUMN "createdById" TEXT;

-- Backfill: set createdById to first admin, or first member, for each channel
UPDATE "Channel" c
SET "createdById" = COALESCE(
  (SELECT cm."userId" FROM "ChannelMember" cm WHERE cm."channelId" = c.id AND cm.role = 'admin' LIMIT 1),
  (SELECT cm."userId" FROM "ChannelMember" cm WHERE cm."channelId" = c.id ORDER BY cm."joinedAt" ASC LIMIT 1)
);

-- Delete orphan channels with no members (invalid state)
DELETE FROM "Channel" WHERE "createdById" IS NULL;

-- Make column required
ALTER TABLE "Channel" ALTER COLUMN "createdById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
