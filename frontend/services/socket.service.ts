import { io, Socket } from 'socket.io-client';
import { config } from '../constants/config';
import { useAuthStore } from '../stores/authStore';

let socket: Socket | null = null;
let pendingGroupId: string | null = null;

function tryJoinPendingGroup() {
  if (pendingGroupId && socket?.connected) {
    socket.emit('group:join', { groupId: pendingGroupId });
  }
}

export function connectSocket(): Socket | null {
  const token = useAuthStore.getState().token;
  if (!token) return null;
  if (socket?.connected) return socket;

  socket = io(config.socketUrl, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    socket?.emit('authenticate', { token });
  });

  socket.on('authenticated', () => {
    tryJoinPendingGroup();
  });

  socket.on('error', (err: { code?: string; message?: string }) => {
    console.warn('[Socket]', err);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinGroupRoom(groupId: string) {
  pendingGroupId = groupId;
  if (socket?.connected) {
    socket.emit('group:join', { groupId });
  }
}

export function leaveGroupRoom(groupId: string) {
  if (pendingGroupId === groupId) pendingGroupId = null;
  if (socket?.connected) {
    socket.emit('group:leave', { groupId });
  }
}

export function subscribeToItemEvents(
  groupId: string,
  callbacks: {
    onItemAdded: (item: any) => void;
    onItemEdited: (item: any) => void;
    onItemChecked: (itemId: string, checked: boolean) => void;
    onItemDeleted: (itemId: string) => void;
  }
) {
  if (!socket) return () => {};

  const onAdded = (payload: { item: any }) => callbacks.onItemAdded(payload.item);
  const onEdited = (payload: { item: any }) => callbacks.onItemEdited(payload.item);
  const onChecked = (payload: { itemId: string; checked: boolean }) =>
    callbacks.onItemChecked(payload.itemId, payload.checked);
  const onDeleted = (payload: { itemId: string }) =>
    callbacks.onItemDeleted(payload.itemId);

  socket.on('item:added', onAdded);
  socket.on('item:edited', onEdited);
  socket.on('item:checked', onChecked);
  socket.on('item:deleted', onDeleted);

  return () => {
    socket?.off('item:added', onAdded);
    socket?.off('item:edited', onEdited);
    socket?.off('item:checked', onChecked);
    socket?.off('item:deleted', onDeleted);
  };
}

export function getSocket(): Socket | null {
  return socket;
}
