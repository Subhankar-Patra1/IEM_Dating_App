import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().max(2000, 'Message too long').default(''),
    mediaKey: z.string().optional(),
  }).refine((data) => data.content.length > 0 || data.mediaKey, {
    message: "Message must either have content or a photo",
    path: ["content"],
  }),
});

export const getMessagesSchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.string().optional(),
  }),
});
