import { FastifyRequest, FastifyReply } from 'fastify';
import * as authService from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  googleAuthSchema,
  facebookAuthSchema,
} from './auth.schemas.js';

export const authController = {
  async register(req: FastifyRequest, reply: FastifyReply) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.errors[0]?.message ?? 'Validation failed',
      });
    }
    const { email, username, password, name } = parsed.data;
    try {
      const user = await authService.register(email, username, password, name);
      const token = (req.server as any).jwt.sign(
        { userId: user.id, email: user.email },
        { expiresIn: '7d' }
      );
      return reply.status(201).send({
        user: { id: user.id, email: user.email, username: user.username, name: user.name },
        accessToken: token,
        expiresIn: 604800,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      if (msg.includes('already registered')) {
        return reply.status(409).send({ message: msg });
      }
      throw err;
    }
  },

  async login(req: FastifyRequest, reply: FastifyReply) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.errors[0]?.message ?? 'Validation failed',
      });
    }
    const { email, password } = parsed.data;
    try {
      const user = await authService.login(email, password);
      const token = (req.server as any).jwt.sign(
        { userId: user.id, email: user.email },
        { expiresIn: '7d' }
      );
      return reply.send({
        user: { id: user.id, email: user.email, username: user.username, name: user.name },
        accessToken: token,
        expiresIn: 604800,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      return reply.status(401).send({ message: msg });
    }
  },

  async me(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string; email: string }>();
    const user = await authService.getUserById(payload.userId);
    if (!user) return reply.status(401).send({ message: 'User not found' });
    return reply.send(user);
  },

  async google(req: FastifyRequest, reply: FastifyReply) {
    const parsed = googleAuthSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.errors[0]?.message ?? 'Validation failed',
      });
    }
    const { idToken } = parsed.data;
    try {
      const user = await authService.googleAuth(idToken);
      const token = (req.server as any).jwt.sign(
        { userId: user.id, email: user.email },
        { expiresIn: '7d' }
      );
      return reply.send({
        user: { id: user.id, email: user.email, username: user.username, name: user.name },
        accessToken: token,
        expiresIn: 604800,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google login failed';
      if (msg.includes('not configured')) {
        return reply.status(503).send({ message: msg });
      }
      return reply.status(401).send({ message: msg });
    }
  },

  async facebook(req: FastifyRequest, reply: FastifyReply) {
    const parsed = facebookAuthSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.errors[0]?.message ?? 'Validation failed',
      });
    }
    const { code, redirectUri } = parsed.data;
    try {
      const user = await authService.facebookAuth(code, redirectUri);
      const token = (req.server as any).jwt.sign(
        { userId: user.id, email: user.email },
        { expiresIn: '7d' }
      );
      return reply.send({
        user: { id: user.id, email: user.email, username: user.username, name: user.name },
        accessToken: token,
        expiresIn: 604800,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Facebook login failed';
      if (msg.includes('not configured')) {
        return reply.status(503).send({ message: msg });
      }
      return reply.status(401).send({ message: msg });
    }
  },

  async updateProfile(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.errors[0]?.message ?? 'Validation failed',
      });
    }
    const data = parsed.data;
    if (!data.name && !data.username) {
      return reply.status(400).send({ message: 'Provide name or username to update' });
    }
    try {
      const user = await authService.updateProfile(payload.userId, data);
      return reply.send(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      if (msg.includes('already taken')) {
        return reply.status(409).send({ message: msg });
      }
      throw err;
    }
  },

  async deleteAccount(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    try {
      await authService.deleteAccount(payload.userId);
      return reply.send({ message: 'Account deleted successfully' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account';
      return reply.status(400).send({ message: msg });
    }
  },
};
