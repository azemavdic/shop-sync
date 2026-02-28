import { FastifyRequest, FastifyReply } from 'fastify';
import * as channelsService from './channels.service.js';
import {
  createChannelSchema,
  joinChannelSchema,
  updateChannelSchema,
  inviteChannelSchema,
} from './channels.schemas.js';

export const channelsController = {
  async create(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const parsed = createChannelSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.errors[0]?.message });
    }
    const channel = await channelsService.createChannel(
      payload.userId,
      parsed.data.name
    );
    return reply.status(201).send(channel);
  },

  async join(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const parsed = joinChannelSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.errors[0]?.message });
    }
    try {
      const channel = await channelsService.joinChannel(
        payload.userId,
        parsed.data.inviteCode.toUpperCase()
      );
      return reply.send({ channel, message: 'Joined channel successfully' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to join';
      if (msg.includes('Invalid')) return reply.status(404).send({ message: msg });
      if (msg.includes('Already')) return reply.status(409).send({ message: msg });
      throw err;
    }
  },

  async list(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const channels = await channelsService.getUserChannels(payload.userId);
    return reply.send({ channels });
  },

  async leave(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { channelId } = req.params as { channelId: string };
    try {
      await channelsService.leaveChannel(payload.userId, channelId);
      return reply.send({ message: 'Left channel successfully' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to leave';
      return reply.status(400).send({ message: msg });
    }
  },

  async update(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { channelId } = req.params as { channelId: string };
    const parsed = updateChannelSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.errors[0]?.message });
    }
    try {
      const channel = await channelsService.updateChannel(
        payload.userId,
        channelId,
        parsed.data
      );
      return reply.send(channel);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      return reply.status(403).send({ message: msg });
    }
  },

  async delete(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { channelId } = req.params as { channelId: string };
    try {
      await channelsService.deleteChannel(payload.userId, channelId);
      return reply.send({ message: 'Channel deleted successfully' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete';
      return reply.status(403).send({ message: msg });
    }
  },

  async getMembers(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { channelId } = req.params as { channelId: string };
    try {
      const members = await channelsService.getChannelMembers(
        payload.userId,
        channelId
      );
      return reply.send({ members });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch members';
      return reply.status(400).send({ message: msg });
    }
  },

  async invite(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { channelId } = req.params as { channelId: string };
    const parsed = inviteChannelSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.errors[0]?.message });
    }
    try {
      const result = await channelsService.inviteUserToChannel(
        payload.userId,
        channelId,
        parsed.data.emailOrUsername.trim()
      );
      return reply.status(201).send({
        ...result,
        message: 'User invited to channel successfully',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to invite';
      if (msg.includes('not found')) return reply.status(404).send({ message: msg });
      if (msg.includes('already')) return reply.status(409).send({ message: msg });
      return reply.status(400).send({ message: msg });
    }
  },
};
