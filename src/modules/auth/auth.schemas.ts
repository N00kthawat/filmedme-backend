import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(120),
  handle: z.string().regex(/^[a-zA-Z0-9_]{3,24}$/).optional(),
  displayName: z.string().min(1).max(80).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(120),
});
