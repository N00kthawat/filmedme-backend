import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/async-handler";
import { updateProfileSchema } from "./profiles.schemas";
import { getMe, updateMe } from "./profiles.service";

export const getMeController = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getMe(req.user!.id);
  res.json({ profile });
});

export const updateMeController = asyncHandler(async (req: Request, res: Response) => {
  const payload = updateProfileSchema.parse(req.body);
  const profile = await updateMe(req.user!.id, payload);
  res.json({ profile });
});
