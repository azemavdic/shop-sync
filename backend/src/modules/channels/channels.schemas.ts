import { z } from 'zod';

export const createChannelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

export const joinChannelSchema = z.object({
  inviteCode: z.string().length(6, 'Invite code must be 6 characters'),
});

export const updateChannelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

export const inviteChannelSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
});
