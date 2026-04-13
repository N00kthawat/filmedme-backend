import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(1).max(120).default("Untitled Project"),
  coverFileId: z.string().uuid().nullable().optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  status: z.enum(["draft", "editing", "ready", "published"]).optional(),
  coverFileId: z.string().uuid().nullable().optional(),
});
