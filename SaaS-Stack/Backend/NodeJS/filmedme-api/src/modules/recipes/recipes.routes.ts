import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import { createRecipeController, listRecipesController } from "./recipes.controller";

export const recipeRouter = Router();

recipeRouter.use(requireAuth);
recipeRouter.post("/", createRecipeController);
recipeRouter.get("/", listRecipesController);
