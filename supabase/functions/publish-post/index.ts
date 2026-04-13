import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

type PublishPayload = {
  projectId?: string;
  assetIds?: string[];
  caption?: string;
  visibility?: "public" | "followers" | "private";
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

  let payload: PublishPayload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  if (!payload.projectId) {
    return json(400, { error: "projectId is required" });
  }
  if (!payload.assetIds || payload.assetIds.length === 0) {
    return json(400, { error: "assetIds must include at least one item" });
  }

  const visibility = payload.visibility ?? "public";
  if (!["public", "followers", "private"].includes(visibility)) {
    return json(400, { error: "Invalid visibility value" });
  }

  const { data, error } = await supabase.rpc("publish_project_post", {
    p_project_id: payload.projectId,
    p_asset_ids: payload.assetIds,
    p_caption: payload.caption ?? "",
    p_visibility: visibility,
  });

  if (error) {
    return json(400, { error: error.message });
  }

  return json(200, { postId: data });
});
