import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });

  try {
    const { event_id, guest_name, guest_email, photo_count, message } = await req.json();
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: event } = await sb.from("events").select("name, user_id").eq("id", event_id).single();
    if (!event) return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
    const { data: profile } = await sb.from("profiles").select("email").eq("user_id", event.user_id).single();

    await sb.from("notifications").insert({ user_id: event.user_id, type: "guest_favorites", title: `${guest_name} shared their favorites`, message: `${guest_name} marked ${photo_count} photos as favorites in "${event.name}".`, event_id });

    if (RESEND_API_KEY && profile?.email) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "MirrorAI <noreply@mirrorai.app>", to: profile.email,
          subject: `${guest_name} shared their favorite photos — ${event.name}`,
          html: `<div style="font-family:serif;max-width:600px;margin:0 auto;padding:40px 20px"><h1 style="font-size:24px">${guest_name} shared their favorites</h1><p style="color:#666;font-size:16px">${guest_name} (${guest_email}) marked <strong>${photo_count}</strong> photos as favorites in <strong>${event.name}</strong>.</p>${message ? `<blockquote style="border-left:3px solid #b0875a;padding-left:16px;color:#666;font-style:italic;margin-top:16px">${message}</blockquote>` : ''}<p style="margin-top:40px;color:#999;font-size:12px">— MirrorAI</p></div>`,
        }),
      });
    }
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});
