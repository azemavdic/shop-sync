-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Channel_inviteCode_key" ON "Channel"("inviteCode");

-- CreateIndex
CREATE INDEX "ChannelMember_userId_idx" ON "ChannelMember"("userId");

-- CreateIndex
CREATE INDEX "ChannelMember_channelId_idx" ON "ChannelMember"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelMember_userId_channelId_key" ON "ChannelMember"("userId", "channelId");

-- AddForeignKey
ALTER TABLE "ChannelMember" ADD CONSTRAINT "ChannelMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMember" ADD CONSTRAINT "ChannelMember_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add channelId as nullable first
ALTER TABLE "Group" ADD COLUMN "channelId" TEXT;

-- Create default channel for migration
INSERT INTO "Channel" ("id", "name", "inviteCode", "createdAt", "updatedAt")
VALUES (
  'clx_default_channel_migration',
  'Default',
  'DEF001',
  NOW(),
  NOW()
);

-- Update existing groups to use the default channel
UPDATE "Group" SET "channelId" = 'clx_default_channel_migration' WHERE "channelId" IS NULL;

-- Add channel members for users who have groups in the default channel (distinct users)
INSERT INTO "ChannelMember" ("id", "userId", "channelId", "role", "joinedAt")
SELECT 
  'clx_cm_' || substr(md5("u"."userId" || 'clx_default_channel_migration'), 1, 16),
  "u"."userId",
  'clx_default_channel_migration',
  'admin',
  NOW()
FROM (
  SELECT DISTINCT "gm"."userId"
  FROM "GroupMember" "gm"
  JOIN "Group" "g" ON "gm"."groupId" = "g"."id"
  WHERE "g"."channelId" = 'clx_default_channel_migration'
) "u"
ON CONFLICT ("userId", "channelId") DO NOTHING;

-- Make channelId required
ALTER TABLE "Group" ALTER COLUMN "channelId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
