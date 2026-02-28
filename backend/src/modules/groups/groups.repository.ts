import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createGroup(data: {
  name: string;
  inviteCode: string;
  channelId: string;
}) {
  return prisma.group.create({
    data,
    include: { _count: { select: { members: true } } },
  });
}

export async function addMember(userId: string, groupId: string, role = 'member') {
  return prisma.groupMember.create({
    data: { userId, groupId, role },
  });
}

export async function findGroupByInviteCode(inviteCode: string) {
  return prisma.group.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
    include: { _count: { select: { members: true } }, channel: true },
  });
}

export async function findMembership(userId: string, groupId: string) {
  return prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
}

export async function getGroupsByChannel(channelId: string) {
  return prisma.group.findMany({
    where: { channelId },
    include: { _count: { select: { members: true, items: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCheckedItemCountsByChannel(channelId: string) {
  const result = await prisma.item.groupBy({
    by: ['groupId'],
    where: {
      group: { channelId },
      checked: true,
    },
    _count: { id: true },
  });
  return Object.fromEntries(result.map((r) => [r.groupId, r._count.id]));
}

export async function getGroupItemCounts(groupId: string) {
  const [total, checked] = await Promise.all([
    prisma.item.count({ where: { groupId } }),
    prisma.item.count({ where: { groupId, checked: true } }),
  ]);
  return { total, checked };
}

export async function removeMember(userId: string, groupId: string) {
  return prisma.groupMember.delete({
    where: { userId_groupId: { userId, groupId } },
  });
}

export async function updateGroup(groupId: string, data: { name?: string }) {
  return prisma.group.update({
    where: { id: groupId },
    data,
    include: { _count: { select: { members: true } } },
  });
}

export async function getGroup(groupId: string) {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: { _count: { select: { members: true } }, channel: true },
  });
}
