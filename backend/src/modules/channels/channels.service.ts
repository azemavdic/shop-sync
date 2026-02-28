import { generateInviteCode } from '../../utils/invite-code.js';
import * as repo from './channels.repository.js';
import { findUserByEmailOrUsername } from '../auth/auth.repository.js';

export async function createChannel(userId: string, name: string) {
  let code = generateInviteCode();
  let exists = await repo.findChannelByInviteCode(code);
  while (exists) {
    code = generateInviteCode();
    exists = await repo.findChannelByInviteCode(code);
  }
  const channel = await repo.createChannel({
    name,
    inviteCode: code,
    createdById: userId,
  });
  await repo.addChannelMember(userId, channel.id, 'admin');
  return {
    id: channel.id,
    name: channel.name,
    inviteCode: channel.inviteCode,
    memberCount: 1,
    createdById: channel.createdById,
  };
}

export async function joinChannel(userId: string, inviteCode: string) {
  const channel = await repo.findChannelByInviteCode(inviteCode);
  if (!channel) throw new Error('Invalid invite code');
  const existing = await repo.findChannelMembership(userId, channel.id);
  if (existing) throw new Error('Already a member');
  await repo.addChannelMember(userId, channel.id);
  return {
    id: channel.id,
    name: channel.name,
    inviteCode: channel.inviteCode,
    memberCount: channel._count.members + 1,
  };
}

export async function getUserChannels(userId: string) {
  const memberships = await repo.getUserChannels(userId);
  return memberships.map((m) => ({
    id: m.channel.id,
    name: m.channel.name,
    inviteCode: m.channel.inviteCode,
    memberCount: m.channel._count.members,
    createdById: m.channel.createdById,
  }));
}

export async function leaveChannel(userId: string, channelId: string) {
  const membership = await repo.findChannelMembership(userId, channelId);
  if (!membership) throw new Error('Not a member');
  await repo.removeChannelMember(userId, channelId);
}

export async function updateChannel(
  userId: string,
  channelId: string,
  data: { name: string }
) {
  const channel = await repo.getChannel(channelId);
  if (!channel) throw new Error('Channel not found');
  if (channel.createdById !== userId)
    throw new Error('Only the channel creator can update');
  const updated = await repo.updateChannel(channelId, data);
  return {
    id: updated.id,
    name: updated.name,
    inviteCode: updated.inviteCode,
    memberCount: updated._count.members,
  };
}

export async function deleteChannel(userId: string, channelId: string) {
  const channel = await repo.getChannel(channelId);
  if (!channel) throw new Error('Channel not found');
  if (channel.createdById !== userId)
    throw new Error('Only the channel creator can delete');
  await repo.deleteChannel(channelId);
}

export async function getChannelMembers(userId: string, channelId: string) {
  const membership = await repo.findChannelMembership(userId, channelId);
  if (!membership) throw new Error('Not a channel member');
  const members = await repo.getChannelMembers(channelId);
  return members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    username: m.user.username,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
  }));
}

export async function inviteUserToChannel(
  inviterId: string,
  channelId: string,
  identifier: string
) {
  const membership = await repo.findChannelMembership(inviterId, channelId);
  if (!membership) throw new Error('Not a channel member');
  const user = await findUserByEmailOrUsername(identifier);
  if (!user) throw new Error('User not found');
  const existing = await repo.findChannelMembership(user.id, channelId);
  if (existing) throw new Error('User is already in the channel');
  await repo.addChannelMember(user.id, channelId);
  const channel = await repo.getChannel(channelId);
  return {
    user: { id: user.id, name: user.name, email: user.email, username: user.username },
    channel: {
      id: channel!.id,
      name: channel!.name,
      inviteCode: channel!.inviteCode,
    },
  };
}
