import { FastifyRequest, FastifyReply } from 'fastify';
import * as itemsService from './items.service.js';
import { addItemSchema, updateItemSchema } from './items.schemas.js';
import * as socket from '../../socket/index.js';

export const itemsController = {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { groupId } = req.params as { groupId: string };
    try {
      const items = await itemsService.getItems(payload.userId, groupId);
      return reply.send({ items });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      return reply.status(403).send({ message: msg });
    }
  },

  async add(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { groupId } = req.params as { groupId: string };
    const parsed = addItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.errors[0]?.message });
    }
    try {
      const item = await itemsService.addItem(
        payload.userId,
        groupId,
        parsed.data
      );
      socket.emitItemAdded(groupId, item);
      return reply.status(201).send(item);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      return reply.status(403).send({ message: msg });
    }
  },

  async update(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { groupId, itemId } = req.params as { groupId: string; itemId: string };
    const parsed = updateItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.errors[0]?.message });
    }
    const raw = parsed.data as { name?: string; quantity?: number | null; checked?: boolean };
    const data: { name?: string; quantity?: number; checked?: boolean } = {
      ...raw,
      quantity: raw.quantity ?? undefined,
    };
    try {
      const item = await itemsService.updateItem(
        payload.userId,
        groupId,
        itemId,
        data
      );
      socket.emitItemEdited(groupId, item);
      return reply.send(item);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      return reply.status(403).send({ message: msg });
    }
  },

  async delete(req: FastifyRequest, reply: FastifyReply) {
    const payload = await req.jwtVerify<{ userId: string }>();
    const { groupId, itemId } = req.params as { groupId: string; itemId: string };
    try {
      await itemsService.deleteItem(payload.userId, groupId, itemId);
      socket.emitItemDeleted(groupId, itemId);
      return reply.send({ message: 'Item deleted successfully' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      return reply.status(403).send({ message: msg });
    }
  },
};
