import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import { feedController, publishPostController } from "./posts.controller";

export const postRouter = Router();

postRouter.get("/feed", feedController);
postRouter.post("/publish", requireAuth, publishPostController);
