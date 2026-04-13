import { z } from "zod";

export const uploadFileSchema = z.object({
  kind: z.enum(["image", "video"]).default("image"),
});
