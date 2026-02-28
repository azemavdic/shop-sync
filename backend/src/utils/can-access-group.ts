import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Channel members have access to all groups in that channel */
export async function canAccessGroup(
  userId: string,
  groupId: string
): Promise<boolean> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { channelId: true },
  });
  if (!group) return false;
  const m = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId, channelId: group.channelId } },
  });
  return !!m;
}
