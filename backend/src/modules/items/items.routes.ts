import { FastifyInstance } from 'fastify';
import { itemsController } from './items.controller.js';

async function authGuard(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ message: 'Unauthorized' });
  }
}

export async function itemsRoutes(fastify: FastifyInstance) {
  fastify.get('/:groupId/items', { preHandler: [authGuard] }, itemsController.list);
  fastify.post('/:groupId/items', { preHandler: [authGuard] }, itemsController.add);
  fastify.patch('/:groupId/items/:itemId', { preHandler: [authGuard] }, itemsController.update);
  fastify.delete('/:groupId/items/:itemId', { preHandler: [authGuard] }, itemsController.delete);
}
