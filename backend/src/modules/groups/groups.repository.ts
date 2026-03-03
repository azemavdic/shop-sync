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

export async function getGroupTotalPricesByChannel(channelId: string) {
  const groups = await prisma.group.findMany({
    where: { channelId },
    select: { id: true },
  });
  const prices: Record<string, number> = {};
  for (const g of groups) {
    const items = await prisma.item.findMany({
      where: { groupId: g.id },
      select: { price: true, quantity: true },
    });
    const total = items.reduce(
      (sum, i) => sum + Number(i.price ?? 0) * (i.quantity ?? 1),
      0
    );
    prices[g.id] = total;
  }
  return prices;
}

export async function getGroupCheckedPricesByChannel(channelId: string) {
  const groups = await prisma.group.findMany({
    where: { channelId },
    select: { id: true },
  });
  const prices: Record<string, number> = {};
  for (const g of groups) {
    const items = await prisma.item.findMany({
      where: { groupId: g.id, checked: true },
      select: { price: true, quantity: true },
    });
    const total = items.reduce(
      (sum, i) => sum + Number(i.price ?? 0) * (i.quantity ?? 1),
      0
    );
    prices[g.id] = total;
  }
  return prices;
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

export async function deleteGroup(groupId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.item.deleteMany({ where: { groupId } });
    await tx.groupMember.deleteMany({ where: { groupId } });
    await tx.group.delete({ where: { id: groupId } });
  });
}
