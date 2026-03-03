import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function findArticlesByChannel(
  channelId: string,
  search?: string
) {
  const where: { channelId: string; nameLower?: { contains: string } } = {
    channelId,
  };
  if (search && search.trim()) {
    where.nameLower = { contains: search.trim().toLowerCase() };
  }
  return prisma.article.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

export async function findArticleByChannelAndName(
  channelId: string,
  name: string
) {
  const nameLower = name.trim().toLowerCase();
  return prisma.article.findUnique({
    where: {
      channelId_nameLower: { channelId, nameLower },
    },
  });
}

export async function createArticle(data: {
  name: string;
  price?: number;
  channelId: string;
}) {
  const name = data.name.trim();
  const nameLower = name.toLowerCase();
  const price = data.price ?? 0;
  return prisma.article.upsert({
    where: {
      channelId_nameLower: { channelId: data.channelId, nameLower },
    },
    create: {
      name,
      nameLower,
      price,
      channelId: data.channelId,
    },
    update: { price },
  });
}

export async function getArticle(articleId: string, channelId: string) {
  return prisma.article.findFirst({
    where: { id: articleId, channelId },
  });
}

export async function updateArticle(
  articleId: string,
  channelId: string,
  data: { name?: string; price?: number }
) {
  const article = await getArticle(articleId, channelId);
  if (!article) return null;
  const updateData: { name?: string; nameLower?: string; price?: number } = {};
  if (data.name !== undefined) {
    const name = data.name.trim();
    updateData.name = name;
    updateData.nameLower = name.toLowerCase();
  }
  if (data.price !== undefined) updateData.price = data.price;
  return prisma.article.update({
    where: { id: articleId },
    data: updateData,
  });
}

export async function deleteArticle(articleId: string, channelId: string) {
  return prisma.article.deleteMany({
    where: { id: articleId, channelId },
  });
}
