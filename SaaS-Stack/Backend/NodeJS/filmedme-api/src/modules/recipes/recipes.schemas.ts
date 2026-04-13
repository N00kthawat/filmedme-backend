import { z } from "zod";

export const createRecipeSchema = z.object({
  name: z.string().min(2).max(80),
  basePreset: z.string().max(30).nullable().optional(),
  settings: z.record(z.unknown()).default({}),
});
