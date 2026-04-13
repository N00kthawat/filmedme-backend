import { createRecipe, listRecipesByOwner } from "./recipes.repository";

export async function createRecipeForUser(input: {
  ownerId: string;
  name: string;
  basePreset: string | null;
  settings: Record<string, unknown>;
}) {
  return createRecipe(input);
}

export async function listRecipesForUser(ownerId: string) {
  return listRecipesByOwner(ownerId);
}
