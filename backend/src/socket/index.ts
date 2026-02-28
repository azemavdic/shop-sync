import type { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { loadEnv } from '../config/env.js';
import { canAccessGroup } from '../utils/can-access-group.js';

const env = loadEnv();

let io: Server | null = null;

export function setIO(server: Server) {
  io = server;
}

export function getIO(): Server | null {
  return io;
}

export function emitItemAdded(groupId: string, item: object) {
  io?.to(`group:${groupId}`).emit('item:added', { item });
}

export function emitItemEdited(groupId: string, item: object) {
  io?.to(`group:${groupId}`).emit('item:edited', { item });
}

export function emitItemChecked(groupId: string, itemId: string, checked: boolean) {
  io?.to(`group:${groupId}`).emit('item:checked', { itemId, checked });
}

export function emitItemDeleted(groupId: string, itemId: string) {
  io?.to(`group:${groupId}`).emit('item:deleted', { itemId });
}

export function setupSocketHandlers(server: Server) {
  server.on('connection', (socket) => {
    socket.on('authenticate', async (payload: { token?: string }) => {
      const token = payload?.token;
      if (!token) {
        socket.emit('error', { code: 'UNAUTHORIZED', message: 'Token required' });
        return;
      }
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        (socket as any).data = { ...((socket as any).data || {}), userId: decoded.userId };
        socket.emit('authenticated');
      } catch {
        socket.emit('error', { code: 'UNAUTHORIZED', message: 'Invalid token' });
      }
    });

    socket.on('group:join', async (payload: { groupId?: string }) => {
      const userId = (socket as any).data?.userId;
      if (!userId) {
        socket.emit('error', { code: 'UNAUTHORIZED', message: 'Authenticate first' });
        return;
      }
      const groupId = payload?.groupId;
      if (!groupId) {
        socket.emit('error', { code: 'BAD_REQUEST', message: 'groupId required' });
        return;
      }
      try {
        const ok = await canAccessGroup(userId, groupId);
        if (!ok) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'Not a group member' });
          return;
        }
        socket.join(`group:${groupId}`);
        socket.emit('group:joined', { groupId });
      } catch (err) {
        socket.emit('error', { code: 'ERROR', message: 'Failed to join group' });
      }
    });

    socket.on('group:leave', (payload: { groupId?: string }) => {
      const groupId = payload?.groupId;
      if (groupId) {
        socket.leave(`group:${groupId}`);
      }
    });
  });
}
