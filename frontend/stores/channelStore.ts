import { create } from 'zustand';

export interface Channel {
  id: string;
  name: string;
  inviteCode: string;
  memberCount?: number;
  createdById?: string;
}

interface ChannelState {
  channels: Channel[];
  currentChannel: Channel | null;
  setChannels: (channels: Channel[]) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  addChannel: (channel: Channel) => void;
  removeChannel: (channelId: string) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
}

export const useChannelStore = create<ChannelState>((set) => ({
  channels: [],
  currentChannel: null,
  setChannels: (channels) => set({ channels }),
  setCurrentChannel: (currentChannel) => set({ currentChannel }),
  addChannel: (channel) =>
    set((state) => ({ channels: [channel, ...state.channels] })),
  removeChannel: (channelId) =>
    set((state) => ({
      channels: state.channels.filter((c) => c.id !== channelId),
      currentChannel:
        state.currentChannel?.id === channelId ? null : state.currentChannel,
    })),
  updateChannel: (channelId, updates) =>
    set((state) => ({
      channels: state.channels.map((c) =>
        c.id === channelId ? { ...c, ...updates } : c
      ),
      currentChannel:
        state.currentChannel?.id === channelId
          ? { ...state.currentChannel, ...updates }
          : state.currentChannel,
    })),
}));
