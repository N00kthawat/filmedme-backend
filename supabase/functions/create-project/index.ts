import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

type CreateProjectPayload = {
  title?: string;
  coverAssetId?: string | null;
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

  let payload: CreateProjectPayload;
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const title = payload.title?.trim() || "Untitled Project";
  if (title.length > 120) {
    return json(400, { error: "Title must be less than or equal to 120 chars" });
  }

  if (payload.coverAssetId) {
    const { data: cover, error: coverError } = await supabase
      .from("media_assets")
      .select("id")
      .eq("id", payload.coverAssetId)
      .eq("owner_id", user.id)
      .single();
    if (coverError || !cover) {
      return json(400, { error: "coverAssetId not found for this user" });
    }
  }

  const { data: project, error: createError } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      title,
      cover_asset_id: payload.coverAssetId ?? null,
      status: "draft",
    })
    .select("id, owner_id, title, status, cover_asset_id, created_at, updated_at")
    .single();

  if (createError) {
    return json(400, { error: createError.message });
  }

  return json(201, { project });
});
