import { HttpError } from "../../utils/http-error";
import { listVisiblePosts, publishPost } from "./posts.repository";

export async function publishPostForUser(input: {
  ownerId: string;
  projectId: string;
  fileIds: string[];
  caption: string;
  visibility: "public" | "followers" | "private";
}) {
  try {
    return await publishPost(input);
  } catch (error) {
    if (error instanceof Error && error.message === "PROJECT_NOT_FOUND") {
      throw new HttpError(404, "Project not found");
    }
    if (error instanceof Error && error.message === "FILE_NOT_OWNED") {
      throw new HttpError(400, "One or more files are missing or not owned by user");
    }
    throw error;
  }
}

export async function getFeed(limit: number) {
  return listVisiblePosts(limit);
}
