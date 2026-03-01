import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });

  try {
    const { email, name } = await req.json();
    if (!email) return new Response(JSON.stringify({ error: "email required" }), { status: 400 });

    const firstName = (name || "").split(" ")[0] || "there";

    if (RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "MirrorAI <noreply@mirrorai.app>",
          to: email,
          subject: "Welcome to MirrorAI",
          html: `<div style="font-family:serif;max-width:600px;margin:0 auto;padding:40px 20px"><h1 style="font-size:28px;color:#1a1a1a">Welcome to MirrorAI, ${firstName}!</h1><p style="color:#666;font-size:16px;line-height:1.6">Your studio is ready. Start creating beautiful galleries for your clients.</p><a href="${SUPABASE_URL.replace('.supabase.co','')}/dashboard" style="display:inline-block;margin-top:20px;padding:12px 32px;background:#b0875a;color:#fff;text-decoration:none;border-radius:6px;font-size:14px">Go to Dashboard</a><p style="margin-top:40px;color:#999;font-size:12px">— The MirrorAI Team</p></div>`,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});
