import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ message: 'Unauthorized' });
    }
  });

  fastify.post('/register', authController.register);
  fastify.post('/login', authController.login);
  fastify.post('/google', authController.google);
  fastify.post('/facebook', authController.facebook);
  fastify.get('/me', {
    preHandler: [(fastify as any).authenticate],
  }, authController.me);
  fastify.patch('/me', {
    preHandler: [(fastify as any).authenticate],
  }, authController.updateProfile);
  fastify.delete('/me', {
    preHandler: [(fastify as any).authenticate],
  }, authController.deleteAccount);
}
