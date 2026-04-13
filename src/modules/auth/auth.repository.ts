import { query, withTransaction } from "../../config/database";

export type UserWithProfileRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  handle: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
};

export type ProfileRow = {
  user_id: string;
  handle: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
};

export async function findUserWithProfileByEmail(email: string) {
  const { rows } = await query<UserWithProfileRow>(
    `
      select
        u.id,
        u.email,
        u.password_hash,
        u.created_at,
        p.handle,
        p.display_name,
        p.bio,
        p.avatar_url
      from app_users u
      join profiles p on p.user_id = u.id
      where u.email = $1
      limit 1
    `,
    [email],
  );
  return rows[0] ?? null;
}

export async function findProfileByUserId(userId: string) {
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

export async function createUserAndProfile(params: {
  email: string;
  passwordHash: string;
  handle: string;
  displayName: string;
}) {
  return withTransaction(async (client) => {
    const userResult = await client.query<{ id: string; email: string }>(
      `
        insert into app_users (email, password_hash)
        values ($1, $2)
        returning id, email
      `,
      [params.email, params.passwordHash],
    );
    const user = userResult.rows[0];

    const profileResult = await client.query<ProfileRow>(
      `
        insert into profiles (user_id, handle, display_name)
        values ($1, $2, $3)
        returning user_id, handle, display_name, bio, avatar_url, created_at, updated_at
      `,
      [user.id, params.handle, params.displayName],
    );

    return {
      user,
      profile: profileResult.rows[0],
    };
  });
}
