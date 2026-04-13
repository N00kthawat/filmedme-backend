import { query } from "../../config/database";

export type ProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  status: "draft" | "editing" | "ready" | "published";
  cover_file_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export async function createProject(input: {
  ownerId: string;
  title: string;
  coverFileId: string | null;
}) {
  const { rows } = await query<ProjectRow>(
    `
      insert into projects (owner_id, title, status, cover_file_id)
      values ($1, $2, 'draft', $3)
      returning *
    `,
    [input.ownerId, input.title, input.coverFileId],
  );
  return rows[0];
}

export async function listProjectsByOwner(ownerId: string) {
  const { rows } = await query<ProjectRow>(
    `
      select *
      from projects
      where owner_id = $1
      order by updated_at desc
      limit 200
    `,
    [ownerId],
  );
  return rows;
}

export async function getProjectById(projectId: string, ownerId: string) {
  const { rows } = await query<ProjectRow>(
    `
      select *
      from projects
      where id = $1
        and owner_id = $2
      limit 1
    `,
    [projectId, ownerId],
  );
  return rows[0] ?? null;
}

export async function updateProjectById(
  projectId: string,
  ownerId: string,
  payload: {
    title: string;
    status: "draft" | "editing" | "ready" | "published";
    coverFileId: string | null;
  },
) {
  const { rows } = await query<ProjectRow>(
    `
      update projects
      set title = $3,
          status = $4,
          cover_file_id = $5,
          updated_at = timezone('utc', now())
      where id = $1
        and owner_id = $2
      returning *
    `,
    [projectId, ownerId, payload.title, payload.status, payload.coverFileId],
  );
  return rows[0] ?? null;
}
