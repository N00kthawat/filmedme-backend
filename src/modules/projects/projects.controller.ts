import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/async-handler";
import { createProjectSchema, updateProjectSchema } from "./projects.schemas";
import {
  createProjectForUser,
  getProjectForUser,
  listProjectsForUser,
  updateProjectForUser,
} from "./projects.service";

export const createProjectController = asyncHandler(async (req: Request, res: Response) => {
  const payload = createProjectSchema.parse(req.body);
  const project = await createProjectForUser({
    ownerId: req.user!.id,
    title: payload.title,
    coverFileId: payload.coverFileId ?? null,
  });
  res.status(201).json({ project });
});

export const listProjectsController = asyncHandler(async (req: Request, res: Response) => {
  const projects = await listProjectsForUser(req.user!.id);
  res.json({ projects });
});

export const getProjectController = asyncHandler(async (req: Request, res: Response) => {
  const projectId = Array.isArray(req.params.projectId)
    ? req.params.projectId[0]
    : req.params.projectId;
  const project = await getProjectForUser(projectId, req.user!.id);
  res.json({ project });
});

export const updateProjectController = asyncHandler(async (req: Request, res: Response) => {
  const payload = updateProjectSchema.parse(req.body);
  const projectId = Array.isArray(req.params.projectId)
    ? req.params.projectId[0]
    : req.params.projectId;
  const project = await updateProjectForUser(projectId, req.user!.id, payload);
  res.json({ project });
});
