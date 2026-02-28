import { FastifyInstance } from 'fastify';
import { groupsController } from './groups.controller.js';

async function authGuard(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ message: 'Unauthorized' });
  }
}

export async function groupsRoutes(fastify: FastifyInstance) {
  // Channel-scoped groups
  fastify.post(
    '/channels/:channelId/groups',
    { preHandler: [authGuard] },
    groupsController.create
  );
  fastify.get(
    '/channels/:channelId/groups',
    { preHandler: [authGuard] },
    groupsController.list
  );

  // Join group (by invite code - can be from any channel user is in)
  fastify.post('/groups/join', { preHandler: [authGuard] }, groupsController.join);

  // Group actions (groupId in path)
  fastify.delete(
    '/groups/:groupId',
    { preHandler: [authGuard] },
    groupsController.leave
  );
  fastify.patch(
    '/groups/:groupId',
    { preHandler: [authGuard] },
    groupsController.update
  );
  fastify.post(
    '/groups/:groupId/copy-to-channel',
    { preHandler: [authGuard] },
    groupsController.copyToChannel
  );
}
