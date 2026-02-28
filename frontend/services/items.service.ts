import { config } from '../constants/config';
import { useAuthStore } from '../stores/authStore';

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ListItem {
  id: string;
  name: string;
  quantity?: number;
  checked: boolean;
  addedById: string;
  addedByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export async function getItems(groupId: string): Promise<ListItem[]> {
  const res = await fetch(`${config.apiUrl}/groups/${groupId}/items`, {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch items');
  return data.items;
}

export async function addItem(
  groupId: string,
  name: string,
  quantity?: number
): Promise<ListItem> {
  const res = await fetch(`${config.apiUrl}/groups/${groupId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ name, quantity }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to add item');
  return data;
}

export async function updateItem(
  groupId: string,
  itemId: string,
  updates: { name?: string; quantity?: number; checked?: boolean }
): Promise<ListItem> {
  const res = await fetch(
    `${config.apiUrl}/groups/${groupId}/items/${itemId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update item');
  return data;
}

export async function deleteItem(
  groupId: string,
  itemId: string
): Promise<void> {
  const res = await fetch(
    `${config.apiUrl}/groups/${groupId}/items/${itemId}`,
    {
      method: 'DELETE',
      headers: getAuthHeader(),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to delete item');
}
