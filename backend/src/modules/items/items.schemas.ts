import { z } from 'zod';

export const addItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  quantity: z.number().int().positive().optional(),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  quantity: z.number().int().positive().optional().nullable(),
  checked: z.boolean().optional(),
});
