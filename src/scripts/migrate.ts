import fs from "node:fs/promises";
import path from "node:path";

import { query, withTransaction } from "../config/database";

type MigrationRow = {
  name: string;
};

async function ensureMigrationTable() {
  await query(`
    create table if not exists schema_migrations (
      name text primary key,
      executed_at timestamptz not null default timezone('utc', now())
    )
  `);
}

async function getAppliedMigrationSet() {
  const { rows } = await query<MigrationRow>(
    `
      select name
      from schema_migrations
      order by name asc
    `,
  );
  return new Set(rows.map((row) => row.name));
}

async function loadMigrationFiles() {
  const migrationDir = path.resolve(process.cwd(), "database/migrations");
  const entries = await fs.readdir(migrationDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => ({
      name: entry.name,
      fullPath: path.join(migrationDir, entry.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function main() {
  await ensureMigrationTable();
  const applied = await getAppliedMigrationSet();
  const files = await loadMigrationFiles();

  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  for (const file of files) {
    if (applied.has(file.name)) {
      continue;
    }

    const sql = await fs.readFile(file.fullPath, "utf-8");
    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query(
        `
          insert into schema_migrations (name)
          values ($1)
        `,
        [file.name],
      );
    });

    console.log(`Applied migration: ${file.name}`);
  }

  console.log("Migration completed.");
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
