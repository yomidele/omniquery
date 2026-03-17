import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return "omq_" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/omniquery-api/, "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

  // Check for API key auth or Bearer token
  const apiKeyHeader = req.headers.get("x-api-key");
  const authHeader = req.headers.get("authorization");

  const adminClient = createClient(supabaseUrl, serviceKey);

  let userId: string | null = null;

  if (apiKeyHeader) {
    const keyHash = await hashKey(apiKeyHeader);
    const { data } = await adminClient
      .from("api_keys")
      .select("user_id, is_active")
      .eq("key_hash", keyHash)
      .single();
    if (!data || !data.is_active) {
      return json({ error: "Invalid or inactive API key" }, 401);
    }
    userId = data.user_id;
    // Update last_used_at
    await adminClient.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("key_hash", keyHash);
  } else if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const userClient = createClient(supabaseUrl, anonKey);
    const { data: { user } } = await userClient.auth.getUser(token);
    if (!user) return json({ error: "Invalid token" }, 401);
    userId = user.id;
  }

  // --- Public endpoint: API info ---
  if (path === "" || path === "/") {
    return json({
      name: "OmniQuery API",
      version: "1.0.0",
      documentation: "/api-docs",
      endpoints: [
        "GET /api/profile",
        "PUT /api/profile",
        "POST /api/search",
        "GET /api/history",
        "POST /api/keys",
        "GET /api/keys",
        "DELETE /api/keys/:id",
      ],
    });
  }

  // All other endpoints require auth
  if (!userId) {
    return json({ error: "Authentication required. Provide x-api-key header or Bearer token." }, 401);
  }

  // --- GET /profile ---
  if (path === "/profile" && req.method === "GET") {
    const { data, error } = await adminClient.from("profiles").select("*").eq("id", userId).single();
    if (error) return json({ error: error.message }, 404);
    return json({ data });
  }

  // --- PUT /profile ---
  if (path === "/profile" && req.method === "PUT") {
    const body = await req.json();
    const updates: Record<string, unknown> = {};
    if (body.display_name !== undefined) updates.display_name = body.display_name;
    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
    if (Object.keys(updates).length === 0) return json({ error: "No fields to update" }, 400);
    updates.updated_at = new Date().toISOString();
    const { data, error } = await adminClient.from("profiles").update(updates).eq("id", userId).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ data });
  }

  // --- POST /search ---
  if (path === "/search" && req.method === "POST") {
    const { query } = await req.json();
    if (!query) return json({ error: "query is required" }, 400);
    // Invoke the research-agent function
    const resp = await fetch(`${supabaseUrl}/functions/v1/research-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
      body: JSON.stringify({ query }),
    });
    // Collect SSE and return as JSON
    const text = await resp.text();
    const lines = text.split("\n");
    let content = "";
    let sources: { url: string; title: string }[] = [];
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.text) content += parsed.text;
          if (parsed.sources) sources = parsed.sources;
        } catch { /* skip */ }
      }
    }
    // Save to history
    await adminClient.from("research_history").insert({ user_id: userId, query, content, sources });
    return json({ data: { query, content, sources } });
  }

  // --- GET /history ---
  if (path === "/history" && req.method === "GET") {
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const { data, error, count } = await adminClient
      .from("research_history")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) return json({ error: error.message }, 500);
    return json({ data, total: count, limit, offset });
  }

  // --- POST /keys (generate new API key) ---
  if (path === "/keys" && req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const name = body.name || "Default";
    const rawKey = generateApiKey();
    const keyHash = await hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12) + "...";
    const { error } = await adminClient.from("api_keys").insert({
      user_id: userId, key_hash: keyHash, key_prefix: keyPrefix, name,
    });
    if (error) return json({ error: error.message }, 500);
    return json({ data: { key: rawKey, prefix: keyPrefix, name }, message: "Store this key securely. It won't be shown again." }, 201);
  }

  // --- GET /keys ---
  if (path === "/keys" && req.method === "GET") {
    const { data, error } = await adminClient
      .from("api_keys")
      .select("id, key_prefix, name, created_at, last_used_at, is_active")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ data });
  }

  // --- DELETE /keys/:id ---
  const deleteMatch = path.match(/^\/keys\/([a-f0-9-]+)$/);
  if (deleteMatch && req.method === "DELETE") {
    const { error } = await adminClient.from("api_keys").delete().eq("id", deleteMatch[1]).eq("user_id", userId);
    if (error) return json({ error: error.message }, 500);
    return json({ message: "API key deleted" });
  }

  return json({ error: "Not found" }, 404);
});
