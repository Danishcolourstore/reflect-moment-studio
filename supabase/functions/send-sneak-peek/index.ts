import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") || "https://www.mirroraigallery.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeWhatsApp(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

function buildGalleryUrl(slug: string): string {
  return `${SITE_URL.replace(/\/$/, "")}/g/${slug}`;
}

function buildWhatsAppUrl(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

async function verifyOwner(authHeader: string | null, studioId: string): Promise<boolean> {
  if (!authHeader) return false;
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await anon.auth.getUser(token);
  return user?.id === studioId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let sneakPeekId: string | undefined;

  try {
    const body = await req.json();
    sneakPeekId = body.sneakPeekId;
    if (!sneakPeekId) {
      return new Response(JSON.stringify({ error: "sneakPeekId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: peek, error: peekError } = await sb
      .from("sneak_peeks")
      .select("*")
      .eq("id", sneakPeekId)
      .maybeSingle();

    if (peekError || !peek) {
      return new Response(JSON.stringify({ error: "Sneak peek not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    const isService = authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;
    const isOwner = await verifyOwner(authHeader, peek.studio_id);
    if (!isService && !isOwner) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: event } = await sb
      .from("events")
      .select("slug, name, user_id")
      .eq("id", peek.event_id)
      .single();

    if (!event?.slug) {
      await sb.from("sneak_peeks").update({ status: "failed" }).eq("id", peek.id);
      return new Response(JSON.stringify({ error: "Event slug missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await sb
      .from("profiles")
      .select("studio_name")
      .eq("user_id", event.user_id)
      .maybeSingle();

    const studioName = profile?.studio_name || "Your photographer";
    const galleryLink = buildGalleryUrl(event.slug);
    const recipientName = peek.recipient_name?.trim() || "there";
    const personalNote = peek.message?.trim();

    let body = `Hi ${recipientName} 🤍\nHere's a first look from your beautiful day.\n${galleryLink}\n— ${studioName}`;
    if (personalNote) {
      body = `Hi ${recipientName} 🤍\n${personalNote}\n${galleryLink}\n— ${studioName}`;
    }

    const phone = normalizeWhatsApp(peek.recipient_whatsapp);
    if (!phone) {
      await sb.from("sneak_peeks").update({ status: "failed" }).eq("id", peek.id);
      return new Response(JSON.stringify({ error: "Invalid WhatsApp number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const whatsappUrl = buildWhatsAppUrl(phone, body);

    const { error: updateError } = await sb
      .from("sneak_peeks")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", peek.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, whatsappUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-sneak-peek error:", err);
    if (sneakPeekId) {
      await sb.from("sneak_peeks").update({ status: "failed" }).eq("id", sneakPeekId);
    }

    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
