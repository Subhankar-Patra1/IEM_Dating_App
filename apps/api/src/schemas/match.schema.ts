import { z } from 'zod';

export const swipeSchema = z.object({
  body: z.object({
    targetUserId: z.string().uuid(),
    action: z.enum(['like', 'pass'])
  })
});
