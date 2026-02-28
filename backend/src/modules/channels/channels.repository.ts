import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createChannel(data: {
  name: string;
  inviteCode: string;
  createdById: string;
}) {
  return prisma.channel.create({
    data,
    include: { _count: { select: { members: true } } },
  });
}

export async function addChannelMember(
  userId: string,
  channelId: string,
  role = 'member'
) {
  return prisma.channelMember.create({
    data: { userId, channelId, role },
  });
}

export async function findChannelByInviteCode(inviteCode: string) {
  return prisma.channel.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
    include: { _count: { select: { members: true } } },
  });
}

export async function findChannelMembership(userId: string, channelId: string) {
  return prisma.channelMember.findUnique({
    where: { userId_channelId: { userId, channelId } },
  });
}

export async function getUserChannels(userId: string) {
  return prisma.channelMember.findMany({
    where: { userId },
    include: {
      channel: {
        include: { _count: { select: { members: true } } },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
}

export async function removeChannelMember(userId: string, channelId: string) {
  return prisma.channelMember.delete({
    where: { userId_channelId: { userId, channelId } },
  });
}

export async function updateChannel(
  channelId: string,
  data: { name?: string }
) {
  return prisma.channel.update({
    where: { id: channelId },
    data,
    include: { _count: { select: { members: true } } },
  });
}

export async function getChannel(channelId: string) {
  return prisma.channel.findUnique({
    where: { id: channelId },
    include: { _count: { select: { members: true } }, createdBy: true },
  });
}

export async function deleteChannel(channelId: string) {
  return prisma.channel.delete({
    where: { id: channelId },
  });
}

export async function getChannelMembers(channelId: string) {
  return prisma.channelMember.findMany({
    where: { channelId },
    include: {
      user: {
        select: { id: true, name: true, email: true, username: true },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });
}
