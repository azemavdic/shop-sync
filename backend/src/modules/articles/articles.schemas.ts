import { z } from 'zod';

export const createArticleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  price: z.number().min(0).optional(),
});

export const updateArticleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  price: z.number().min(0).optional(),
});
