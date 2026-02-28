import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../../.env') });
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { loadEnv } from './config/env.js';

const env = loadEnv();

const fastify = Fastify({ logger: true });

async function bootstrap() {
  await fastify.register(cors, { origin: true });
  await fastify.register(jwt, { secret: env.JWT_SECRET });

  fastify.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ message: 'Unauthorized' });
    }
  });

  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  const { authRoutes } = await import('./modules/auth/auth.routes.js');
  const { channelsRoutes } = await import('./modules/channels/channels.routes.js');
  const { groupsRoutes } = await import('./modules/groups/groups.routes.js');
  const { itemsRoutes } = await import('./modules/items/items.routes.js');

  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(channelsRoutes, { prefix: '/api/v1/channels' });
  await fastify.register(groupsRoutes, { prefix: '/api/v1' });
  await fastify.register(itemsRoutes, { prefix: '/api/v1/groups' });

  const port = env.PORT;
  await fastify.listen({ port, host: '0.0.0.0' });
  console.log(`ShopSyncX API running on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
