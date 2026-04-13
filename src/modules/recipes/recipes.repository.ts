import { query } from "../../config/database";

export type RecipeRow = {
  id: string;
  owner_id: string;
  name: string;
  base_preset: string | null;
  settings: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

export async function createRecipe(input: {
  ownerId: string;
  name: string;
  basePreset: string | null;
  settings: Record<string, unknown>;
}) {
  const { rows } = await query<RecipeRow>(
    `
      insert into recipes (owner_id, name, base_preset, settings)
      values ($1, $2, $3, $4::jsonb)
      returning *
    `,
    [input.ownerId, input.name, input.basePreset, JSON.stringify(input.settings)],
  );
  return rows[0];
}

export async function listRecipesByOwner(ownerId: string) {
  const { rows } = await query<RecipeRow>(
    `
      select *
      from recipes
      where owner_id = $1
      order by updated_at desc
      limit 200
    `,
    [ownerId],
  );
  return rows;
}
