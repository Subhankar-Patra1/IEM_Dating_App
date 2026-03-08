import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Message content is required').max(2000, 'Message too long'),
  }),
});

export const getMessagesSchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.string().optional(),
  }),
});
