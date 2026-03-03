import { PrismaClient } from '@prisma/client';
import * as repo from './articles.repository.js';

const prisma = new PrismaClient();

async function isChannelMember(userId: string, channelId: string): Promise<boolean> {
  const m = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId, channelId } },
  });
  return !!m;
}

export async function getArticles(userId: string, channelId: string, search?: string) {
  if (!(await isChannelMember(userId, channelId)))
    throw new Error('Not a channel member');
  const articles = await repo.findArticlesByChannel(channelId, search);
  return articles.map((a) => ({
    id: a.id,
    name: a.name,
    price: Number(a.price),
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function createArticle(
  userId: string,
  channelId: string,
  data: { name: string; price?: number }
) {
  if (!(await isChannelMember(userId, channelId)))
    throw new Error('Not a channel member');
  const article = await repo.createArticle({
    name: data.name.trim(),
    price: data.price ?? 0,
    channelId,
  });
  return {
    id: article.id,
    name: article.name,
    price: Number(article.price),
    createdAt: article.createdAt.toISOString(),
  };
}

export async function updateArticle(
  userId: string,
  channelId: string,
  articleId: string,
  data: { name?: string; price?: number }
) {
  if (!(await isChannelMember(userId, channelId)))
    throw new Error('Not a channel member');
  const article = await repo.updateArticle(articleId, channelId, data);
  if (!article) throw new Error('Article not found');
  return {
    id: article.id,
    name: article.name,
    price: Number(article.price),
    createdAt: article.createdAt.toISOString(),
  };
}

export async function deleteArticle(
  userId: string,
  channelId: string,
  articleId: string
) {
  if (!(await isChannelMember(userId, channelId)))
    throw new Error('Not a channel member');
  const result = await repo.deleteArticle(articleId, channelId);
  if (result.count === 0) throw new Error('Article not found');
}

/** Find or create article by name, returns price */
export async function findOrCreateArticle(
  userId: string,
  channelId: string,
  name: string
): Promise<number> {
  if (!(await isChannelMember(userId, channelId)))
    throw new Error('Not a channel member');
  const existing = await repo.findArticleByChannelAndName(channelId, name);
  if (existing) return Number(existing.price);
  const created = await repo.createArticle({
    name: name.trim(),
    price: 0,
    channelId,
  });
  return Number(created.price);
}
