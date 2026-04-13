import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import {
  createProjectController,
  getProjectController,
  listProjectsController,
  updateProjectController,
} from "./projects.controller";

export const projectRouter = Router();

projectRouter.use(requireAuth);
projectRouter.post("/", createProjectController);
projectRouter.get("/", listProjectsController);
projectRouter.get("/:projectId", getProjectController);
projectRouter.patch("/:projectId", updateProjectController);
