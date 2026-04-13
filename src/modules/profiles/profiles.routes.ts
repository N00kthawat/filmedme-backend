import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import { getMeController, updateMeController } from "./profiles.controller";

export const profileRouter = Router();

profileRouter.get("/me", requireAuth, getMeController);
profileRouter.patch("/me", requireAuth, updateMeController);
