import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    birthday: z.string().datetime().optional(),
    age: z.number().int().min(18).optional(),
    college: z.string().optional(),
    department: z.string().min(2).optional(),
    degree: z.string().optional(),
    year: z.number().int().min(1).max(3000).optional(),
    yearOfStudy: z.number().int().min(1).max(10).optional(),
    gender: z.string().optional(),
    showGender: z.boolean().optional(),
    orientation: z.array(z.string()).optional(),
    showOrientation: z.boolean().optional(),
    distancePreference: z.number().int().min(1).max(100).optional(),
    seeking: z.string().optional(),
    preferences: z.any().optional(),
    campus: z.string().optional(),
    isHosteller: z.boolean().optional(),
    clubs: z.array(z.string()).optional(),
    hangoutSpots: z.array(z.string()).optional(),
    attendanceMood: z.string().optional(),
    profileVideoUrl: z.string().nullable().optional(),
    photos: z.array(z.string().nullable()).optional(),
  }),
});
