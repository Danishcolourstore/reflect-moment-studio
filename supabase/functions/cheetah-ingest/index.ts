import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    // Parse multipart form
    const formData = await req.formData();
    const sessionId = formData.get("session_id") as string;
    const eventId = (formData.get("event_id") as string) || null;
    const file = formData.get("file") as File;

    if (!sessionId || !file) {
      return new Response(
        JSON.stringify({ error: "Missing session_id or file" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Upload original to gallery-photos bucket
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `cheetah/${sessionId}/${crypto.randomUUID()}.${ext}`;

    const arrayBuf = await file.arrayBuffer();
    const { error: uploadErr } = await adminClient.storage
      .from("gallery-photos")
      .upload(storagePath, arrayBuf, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      return new Response(JSON.stringify({ error: "Upload failed", detail: uploadErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = adminClient.storage
      .from("gallery-photos")
      .getPublicUrl(storagePath);

    const originalUrl = urlData.publicUrl;

    // Generate thumbnail + preview URLs via Supabase image transform
    const baseRender = originalUrl.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    );
    const thumbnailUrl = `${baseRender}?width=400&quality=60&resize=contain`;
    const previewUrl = `${baseRender}?width=1200&quality=80&resize=contain`;

    // Insert photo record
    const { data: photo, error: insertErr } = await adminClient
      .from("cheetah_photos")
      .insert({
        session_id: sessionId,
        user_id: userId,
        event_id: eventId,
        file_name: file.name,
        original_url: originalUrl,
        thumbnail_url: thumbnailUrl,
        preview_url: previewUrl,
        file_size: file.size,
        ai_status: "pending",
        cull_status: "unreviewed",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(JSON.stringify({ error: "DB insert failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update session total
    await adminClient.rpc("", {}).catch(() => {});
    await adminClient
      .from("cheetah_sessions")
      .update({ total_photos: undefined as any })
      .eq("id", sessionId);
    // Use raw SQL increment via a simple approach
    const { data: sess } = await adminClient
      .from("cheetah_sessions")
      .select("total_photos")
      .eq("id", sessionId)
      .single();
    if (sess) {
      await adminClient
        .from("cheetah_sessions")
        .update({ total_photos: (sess.total_photos || 0) + 1 })
        .eq("id", sessionId);
    }

    // Trigger AI analysis asynchronously (fire-and-forget)
    const analyzeUrl = `${supabaseUrl}/functions/v1/cheetah-analyze`;
    fetch(analyzeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ photo_id: photo.id, preview_url: previewUrl }),
    }).catch((e) => console.error("Failed to trigger analysis:", e));

    return new Response(JSON.stringify({ photo }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cheetah-ingest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
