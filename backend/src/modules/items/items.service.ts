import * as repo from './items.repository.js';
import { canAccessGroup } from '../../utils/can-access-group.js';

export async function getItems(userId: string, groupId: string) {
  if (!(await canAccessGroup(userId, groupId))) throw new Error('Not a channel member');
  const items = await repo.getItemsByGroup(groupId);
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    quantity: i.quantity,
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
  if (!(await canAccessGroup(userId, groupId))) throw new Error('Not a channel member');
  const item = await repo.createItem({
    name: data.name,
    quantity: data.quantity,
    addedById: userId,
    groupId,
  });
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
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
  data: { name?: string; quantity?: number; checked?: boolean }
) {
  if (!(await canAccessGroup(userId, groupId))) throw new Error('Not a channel member');
  await repo.updateItem(itemId, groupId, data);
  const item = await repo.getItem(itemId, groupId);
  if (!item) throw new Error('Item not found');
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    checked: item.checked,
    addedById: item.addedById,
    addedByName: item.addedBy.name,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function deleteItem(userId: string, groupId: string, itemId: string) {
  if (!(await canAccessGroup(userId, groupId))) throw new Error('Not a channel member');
  const item = await repo.getItem(itemId, groupId);
  if (!item) throw new Error('Item not found');
  if (item.addedById !== userId) throw new Error('Only the user who created the item can delete it');
  await repo.deleteItem(itemId, groupId);
}
