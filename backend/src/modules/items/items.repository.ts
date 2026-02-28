import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getItemsByGroup(groupId: string) {
  return prisma.item.findMany({
    where: { groupId },
    include: {
      addedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createItem(data: {
  name: string;
  quantity?: number;
  addedById: string;
  groupId: string;
}) {
  return prisma.item.create({
    data,
    include: {
      addedBy: { select: { id: true, name: true } },
    },
  });
}

export async function updateItem(
  itemId: string,
  groupId: string,
  data: { name?: string; quantity?: number; checked?: boolean }
) {
  return prisma.item.updateMany({
    where: { id: itemId, groupId },
    data,
  });
}

export async function getItem(itemId: string, groupId: string) {
  return prisma.item.findFirst({
    where: { id: itemId, groupId },
    include: {
      addedBy: { select: { id: true, name: true } },
    },
  });
}

export async function deleteItem(itemId: string, groupId: string) {
  return prisma.item.deleteMany({
    where: { id: itemId, groupId },
  });
}
