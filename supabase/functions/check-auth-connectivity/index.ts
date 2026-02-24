import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    origin: req.headers.get("origin") ?? "unknown",
  };

  // 1) Check env vars
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  results.env = {
    SUPABASE_URL: supabaseUrl ? "set" : "MISSING",
    SUPABASE_ANON_KEY: supabaseAnonKey ? "set" : "MISSING",
  };

  if (!supabaseUrl || !supabaseAnonKey) {
    results.status = "FAIL";
    results.error = "Missing env vars";
    return new Response(JSON.stringify(results, null, 2), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2) Raw fetch to auth endpoint
  try {
    const authRes = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseAnonKey },
    });
    const body = await authRes.text();
    results.authEndpoint = {
      status: authRes.status,
      ok: authRes.ok,
      bodyPreview: body.substring(0, 200),
    };
  } catch (e) {
    results.authEndpoint = { error: (e as Error).message };
  }

  // 3) Raw fetch to REST endpoint
  try {
    const restRes = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { apikey: supabaseAnonKey },
    });
    await restRes.text();
    results.restEndpoint = { status: restRes.status, ok: restRes.ok };
  } catch (e) {
    results.restEndpoint = { error: (e as Error).message };
  }

  // 4) SDK test — try getUser (will fail without token, but proves SDK connectivity)
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.auth.getUser();
    results.sdkAuth = error
      ? { reachable: true, errorMsg: error.message }
      : { reachable: true, userFetched: true };
  } catch (e) {
    results.sdkAuth = { reachable: false, error: (e as Error).message };
  }

  results.status = "OK";

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
