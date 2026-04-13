import { query } from "../../config/database";

export type FileRow = {
  id: string;
  owner_id: string;
  kind: "image" | "video";
  storage_provider: string;
  bucket: string;
  path: string;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  metadata: Record<string, unknown>;
  created_at: Date;
};

export async function insertFile(input: {
  ownerId: string;
  kind: "image" | "video";
  bucket: string;
  path: string;
  mimeType: string | null;
  sizeBytes: number | null;
  metadata?: Record<string, unknown>;
}) {
  const { rows } = await query<FileRow>(
    `
      insert into media_files (
        owner_id,
        kind,
        storage_provider,
        bucket,
        path,
        mime_type,
        size_bytes,
        metadata
      )
      values ($1, $2, 'local', $3, $4, $5, $6, $7::jsonb)
      returning *
    `,
    [
      input.ownerId,
      input.kind,
      input.bucket,
      input.path,
      input.mimeType,
      input.sizeBytes,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
  return rows[0];
}

export async function listFilesByOwner(ownerId: string) {
  const { rows } = await query<FileRow>(
    `
      select *
      from media_files
      where owner_id = $1
      order by created_at desc
      limit 200
    `,
    [ownerId],
  );
  return rows;
}

export async function findOwnedFiles(ownerId: string, fileIds: string[]) {
  const { rows } = await query<{ id: string }>(
    `
      select id
      from media_files
      where owner_id = $1
        and id = any($2::uuid[])
    `,
    [ownerId, fileIds],
  );
  return rows;
}
