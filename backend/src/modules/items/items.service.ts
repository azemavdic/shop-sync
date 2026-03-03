import * as repo from './items.repository.js';
import * as articlesService from '../articles/articles.service.js';
import { canAccessGroup } from '../../utils/can-access-group.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getItems(userId: string, groupId: string) {
  if (!(await canAccessGroup(userId, groupId))) throw new Error('Not a channel member');
  const items = await repo.getItemsByGroup(groupId);
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    quantity: i.quantity,
    price: i.price != null ? Number(i.price) : null,
    checked: i.checked,
    addedById: i.addedById,
    addedByName: i.addedBy.name,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));
}

export async function addItem(
  userId: string,
  groupId: string,
  data: { name: string; quantity?: number }
) {
  const access = await canAccessGroup(userId, groupId);
  if (!access) throw new Error('Not a channel member');
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { channelId: true },
  });
  if (!group) throw new Error('Group not found');
  let price: number | undefined;
  try {
    price = await articlesService.findOrCreateArticle(
      userId,
      group.channelId,
      data.name.trim()
    );
  } catch {
    price = undefined;
  }
  const item = await repo.createItem({
    name: data.name.trim(),
    quantity: data.quantity ?? 1,
    price,
    addedById: userId,
    groupId,
  });
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price != null ? Number(item.price) : null,
    checked: item.checked,
    addedById: item.addedById,
    addedByName: item.addedBy.name,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function updateItem(
  userId: string,
  groupId: string,
  itemId: string,
  data: { name?: string; quantity?: number; price?: number | null; checked?: boolean }
) {
  if (!(await canAccessGroup(userId, groupId))) throw new Error('Not a channel member');
  await repo.updateItem(itemId, groupId, data);
  const item = await repo.getItem(itemId, groupId);
  if (!item) throw new Error('Item not found');
  if (data.name !== undefined || data.price !== undefined) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { channelId: true },
    });
    if (group) {
      try {
        await articlesService.createArticle(userId, group.channelId, {
          name: item.name.trim(),
          price: Number(item.price ?? 0),
        });
      } catch {
        // ignore article sync errors
      }
    }
  }
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price != null ? Number(item.price) : null,
    checked: item.checked,
    addedById: item.addedById,
    addedByName: item.addedBy.name,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function deleteItem(userId: string, groupId: string, itemId: string) {
  const access = await canAccessGroup(userId, groupId);
  if (!access) throw new Error('Not a channel member');
  const { isAdmin } = access;
  const item = await repo.getItem(itemId, groupId);
  if (!item) throw new Error('Item not found');
  if (item.addedById !== userId && !isAdmin)
    throw new Error('Only the item creator or group admin can delete it');
  await repo.deleteItem(itemId, groupId);
}
