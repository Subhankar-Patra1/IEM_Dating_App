import { z } from 'zod';

export const reportSchema = z.object({
  body: z.object({
    reportedUserId: z.string().uuid(),
    matchId: z.string().uuid().optional(),
    reason: z.string().min(3),
    description: z.string().optional()
  })
});
