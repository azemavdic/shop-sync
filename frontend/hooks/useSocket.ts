import { useEffect, useRef } from 'react';
import {
  connectSocket,
  disconnectSocket,
  joinGroupRoom,
  leaveGroupRoom,
  subscribeToItemEvents,
} from '../services/socket.service';
import { useAuthStore } from '../stores/authStore';
import { useListStore } from '../stores/listStore';

/** Connect socket when authenticated, disconnect on logout */
export function useSocketConnection() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    return () => {
      if (!isAuthenticated) disconnectSocket();
    };
  }, [isAuthenticated]);
}

/** Join group room and subscribe to item events when viewing a list */
export function useListSocket(groupId: string | undefined) {
  const { addItem, updateItem, removeItem } = useListStore();
  const prevGroupId = useRef<string | undefined>();

  useEffect(() => {
    if (!groupId) return;

    joinGroupRoom(groupId);

    const unsubscribe = subscribeToItemEvents(groupId, {
      onItemAdded: (item) => {
        // Avoid duplicate if we already added via HTTP response
        if (useListStore.getState().items.some((i) => i.id === item.id)) return;
        addItem({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          checked: item.checked ?? false,
          addedById: item.addedById,
          addedByName: item.addedByName,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
      },
      onItemEdited: (item) => {
        updateItem(item.id, {
          name: item.name,
          quantity: item.quantity,
          checked: item.checked,
          updatedAt: item.updatedAt,
        });
      },
      onItemChecked: (itemId, checked) => {
        updateItem(itemId, { checked });
      },
      onItemDeleted: (itemId) => {
        removeItem(itemId);
      },
    });

    return () => {
      leaveGroupRoom(groupId);
      unsubscribe();
    };
  }, [groupId]);
}
