import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/async-handler";
import { createRecipeSchema } from "./recipes.schemas";
import { createRecipeForUser, listRecipesForUser } from "./recipes.service";

export const createRecipeController = asyncHandler(async (req: Request, res: Response) => {
  const payload = createRecipeSchema.parse(req.body);
  const recipe = await createRecipeForUser({
    ownerId: req.user!.id,
    name: payload.name,
    basePreset: payload.basePreset ?? null,
    settings: payload.settings,
  });
  res.status(201).json({ recipe });
});

export const listRecipesController = asyncHandler(async (req: Request, res: Response) => {
  const recipes = await listRecipesForUser(req.user!.id);
  res.json({ recipes });
});
