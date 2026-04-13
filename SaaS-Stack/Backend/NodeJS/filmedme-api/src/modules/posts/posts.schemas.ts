import { z } from "zod";

export const publishPostSchema = z.object({
  projectId: z.string().uuid(),
  fileIds: z.array(z.string().uuid()).min(1),
  caption: z.string().max(1000).default(""),
  visibility: z.enum(["public", "followers", "private"]).default("public"),
});
