import type { PoolClient } from "pg";

import { query, withTransaction } from "../../config/database";

export type PostRow = {
  id: string;
  owner_id: string;
  project_id: string | null;
  caption: string;
  visibility: "public" | "followers" | "private";
  published_at: Date;
  created_at: Date;
  updated_at: Date;
};

export async function listVisiblePosts(limit: number) {
  const { rows } = await query<PostRow>(
    `
      select *
      from posts
      where visibility = 'public'
      order by published_at desc
      limit $1
    `,
    [limit],
  );
  return rows;
}

async function assertProjectOwned(client: PoolClient, ownerId: string, projectId: string) {
  const result = await client.query(
    `
      select 1
      from projects
      where id = $1
        and owner_id = $2
      limit 1
    `,
    [projectId, ownerId],
  );
  return (result.rowCount ?? 0) > 0;
}

async function countOwnedFiles(client: PoolClient, ownerId: string, fileIds: string[]) {
  const result = await client.query<{ count: string }>(
    `
      select count(*)::text as count
      from media_files
      where owner_id = $1
        and id = any($2::uuid[])
    `,
    [ownerId, fileIds],
  );
  return Number(result.rows[0]?.count ?? "0");
}

export async function publishPost(input: {
  ownerId: string;
  projectId: string;
  fileIds: string[];
  caption: string;
  visibility: "public" | "followers" | "private";
}) {
  return withTransaction(async (client) => {
    const projectOwned = await assertProjectOwned(client, input.ownerId, input.projectId);
    if (!projectOwned) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    const ownedFileCount = await countOwnedFiles(client, input.ownerId, input.fileIds);
    if (ownedFileCount !== input.fileIds.length) {
      throw new Error("FILE_NOT_OWNED");
    }

    const postResult = await client.query<PostRow>(
      `
        insert into posts (owner_id, project_id, caption, visibility, published_at)
        values ($1, $2, $3, $4, timezone('utc', now()))
        returning *
      `,
      [input.ownerId, input.projectId, input.caption, input.visibility],
    );
    const post = postResult.rows[0];

    for (let index = 0; index < input.fileIds.length; index += 1) {
      await client.query(
        `
          insert into post_items (post_id, file_id, position)
          values ($1, $2, $3)
        `,
        [post.id, input.fileIds[index], index + 1],
      );
    }

    await client.query(
      `
        update projects
        set status = 'published',
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [input.projectId],
    );

    return post;
  });
}
