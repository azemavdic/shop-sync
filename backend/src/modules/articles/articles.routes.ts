import { FastifyInstance } from 'fastify';
import { articlesController } from './articles.controller.js';

async function authGuard(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ message: 'Unauthorized' });
  }
}

export async function articlesRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/:channelId/articles',
    { preHandler: [authGuard] },
    articlesController.list
  );
  fastify.post(
    '/:channelId/articles',
    { preHandler: [authGuard] },
    articlesController.create
  );
  fastify.patch(
    '/:channelId/articles/:articleId',
    { preHandler: [authGuard] },
    articlesController.update
  );
  fastify.delete(
    '/:channelId/articles/:articleId',
    { preHandler: [authGuard] },
    articlesController.delete
  );
}
