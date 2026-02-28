import { FastifyInstance } from 'fastify';
import { channelsController } from './channels.controller.js';

async function authGuard(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ message: 'Unauthorized' });
  }
}

export async function channelsRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: [authGuard] }, channelsController.create);
  fastify.post('/join', { preHandler: [authGuard] }, channelsController.join);
  fastify.get('/', { preHandler: [authGuard] }, channelsController.list);
  fastify.get('/:channelId/members', { preHandler: [authGuard] }, channelsController.getMembers);
  fastify.delete('/:channelId/members/:userId', { preHandler: [authGuard] }, channelsController.removeMember);
  fastify.post('/:channelId/invite', { preHandler: [authGuard] }, channelsController.invite);
  fastify.delete('/:channelId/leave', { preHandler: [authGuard] }, channelsController.leave);
  fastify.delete('/:channelId', { preHandler: [authGuard] }, channelsController.delete);
  fastify.patch('/:channelId', { preHandler: [authGuard] }, channelsController.update);
}
