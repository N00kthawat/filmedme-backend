import bcrypt from "bcryptjs";

import { closePool, query, withTransaction } from "../config/database";

type SeedUserRow = {
  id: string;
  email: string;
};

type ExistsRow = {
  exists: boolean;
};

function normalizeEmail(raw: string) {
  return raw.toLowerCase().trim();
}

function normalizeHandle(raw: string) {
  return raw.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_").slice(0, 24);
}

async function handleExists(handle: string) {
  const { rows } = await query<ExistsRow>(
    `
      select exists(
        select 1
        from profiles
        where handle = $1
      ) as exists
    `,
    [handle],
  );

  return rows[0]?.exists ?? false;
}

async function resolveAvailableHandle(baseHandle: string) {
  const safeBase = normalizeHandle(baseHandle) || "filmedme_seed";

  if (!(await handleExists(safeBase))) {
    return safeBase;
  }

  for (let index = 2; index <= 9999; index += 1) {
    const candidate = `${safeBase}_${index}`;
    if (!(await handleExists(candidate))) {
      return candidate;
    }
  }

  throw new Error("Could not find an available handle for seeded user");
}

async function main() {
  const seedEmail = normalizeEmail(process.env.SEED_USER_EMAIL ?? "seed@filmedme.app");
  const seedPassword = process.env.SEED_USER_PASSWORD ?? "Password123!";
  const seedDisplayName = (process.env.SEED_USER_DISPLAY_NAME ?? "Filmedme Seed").trim();
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);

  if (seedPassword.length < 8) {
    throw new Error("SEED_USER_PASSWORD must be at least 8 characters");
  }

  const existingUser = await query<SeedUserRow>(
    `
      select id, email
      from app_users
      where email = $1
      limit 1
    `,
    [seedEmail],
  );

  if (existingUser.rows[0]) {
    console.log(`Seed user already exists: ${seedEmail}`);
    return;
  }

  const requestedHandle = process.env.SEED_USER_HANDLE ?? "filmedme_seed";
  const resolvedHandle = await resolveAvailableHandle(requestedHandle);
  const passwordHash = await bcrypt.hash(seedPassword, rounds);

  const created = await withTransaction(async (client) => {
    const userResult = await client.query<SeedUserRow>(
      `
        insert into app_users (email, password_hash)
        values ($1, $2)
        returning id, email
      `,
      [seedEmail, passwordHash],
    );

    const user = userResult.rows[0];
    await client.query(
      `
        insert into profiles (user_id, handle, display_name)
        values ($1, $2, $3)
      `,
      [user.id, resolvedHandle, seedDisplayName],
    );

    return user;
  });

  console.log("Seed user created successfully");
  console.log(`email: ${created.email}`);
  console.log(`handle: ${resolvedHandle}`);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await closePool();
  });
