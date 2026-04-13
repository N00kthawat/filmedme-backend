import { HttpError } from "../../utils/http-error";
import {
  createProject,
  getProjectById,
  listProjectsByOwner,
  updateProjectById,
} from "./projects.repository";

export async function createProjectForUser(input: {
  ownerId: string;
  title: string;
  coverFileId: string | null;
}) {
  return createProject(input);
}

export async function listProjectsForUser(ownerId: string) {
  return listProjectsByOwner(ownerId);
}

export async function getProjectForUser(projectId: string, ownerId: string) {
  const project = await getProjectById(projectId, ownerId);
  if (!project) {
    throw new HttpError(404, "Project not found");
  }
  return project;
}

export async function updateProjectForUser(
  projectId: string,
  ownerId: string,
  payload: {
    title?: string;
    status?: "draft" | "editing" | "ready" | "published";
    coverFileId?: string | null;
  },
) {
  const existing = await getProjectById(projectId, ownerId);
  if (!existing) {
    throw new HttpError(404, "Project not found");
  }

  const updated = await updateProjectById(projectId, ownerId, {
    title: payload.title ?? existing.title,
    status: payload.status ?? existing.status,
    coverFileId:
      payload.coverFileId === undefined ? existing.cover_file_id : payload.coverFileId,
  });

  if (!updated) {
    throw new HttpError(500, "Failed to update project");
  }

  return updated;
}
