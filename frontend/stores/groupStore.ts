import { create } from 'zustand';

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  channelId?: string;
  itemCount?: number;
  checkedItemCount?: number;
}

interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  setGroups: (groups: Group[]) => void;
  setCurrentGroup: (group: Group | null) => void;
  addGroup: (group: Group) => void;
  removeGroup: (groupId: string) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  currentGroup: null,
  setGroups: (groups) => set({ groups }),
  setCurrentGroup: (currentGroup) => set({ currentGroup }),
  addGroup: (group) =>
    set((state) => ({ groups: [group, ...state.groups] })),
  removeGroup: (groupId) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== groupId),
      currentGroup: state.currentGroup?.id === groupId ? null : state.currentGroup,
    })),
  updateGroup: (groupId, updates) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, ...updates } : g
      ),
      currentGroup:
        state.currentGroup?.id === groupId
          ? { ...state.currentGroup, ...updates }
          : state.currentGroup,
    })),
}));
