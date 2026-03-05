-- AlterTable: Add position column to Item for drag-and-drop ordering
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "position" INTEGER NOT NULL DEFAULT 0;

-- Set position for existing items based on createdAt order
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "groupId" ORDER BY "createdAt" ASC) - 1 AS pos
  FROM "Item"
)
UPDATE "Item" SET "position" = ranked.pos FROM ranked WHERE "Item".id = ranked.id;

-- Drop old index and create new one for position-based ordering
DROP INDEX IF EXISTS "Item_groupId_checked_createdAt_idx";
CREATE INDEX IF NOT EXISTS "Item_groupId_position_idx" ON "Item"("groupId", "position");
