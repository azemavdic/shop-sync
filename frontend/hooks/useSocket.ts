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

/** Join group room and subscribe to item events when a group is selected */
export function useListSocket(groupId: string | undefined) {
  const { addItem, updateItem, removeItem, setItems } = useListStore();
  const userId = useAuthStore((s) => s.user?.id);

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
          price: item.price,
          checked: item.checked ?? false,
          position: item.position,
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
          price: item.price,
          checked: item.checked,
          position: item.position,
          updatedAt: item.updatedAt,
        });
      },
      onItemChecked: (itemId, checked) => {
        updateItem(itemId, { checked });
      },
      onItemDeleted: (itemId) => {
        removeItem(itemId);
      },
      onItemsReordered: (eventGroupId, items, initiatedByUserId) => {
        if (eventGroupId !== groupId) return; // Not our group room
        if (initiatedByUserId && userId && initiatedByUserId === userId) return; // We initiated it; skip to avoid flicker
        const state = useListStore.getState();
        const newIds = items.map((i: any) => i.id).join(',');
        const currentIds = state.items.map((i) => i.id).join(',');
        if (newIds === currentIds) return; // Same order, skip redundant update
        setItems(
          items.map((i: any) => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            checked: i.checked ?? false,
            position: i.position,
            addedById: i.addedById,
            addedByName: i.addedByName,
            createdAt: i.createdAt,
            updatedAt: i.updatedAt,
          }))
        );
      },
    });

    return () => {
      leaveGroupRoom(groupId);
      unsubscribe();
    };
  }, [groupId, userId]);
}
