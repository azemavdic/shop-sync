import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, username: true, name: true },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });
}

export async function findUserByEmailOrUsername(identifier: string) {
  const lower = identifier.toLowerCase();
  return prisma.user.findFirst({
    where: {
      OR: [
        { email: lower },
        { username: lower },
      ],
    },
  });
}

export async function createUser(data: {
  email: string;
  username: string;
  password: string;
  name: string;
}) {
  return prisma.user.create({
    data: {
      ...data,
      email: data.email.toLowerCase(),
      username: data.username.toLowerCase(),
    },
    select: { id: true, email: true, username: true, name: true, createdAt: true },
  });
}

export async function createUserFromOAuth(data: {
  email: string;
  username: string;
  passwordHash: string;
  name: string;
}) {
  return prisma.user.create({
    data: {
      ...data,
      email: data.email.toLowerCase(),
      username: data.username.toLowerCase(),
    },
    select: { id: true, email: true, username: true, name: true, createdAt: true },
  });
}

export async function updateUser(
  id: string,
  data: { name?: string; username?: string }
) {
  return prisma.user.update({
    where: { id },
    data: data.username ? { ...data, username: data.username.toLowerCase() } : data,
    select: { id: true, email: true, username: true, name: true },
  });
}
