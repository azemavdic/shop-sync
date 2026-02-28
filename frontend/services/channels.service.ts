import { config } from '../constants/config';
import { useAuthStore } from '../stores/authStore';

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface Channel {
  id: string;
  name: string;
  inviteCode: string;
  memberCount?: number;
  createdById?: string;
}

export async function createChannel(name: string): Promise<Channel> {
  const res = await fetch(`${config.apiUrl}/channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to create channel');
  return data;
}

export async function joinChannel(inviteCode: string): Promise<Channel> {
  const res = await fetch(`${config.apiUrl}/channels/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ inviteCode: inviteCode.toUpperCase() }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to join channel');
  return data.channel;
}

export async function getChannels(): Promise<Channel[]> {
  const res = await fetch(`${config.apiUrl}/channels`, {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch channels');
  return data.channels;
}

export async function leaveChannel(channelId: string): Promise<void> {
  const res = await fetch(`${config.apiUrl}/channels/${channelId}/leave`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to leave channel');
}

export async function deleteChannel(channelId: string): Promise<void> {
  const res = await fetch(`${config.apiUrl}/channels/${channelId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to delete channel');
}

export interface ChannelMember {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  joinedAt: string;
}

export async function getChannelMembers(channelId: string): Promise<ChannelMember[]> {
  const res = await fetch(`${config.apiUrl}/channels/${channelId}/members`, {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to fetch members');
  return data.members;
}

export async function inviteToChannel(
  channelId: string,
  emailOrUsername: string
): Promise<void> {
  const res = await fetch(`${config.apiUrl}/channels/${channelId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ emailOrUsername: emailOrUsername.trim() }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to invite');
}

export async function removeChannelMember(
  channelId: string,
  userId: string
): Promise<void> {
  const res = await fetch(
    `${config.apiUrl}/channels/${channelId}/members/${userId}`,
    {
      method: 'DELETE',
      headers: getAuthHeader(),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to remove member');
}

export async function updateChannel(
  channelId: string,
  name: string
): Promise<Channel> {
  const res = await fetch(`${config.apiUrl}/channels/${channelId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to update channel');
  return data;
}
