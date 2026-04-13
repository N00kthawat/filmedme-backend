import { query } from "../../config/database";

export type ProfileRow = {
  user_id: string;
  handle: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
};

export async function getProfileByUserId(userId: string) {
  const { rows } = await query<ProfileRow>(
    `
      select user_id, handle, display_name, bio, avatar_url, created_at, updated_at
      from profiles
      where user_id = $1
      limit 1
    `,
    [userId],
  );
  return rows[0] ?? null;
}

export async function updateProfileByUserId(
  userId: string,
  payload: {
    handle: string;
    displayName: string;
    bio: string;
    avatarUrl: string | null;
  },
) {
  const { rows } = await query<ProfileRow>(
    `
      update profiles
      set handle = $2,
          display_name = $3,
          bio = $4,
          avatar_url = $5,
          updated_at = timezone('utc', now())
      where user_id = $1
      returning user_id, handle, display_name, bio, avatar_url, created_at, updated_at
    `,
    [userId, payload.handle, payload.displayName, payload.bio, payload.avatarUrl],
  );
  return rows[0] ?? null;
}
