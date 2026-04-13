import { z } from "zod";

export const updateProfileSchema = z.object({
  handle: z.string().regex(/^[a-zA-Z0-9_]{3,24}$/).optional(),
  displayName: z.string().min(1).max(80).optional(),
  bio: z.string().max(240).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});
