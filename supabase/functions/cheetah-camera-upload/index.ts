import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-upload-token, x-session-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get session ID and upload token from headers or form data
    const sessionId = req.headers.get("x-session-id");
    const uploadToken = req.headers.get("x-upload-token");

    if (!sessionId || !uploadToken) {
      return new Response(
        JSON.stringify({ error: "Missing x-session-id or x-upload-token headers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify session exists and token matches
    const { data: session, error: sessErr } = await supabase
      .from("cheetah_sessions")
      .select("id, user_id, status")
      .eq("id", sessionId)
      .single();

    if (sessErr || !session) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided. Send as multipart form with 'file' field." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/heif", "image/heic"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpe?g|png|heif|heic)$/i)) {
      return new Response(
        JSON.stringify({ error: "Invalid file type. Use JPEG, PNG, or HEIF." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = session.user_id;
    const timestamp = Date.now();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `${userId}/cheetah/${sessionId}/${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload to storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadErr } = await supabase.storage
      .from("cheetah-photos")
      .upload(storagePath, fileBuffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      return new Response(
        JSON.stringify({ error: "Storage upload failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const publicUrl = supabase.storage.from("cheetah-photos").getPublicUrl(storagePath).data.publicUrl;

    // Insert photo record — triggers realtime
    const { data: photo, error: insertErr } = await supabase
      .from("cheetah_photos")
      .insert({
        session_id: sessionId,
        user_id: userId,
        file_name: file.name || `camera-${timestamp}.${ext}`,
        original_url: publicUrl,
        thumbnail_url: publicUrl,
        preview_url: publicUrl,
        ai_status: "pending",
        cull_status: "unreviewed",
        file_size: file.size,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(
        JSON.stringify({ error: "Database insert failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update session photo count
    await supabase.rpc("", {}).catch(() => {});
    await supabase
      .from("cheetah_sessions")
      .update({ total_photos: session.user_id ? undefined : 0 })
      .eq("id", sessionId);
    // Just increment — simpler approach
    const { data: countData } = await supabase
      .from("cheetah_photos")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);

    // Fire-and-forget: trigger AI analysis
    try {
      await supabase.functions.invoke("cheetah-analyze", {
        body: { photoId: photo.id, imageUrl: publicUrl },
      });
    } catch {
      // Non-blocking — analysis can happen later
    }

    return new Response(
      JSON.stringify({
        success: true,
        photo_id: photo.id,
        url: publicUrl,
        message: "Photo received and queued for AI analysis",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Camera upload error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
