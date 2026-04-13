import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

type SaveRecipePayload = {
  name?: string;
  basePresetId?: string | null;
  settings?: Record<string, unknown>;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json(500, { error: "Missing Supabase environment variables" });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return json(401, { error: "Unauthorized" });
  }

  let payload: SaveRecipePayload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const recipeName = payload.name?.trim() ?? "";
  if (recipeName.length < 2 || recipeName.length > 80) {
    return json(400, { error: "Recipe name must be between 2 and 80 chars" });
  }

  if (payload.basePresetId) {
    const { data: preset, error: presetError } = await supabase
      .from("presets")
      .select("id")
      .eq("id", payload.basePresetId)
      .single();
    if (presetError || !preset) {
      return json(400, { error: "basePresetId is not valid" });
    }
  }

  const { data: recipe, error: saveError } = await supabase
    .from("user_presets")
    .insert({
      owner_id: user.id,
      base_preset_id: payload.basePresetId ?? null,
      name: recipeName,
      settings: payload.settings ?? {},
    })
    .select("id, owner_id, base_preset_id, name, settings, created_at, updated_at")
    .single();

  if (saveError) {
    return json(400, { error: saveError.message });
  }

  return json(201, { recipe });
});
