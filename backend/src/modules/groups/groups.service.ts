import { PrismaClient } from '@prisma/client';
import { generateInviteCode } from '../../utils/invite-code.js';
import * as repo from './groups.repository.js';

const prisma = new PrismaClient();

async function isChannelMember(userId: string, channelId: string): Promise<boolean> {
  const m = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId, channelId } },
  });
  return !!m;
}

export async function createGroup(
  userId: string,
  channelId: string,
  name: string
) {
  if (!(await isChannelMember(userId, channelId)))
    throw new Error('Not a channel member');
  let code = generateInviteCode();
  let exists = await repo.findGroupByInviteCode(code);
  while (exists) {
    code = generateInviteCode();
    exists = await repo.findGroupByInviteCode(code);
  }
  const group = await repo.createGroup({ name, inviteCode: code, channelId });
  await repo.addMember(userId, group.id, 'admin');
  return {
    id: group.id,
    name: group.name,
    inviteCode: group.inviteCode,
    channelId: group.channelId,
    itemCount: 0,
    checkedItemCount: 0,
  };
}

export async function joinGroup(userId: string, inviteCode: string) {
  const group = await repo.findGroupByInviteCode(inviteCode);
  if (!group) throw new Error('Invalid invite code');
  if (!(await isChannelMember(userId, group.channelId)))
    throw new Error('Not a channel member');
  const existing = await repo.findMembership(userId, group.id);
  if (existing) throw new Error('Already a member');
  await repo.addMember(userId, group.id);
  const itemCounts = await repo.getGroupItemCounts(group.id);
  return {
    id: group.id,
    name: group.name,
    inviteCode: group.inviteCode,
    channelId: group.channelId,
    itemCount: itemCounts.total,
    checkedItemCount: itemCounts.checked,
  };
}

export async function getGroupsByChannel(userId: string, channelId: string) {
  if (!(await isChannelMember(userId, channelId)))
    throw new Error('Not a channel member');
  const [groups, checkedCounts] = await Promise.all([
    repo.getGroupsByChannel(channelId),
    repo.getCheckedItemCountsByChannel(channelId),
  ]);
  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    inviteCode: g.inviteCode,
    channelId: g.channelId,
    itemCount: g._count.items,
    checkedItemCount: checkedCounts[g.id] ?? 0,
  }));
}

export async function leaveGroup(userId: string, groupId: string) {
  const membership = await repo.findMembership(userId, groupId);
  if (!membership) throw new Error('Not a member');
  await repo.removeMember(userId, groupId);
}

export async function updateGroup(
  userId: string,
  groupId: string,
  data: { name: string }
) {
  const membership = await repo.findMembership(userId, groupId);
  if (!membership) throw new Error('Not a member');
  if (membership.role !== 'admin') throw new Error('Only admins can update');
  const group = await repo.updateGroup(groupId, data);
  const itemCounts = await repo.getGroupItemCounts(groupId);
  return {
    id: group.id,
    name: group.name,
    inviteCode: group.inviteCode,
    channelId: group.channelId,
    itemCount: itemCounts.total,
    checkedItemCount: itemCounts.checked,
  };
}
