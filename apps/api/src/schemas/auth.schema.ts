import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email().regex(/^[a-zA-Z0-9._-]+\d{4}@iem\.edu\.in$/, 'Must use a valid university email (e.g., firstname.lastname2024@iem.edu.in)'),
    name: z.string().min(2),
    department: z.string().min(2).optional(),
    year: z.number().int().min(1).max(6).optional(),
    password: z.string().min(8, 'Password must be at least 8 characters long')
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
    deviceInfo: z.any().optional()
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string()
  })
});
