import { FastifyRequest, FastifyReply } from 'fastify';
import * as groupsService from './groups.service.js';
import { createGroupSchema, joinGroupSchema, updateGroupSchema } from './groups.schemas.js';

export const groupsController = {
  async create(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { channelId } = req.params as { channelId: string };
    const parsed = createGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.errors[0]?.message });
    }
    try {
      const group = await groupsService.createGroup(
        payload.userId,
        channelId,
        parsed.data.name
      );
      return reply.status(201).send(group);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      return reply.status(403).send({ message: msg });
    }
  },

  async join(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const parsed = joinGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.errors[0]?.message });
    }
    try {
      const group = await groupsService.joinGroup(
        payload.userId,
        parsed.data.inviteCode.toUpperCase()
      );
      return reply.send({ group, message: 'Joined group successfully' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to join';
      if (msg.includes('Invalid')) return reply.status(404).send({ message: msg });
      if (msg.includes('Already')) return reply.status(409).send({ message: msg });
      if (msg.includes('channel')) return reply.status(403).send({ message: msg });
      throw err;
    }
  },

  async list(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { channelId } = req.params as { channelId: string };
    try {
      const groups = await groupsService.getGroupsByChannel(
        payload.userId,
        channelId
      );
      return reply.send({ groups });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      return reply.status(403).send({ message: msg });
    }
  },

  async leave(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { groupId } = req.params as { groupId: string };
    try {
      await groupsService.leaveGroup(payload.userId, groupId);
      return reply.send({ message: 'Left group successfully' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to leave';
      return reply.status(400).send({ message: msg });
    }
  },

  async update(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { groupId } = req.params as { groupId: string };
    const parsed = updateGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.errors[0]?.message });
    }
    try {
      const group = await groupsService.updateGroup(
        payload.userId,
        groupId,
        parsed.data
      );
      return reply.send(group);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      return reply.status(403).send({ message: msg });
    }
  },
};
