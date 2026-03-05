import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getItemsByGroup(groupId: string) {
  return prisma.item.findMany({
    where: { groupId },
    include: {
      addedBy: { select: { id: true, name: true } },
    },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function getMaxPosition(groupId: string): Promise<number> {
  const result = await prisma.item.aggregate({
    where: { groupId },
    _max: { position: true },
  });
  return (result._max.position ?? -1) + 1;
}

export async function createItem(data: {
  name: string;
  quantity?: number;
  price?: number;
  addedById: string;
  groupId: string;
}) {
  const position = await getMaxPosition(data.groupId);
  return prisma.item.create({
    data: {
      ...data,
      quantity: data.quantity ?? 1,
      position,
    },
    include: {
      addedBy: { select: { id: true, name: true } },
    },
  });
}

export async function updateItem(
  itemId: string,
  groupId: string,
  data: { name?: string; quantity?: number; price?: number | null; checked?: boolean; position?: number }
) {
  return prisma.item.updateMany({
    where: { id: itemId, groupId },
    data,
  });
}

export async function reorderItems(groupId: string, itemIds: string[]) {
  await prisma.$transaction(
    itemIds.map((id, index) =>
      prisma.item.updateMany({
        where: { id, groupId },
        data: { position: index },
      })
    )
  );
  return getItemsByGroup(groupId);
}

export async function getItem(itemId: string, groupId: string) {
  return prisma.item.findFirst({
    where: { id: itemId, groupId },
    include: {
      addedBy: { select: { id: true, name: true } },
    },
  });
}

export async function findItemByGroupAndName(groupId: string, name: string) {
  const nameLower = name.trim().toLowerCase();
  const items = await prisma.item.findMany({
    where: { groupId },
    include: {
      addedBy: { select: { id: true, name: true } },
    },
  });
  return items.find((i) => i.name.trim().toLowerCase() === nameLower) ?? null;
}

export async function deleteItem(itemId: string, groupId: string) {
  return prisma.item.deleteMany({
    where: { id: itemId, groupId },
  });
}
