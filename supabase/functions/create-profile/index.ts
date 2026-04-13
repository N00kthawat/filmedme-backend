import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

type ProfilePayload = {
  handle?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string | null;
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

  let payload: ProfilePayload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const handle = payload.handle?.trim();
  if (handle && !/^[a-zA-Z0-9_]{3,24}$/.test(handle)) {
    return json(400, {
      error:
        "Invalid handle. Use 3-24 characters with letters, numbers, or underscore.",
    });
  }

  const displayName = payload.displayName?.trim() ?? "";
  const bio = payload.bio?.trim() ?? "";
  if (displayName.length > 80 || bio.length > 240) {
    return json(400, { error: "displayName or bio exceeded max length" });
  }

  const updateRow = {
    id: user.id,
    handle,
    display_name: displayName,
    bio,
    avatar_url: payload.avatarUrl ?? null,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(updateRow, { onConflict: "id" })
    .select("id, handle, display_name, avatar_url, bio, updated_at")
    .single();

  if (error) {
    return json(400, { error: error.message });
  }

  return json(200, { profile: data });
});
