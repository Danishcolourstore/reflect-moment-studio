import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SIGN_EXPIRY = 60 * 60; // 1 hour
const SIGN_CHUNK = 100;      // Supabase batch signing limit

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    const event_slug: string | undefined =
      body.event_slug ?? url.searchParams.get("event_slug") ?? undefined;
    const access_token: string | undefined =
      body.access_token ?? url.searchParams.get("access_token") ?? undefined;

    if (!event_slug) return json({ error: "event_slug is required" }, 400);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Fetch event ──
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("slug", event_slug)
      .maybeSingle();

    if (eventError || !event) return json({ error: "Event not found" }, 400);

    // ── Authorization ──
    let authorized: boolean = event.is_published;

    if (!authorized && access_token && event.qr_token) {
      const encoder = new TextEncoder();
      const a = encoder.encode(access_token);
      const b = encoder.encode(event.qr_token as string);
      // crypto.subtle.timingSafeEqual requires same-length buffers
      if (a.byteLength === b.byteLength) {
        authorized = crypto.subtle.timingSafeEqual(a, b);
      }
    }

    if (!authorized) return json({ error: "Forbidden" }, 403);

    // ── Fetch photos (paginated) ──
    let allPhotos: any[] = [];
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data: photoData } = await supabaseAdmin
        .from("photos")
        .select("id, storage_path, url, file_name, file_size, section, sort_order, created_at")
        .eq("event_id", event.id)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .range(from, from + PAGE - 1);

      if (!photoData || photoData.length === 0) break;
      allPhotos = allPhotos.concat(photoData);
      if (photoData.length < PAGE) break;
      from += PAGE;
    }

    // ── Batch-generate signed URLs ──
    const pathsToSign = allPhotos
      .map((p) => p.storage_path as string | null)
      .filter(Boolean) as string[];

    const signedUrlMap = new Map<string, string>();

    for (let i = 0; i < pathsToSign.length; i += SIGN_CHUNK) {
      const chunk = pathsToSign.slice(i, i + SIGN_CHUNK);
      const { data: signedData } = await supabaseAdmin.storage
        .from("gallery-photos")
        .createSignedUrls(chunk, SIGN_EXPIRY);
      if (signedData) {
        for (const item of signedData) {
          if (item.signedUrl) signedUrlMap.set(item.path, item.signedUrl);
        }
      }
    }

    const photos = allPhotos.map((photo) => ({
      id: photo.id,
      storage_path: photo.storage_path,
      file_name: photo.file_name,
      file_size: photo.file_size,
      section: photo.section,
      sort_order: photo.sort_order,
      created_at: photo.created_at,
      signed_url: photo.storage_path
        ? (signedUrlMap.get(photo.storage_path) ?? photo.url)
        : photo.url,
    }));

    // ── Safe event payload (never expose PIN hash, gallery_password hash, or qr_token) ──
    const safeEvent = {
      id: event.id,
      name: event.name,
      slug: event.slug,
      event_date: event.event_date,
      cover_url: event.cover_url,
      is_published: event.is_published,
      gallery_layout: event.gallery_layout,
      gallery_style: event.gallery_style,
      gallery_pin: Boolean(event.gallery_pin),
      gallery_password: Boolean(event.gallery_password),
      downloads_enabled: event.downloads_enabled,
      download_requires_password: event.download_requires_password,
      download_password: event.download_password,
      download_resolution: event.download_resolution,
      watermark_enabled: event.watermark_enabled,
      face_recognition_enabled: event.face_recognition_enabled,
      selection_mode_enabled: event.selection_mode_enabled,
      user_id: event.user_id,
      hero_couple_name: event.hero_couple_name,
      hero_subtitle: event.hero_subtitle,
      hero_button_label: event.hero_button_label,
      website_template: event.website_template,
    };

    return json({ success: true, event: safeEvent, photos });
  } catch (err: any) {
    console.error("get-gallery-photos error:", err);
    return json({ error: "Internal server error", detail: err?.message }, 500);
  }
});
