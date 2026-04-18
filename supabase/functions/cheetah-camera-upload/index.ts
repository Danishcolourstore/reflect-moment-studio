// Cheetah Camera Upload — token-authenticated, no JWT required.
// Designed to be called by FTP→HTTP bridges, scripts, or cameras with HTTP support.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-upload-token, x-session-code, x-session-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    // Token-only auth — cameras can't send JWTs.
    const sessionCode = req.headers.get("x-session-code") || req.headers.get("x-session-id");
    const uploadToken = req.headers.get("x-upload-token");

    if (!sessionCode || !uploadToken) {
      return json({ error: "Missing x-session-code or x-upload-token headers" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Look up session by code OR id (so cURL examples that use UUID still work)
    const { data: session, error: sessErr } = await supabase
      .from("cheetah_sessions")
      .select("id, user_id, upload_token, is_live, expires_at, event_id, total_photos")
      .or(`session_code.eq.${sessionCode},id.eq.${sessionCode}`)
      .maybeSingle();

    if (sessErr || !session) return json({ error: "Session not found" }, 404);
    if (session.upload_token !== uploadToken) return json({ error: "Invalid upload token" }, 403);
    if (!session.is_live) return json({ error: "Session is no longer live" }, 403);
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return json({ error: "Session has expired" }, 403);
    }

    // Parse multipart
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return json({ error: "No file. Send multipart 'file' field." }, 400);

    const validExts = /\.(jpe?g|png|heif|heic|tiff?|cr2|cr3|nef|arw|orf|rw2|dng)$/i;
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/heif", "image/heic", "image/tiff"];
    if (!validTypes.includes(file.type) && !file.name.match(validExts)) {
      return json({ error: "Unsupported file type" }, 400);
    }

    const MAX_SIZE = 80 * 1024 * 1024;
    if (file.size > MAX_SIZE) return json({ error: "File too large (80MB max)" }, 413);

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const storagePath = `${session.user_id}/cheetah/${session.id}/${ts}-${rand}.${ext}`;

    const buffer = await file.arrayBuffer();
    const { error: uploadErr } = await supabase.storage
      .from("cheetah-photos")
      .upload(storagePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadErr) {
      console.error("Storage upload failed:", uploadErr);
      return json({ error: "Storage upload failed", detail: uploadErr.message }, 500);
    }

    const publicUrl = supabase.storage.from("cheetah-photos").getPublicUrl(storagePath).data.publicUrl;

    const { data: photo, error: insertErr } = await supabase
      .from("cheetah_photos")
      .insert({
        session_id: session.id,
        user_id: session.user_id,
        event_id: session.event_id ?? null,
        file_name: file.name || `camera-${ts}.${ext}`,
        original_url: publicUrl,
        thumbnail_url: publicUrl,
        preview_url: publicUrl,
        file_size: file.size,
        ai_status: "completed",
        cull_status: "unreviewed",
      })
      .select("id, created_at")
      .single();

    if (insertErr) {
      console.error("DB insert failed:", insertErr);
      return json({ error: "Database insert failed" }, 500);
    }

    // Bump session counter (best-effort)
    supabase
      .from("cheetah_sessions")
      .update({ total_photos: (session.total_photos ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", session.id)
      .then(() => {});

    return json({
      success: true,
      photo_id: photo.id,
      url: publicUrl,
      received_at: photo.created_at,
    });
  } catch (err) {
    console.error("camera-upload error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
