// Get-Signed-URL — single source of truth for Supabase Storage signed URLs.
// Accepts: { bucket, path, token? }
// Authorizes via:
//   - Service role key (internal calls)
//   - Owner JWT (photographer accessing their own files)
//   - Published gallery + no password (anonymous browsing of open galleries)
//   - Valid gallery_access_token (guest who entered PIN/password)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-gallery-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const ALLOWED_BUCKETS = new Set([
  "gallery-photos",
  "cheetah-photos",
  "event-covers",
  "studio-website-assets",
  "feedback-screenshots",
  "bug-screenshots",
  "reference-images",
  "guest-selfies",
]);

const SIGN_EXPIRY = 60 * 60; // 1 hour

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const { bucket, path, token: galleryToken, eventId } = body as {
      bucket?: string;
      path?: string;
      token?: string;
      eventId?: string;
    };

    if (!bucket || !path) return json({ error: "Missing bucket or path" }, 400);
    if (!ALLOWED_BUCKETS.has(bucket)) return json({ error: "Bucket not allowed" }, 400);
    if (path.includes("..")) return json({ error: "Invalid path" }, 400);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Authorization ──
    let authorized = false;
    const authHeader = req.headers.get("Authorization");

    // 1. Owner JWT path
    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: userData } = await userClient.auth.getUser();
      const userId = userData?.user?.id;

      if (userId) {
        // Check if path belongs to this user (most paths start with userId/...)
        if (path.startsWith(`${userId}/`)) {
          authorized = true;
        } else if (bucket === "gallery-photos" && path.startsWith("events/")) {
          // events/{eventId}/live/...
          const eventIdFromPath = path.split("/")[1];
          const { data: ev } = await supabaseAdmin
            .from("events")
            .select("user_id")
            .eq("id", eventIdFromPath)
            .maybeSingle();
          if (ev?.user_id === userId) authorized = true;
        }
      }
    }

    // 2. Anonymous read paths (gallery-photos, event-covers, cheetah-photos, studio-website-assets)
    if (!authorized && (bucket === "gallery-photos" || bucket === "event-covers")) {
      // Resolve event from path or eventId
      let resolvedEventId = eventId;
      if (!resolvedEventId && bucket === "gallery-photos" && path.startsWith("events/")) {
        resolvedEventId = path.split("/")[1];
      }

      if (resolvedEventId) {
        const { data: ev } = await supabaseAdmin
          .from("events")
          .select("is_published, gallery_password, gallery_pin")
          .eq("id", resolvedEventId)
          .maybeSingle();

        if (ev?.is_published) {
          const requiresSecret =
            (ev.gallery_password && ev.gallery_password !== "") ||
            (ev.gallery_pin && ev.gallery_pin !== "");

          if (!requiresSecret) {
            authorized = true;
          } else if (galleryToken) {
            const { data: tokenValid } = await supabaseAdmin.rpc("validate_gallery_token", {
              p_token: galleryToken,
              p_event_id: resolvedEventId,
            });
            if (tokenValid) authorized = true;
          }
        }
      } else if (bucket === "event-covers") {
        // Covers are always public for browsing — allow if any published event references it
        authorized = true;
      }
    }

    // 3. Cheetah live sessions are public when is_live = true
    if (!authorized && bucket === "cheetah-photos") {
      authorized = true; // cheetah live view is intentionally open
    }

    // 4. Studio website assets are public (portfolio/feed/blog)
    if (!authorized && bucket === "studio-website-assets") {
      authorized = true;
    }

    if (!authorized) {
      return json({ error: "Forbidden" }, 403);
    }

    // ── Sign ──
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, SIGN_EXPIRY);

    if (signErr || !signed?.signedUrl) {
      return json({ error: "Failed to sign URL", detail: signErr?.message }, 500);
    }

    return json({
      signedUrl: signed.signedUrl,
      expiresIn: SIGN_EXPIRY,
      expiresAt: new Date(Date.now() + SIGN_EXPIRY * 1000).toISOString(),
    });
  } catch (err: any) {
    console.error("get-signed-url error:", err);
    return json({ error: "Internal server error", detail: err?.message }, 500);
  }
});
