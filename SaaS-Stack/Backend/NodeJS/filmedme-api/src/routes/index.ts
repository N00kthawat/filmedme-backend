import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes";
import { fileRouter } from "../modules/files/files.routes";
import { healthRouter } from "../modules/health/health.routes";
import { postRouter } from "../modules/posts/posts.routes";
import { profileRouter } from "../modules/profiles/profiles.routes";
import { projectRouter } from "../modules/projects/projects.routes";
import { recipeRouter } from "../modules/recipes/recipes.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/profiles", profileRouter);
apiRouter.use("/files", fileRouter);
apiRouter.use("/projects", projectRouter);
apiRouter.use("/recipes", recipeRouter);
apiRouter.use("/posts", postRouter);
