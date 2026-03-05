import { create } from 'zustand';

export interface ListItem {
  id: string;
  name: string;
  quantity?: number;
  price?: number | null;
  checked: boolean;
  position?: number;
  addedById: string;
  addedByName?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ListState {
  items: ListItem[];
  setItems: (items: ListItem[]) => void;
  addItem: (item: ListItem) => void;
  updateItem: (id: string, updates: Partial<ListItem>) => void;
  removeItem: (id: string) => void;
  reorderItems: (itemIds: string[]) => void;
  getOrderedItems: () => ListItem[];
}

export const useListStore = create<ListState>((set, get) => ({
  items: [],
  setItems: (items) =>
    set({
      items: items.filter(
        (item, i, arr) => arr.findIndex((x) => x.id === item.id) === i
      ),
    }),
  addItem: (item) =>
    set((state) => {
      if (state.items.some((i) => i.id === item.id)) return state;
      return { items: [...state.items, item] };
    }),
  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  reorderItems: (itemIds) =>
    set((state) => {
      const byId = new Map(state.items.map((i) => [i.id, i]));
      const reordered: ListItem[] = [];
      for (let i = 0; i < itemIds.length; i++) {
        const item = byId.get(itemIds[i]);
        if (item) reordered.push({ ...item, position: i });
      }
      const orderedIds = new Set(itemIds);
      const remaining = state.items.filter((i) => !orderedIds.has(i.id));
      return { items: [...reordered, ...remaining].sort(byPosition) };
    }),
  getOrderedItems: () => {
    const { items } = get();
    return [...items].sort(byPosition);
  },
}));

function byPosition(a: ListItem, b: ListItem) {
  const posA = a.position ?? 0;
  const posB = b.position ?? 0;
  if (posA !== posB) return posA - posB;
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}
