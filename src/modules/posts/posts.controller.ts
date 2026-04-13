import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/async-handler";
import { publishPostSchema } from "./posts.schemas";
import { getFeed, publishPostForUser } from "./posts.service";

export const publishPostController = asyncHandler(async (req: Request, res: Response) => {
  const payload = publishPostSchema.parse(req.body);
  const post = await publishPostForUser({
    ownerId: req.user!.id,
    projectId: payload.projectId,
    fileIds: payload.fileIds,
    caption: payload.caption,
    visibility: payload.visibility,
  });
  res.status(201).json({ post });
});

export const feedController = asyncHandler(async (req: Request, res: Response) => {
  const requested = Number(req.query.limit ?? 20);
  const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 100) : 20;
  const posts = await getFeed(limit);
  res.json({ posts });
});
