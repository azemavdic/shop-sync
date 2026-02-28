import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

export const joinGroupSchema = z.object({
  inviteCode: z.string().length(6, 'Invite code must be 6 characters'),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});
