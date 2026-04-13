import { HttpError } from "../../utils/http-error";
import { getProfileByUserId, updateProfileByUserId } from "./profiles.repository";

export async function getMe(userId: string) {
  const profile = await getProfileByUserId(userId);
  if (!profile) {
    throw new HttpError(404, "Profile not found");
  }
  return profile;
}

export async function updateMe(
  userId: string,
  payload: {
    handle?: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string | null;
  },
) {
  const existing = await getProfileByUserId(userId);
  if (!existing) {
    throw new HttpError(404, "Profile not found");
  }

  const updated = await updateProfileByUserId(userId, {
    handle: payload.handle ?? existing.handle,
    displayName: payload.displayName ?? existing.display_name,
    bio: payload.bio ?? existing.bio,
    avatarUrl: payload.avatarUrl === undefined ? existing.avatar_url : payload.avatarUrl,
  });

  if (!updated) {
    throw new HttpError(500, "Failed to update profile");
  }

  return updated;
}
