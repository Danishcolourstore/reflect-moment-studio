import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { event_id, guest_name, content } = await req.json();
    const safeGuestName = escapeHtml(guest_name || "A guest");
    const safeContent = escapeHtml(content || "");
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: event } = await sb.from("events").select("name, user_id").eq("id", event_id).single();
    if (!event) return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: corsHeaders });
    const safeEventName = escapeHtml(event.name);
    const { data: profile } = await sb.from("profiles").select("email").eq("user_id", event.user_id).single();

    await sb.from("notifications").insert({ user_id: event.user_id, type: "new_comment", title: "New comment on your photo", message: `${guest_name || 'A guest'} commented on a photo in "${event.name}".`, event_id });

    if (RESEND_API_KEY && profile?.email) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "MirrorAI <noreply@mirrorai.app>", to: profile.email,
          subject: `New comment on your photo — ${event.name}`,
          html: `<div style="font-family:serif;max-width:600px;margin:0 auto;padding:40px 20px"><h1 style="font-size:24px">${safeGuestName} commented on your photo</h1><blockquote style="border-left:3px solid #b0875a;padding-left:16px;color:#666;font-style:italic">${safeContent}</blockquote><p style="color:#666">Photo in <strong>${safeEventName}</strong></p><p style="margin-top:40px;color:#999;font-size:12px">— MirrorAI</p></div>`,
        }),
      });
    }
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
