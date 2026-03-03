import { FastifyRequest, FastifyReply } from 'fastify';
import * as articlesService from './articles.service.js';
import { createArticleSchema, updateArticleSchema } from './articles.schemas.js';

export const articlesController = {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { channelId } = req.params as { channelId: string };
    const search = (req.query as { search?: string }).search;
    try {
      const articles = await articlesService.getArticles(
        payload.userId,
        channelId,
        search
      );
      return reply.send({ articles });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      return reply.status(403).send({ message: msg });
    }
  },

  async create(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { channelId } = req.params as { channelId: string };
    const parsed = createArticleSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.errors[0]?.message });
    }
    try {
      const article = await articlesService.createArticle(
        payload.userId,
        channelId,
        parsed.data
      );
      return reply.status(201).send(article);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      return reply.status(403).send({ message: msg });
    }
  },

  async update(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { channelId, articleId } = req.params as {
      channelId: string;
      articleId: string;
    };
    const parsed = updateArticleSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.errors[0]?.message });
    }
    try {
      const article = await articlesService.updateArticle(
        payload.userId,
        channelId,
        articleId,
        parsed.data
      );
      return reply.send(article);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      return reply.status(403).send({ message: msg });
    }
  },

  async delete(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { channelId, articleId } = req.params as {
      channelId: string;
      articleId: string;
    };
    try {
      await articlesService.deleteArticle(payload.userId, channelId, articleId);
      return reply.send({ message: 'Article deleted' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      return reply.status(403).send({ message: msg });
    }
  },
};
