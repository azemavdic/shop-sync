import { config } from '../constants/config';
import { useAuthStore } from '../stores/authStore';

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  channelId?: string;
  itemCount?: number;
  checkedItemCount?: number;
}

export async function createGroup(
  channelId: string,
  name: string
): Promise<Group> {
  const res = await fetch(
    `${config.apiUrl}/channels/${channelId}/groups`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ name }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to create group');
  return data;
}

export async function joinGroup(inviteCode: string): Promise<Group> {
  const res = await fetch(`${config.apiUrl}/groups/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ inviteCode: inviteCode.toUpperCase() }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to join group');
  return data.group;
}

export async function getGroups(channelId: string): Promise<Group[]> {
  const res = await fetch(
    `${config.apiUrl}/channels/${channelId}/groups`,
    { headers: getAuthHeader() }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch groups');
  return data.groups;
}

export async function leaveGroup(groupId: string): Promise<void> {
  const res = await fetch(`${config.apiUrl}/groups/${groupId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to leave group');
}

export async function updateGroup(
  groupId: string,
  name: string
): Promise<Group> {
  const res = await fetch(`${config.apiUrl}/groups/${groupId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update group');
  return data;
}

export async function copyGroupToChannel(
  groupId: string,
  targetChannelId: string,
  name?: string
): Promise<Group> {
  const res = await fetch(
    `${config.apiUrl}/groups/${groupId}/copy-to-channel`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({
        targetChannelId,
        ...(name && { name }),
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to copy group');
  return data.group;
}
