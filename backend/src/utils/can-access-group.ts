import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Channel members have access to all groups in that channel */
export async function canAccessGroup(
  userId: string,
  groupId: string
): Promise<false | { canAccess: true; isAdmin: boolean }> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { channelId: true },
  });
  if (!group) return false;
  const channelMember = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId, channelId: group.channelId } },
  });
  if (!channelMember) return false;
  const groupMember = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  return {
    canAccess: true,
    isAdmin: groupMember?.role === 'admin',
  };
}
