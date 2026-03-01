import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });

  try {
    const { event_id } = await req.json();
    if (!event_id) return new Response(JSON.stringify({ error: "event_id required" }), { status: 400 });

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: event } = await sb.from("events").select("name, user_id").eq("id", event_id).single();
    if (!event) return new Response(JSON.stringify({ error: "event not found" }), { status: 404 });

    const { data: profile } = await sb.from("profiles").select("email").eq("user_id", event.user_id).single();
    if (!profile?.email) return new Response(JSON.stringify({ error: "no email" }), { status: 404 });

    // Insert notification
    await sb.from("notifications").insert({ user_id: event.user_id, type: "gallery_view", title: "Someone viewed your gallery", message: `Your gallery "${event.name}" was just viewed by a guest.`, event_id });

    if (RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "MirrorAI <noreply@mirrorai.app>",
          to: profile.email,
          subject: `Someone viewed your gallery — ${event.name}`,
          html: `<div style="font-family:serif;max-width:600px;margin:0 auto;padding:40px 20px"><h1 style="font-size:24px;color:#1a1a1a">Your gallery was just viewed</h1><p style="color:#666;font-size:16px;line-height:1.6">A guest just viewed <strong>${event.name}</strong>.</p><a href="${SUPABASE_URL.replace('.supabase.co','')}/dashboard/analytics" style="display:inline-block;margin-top:20px;padding:12px 32px;background:#b0875a;color:#fff;text-decoration:none;border-radius:6px;font-size:14px">View Analytics</a><p style="margin-top:40px;color:#999;font-size:12px">— MirrorAI</p></div>`,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});
