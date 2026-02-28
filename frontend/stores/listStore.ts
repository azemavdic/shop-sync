import { create } from 'zustand';

export interface ListItem {
  id: string;
  name: string;
  quantity?: number;
  checked: boolean;
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
  getOrderedItems: () => ListItem[]; // creation order, no reorder on update
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
  getOrderedItems: () => {
    const { items } = get();
    return [...items].sort(byCreatedAt);
  },
}));

function byCreatedAt(a: ListItem, b: ListItem) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}
