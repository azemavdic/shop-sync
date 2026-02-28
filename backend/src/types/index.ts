import type { FastifyRequest } from 'fastify';

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: JwtPayload;
}
