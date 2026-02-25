import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    department: z.string().min(2).optional(),
    year: z.number().int().min(1).max(6).optional(),
    seeking: z.enum(['friendship', 'casual', 'serious']).optional(),
    preferences: z.any().optional(),
  }),
});
