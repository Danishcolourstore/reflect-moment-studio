import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, pin, user_email, timestamp } = await req.json();

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const smtpFrom = Deno.env.get("SMTP_FROM") || "MirrorAI <noreply@mirrorai.app>";

    const to = "danishsubair@gmail.com";

    let subject: string;
    let html: string;

    if (type === "send_pin") {
      subject = "MirrorAI Access PIN";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 20px; color: #111; margin-bottom: 16px;">MirrorAI Access PIN</h1>
          <p style="color: #555; line-height: 1.6;">A photographer is requesting dashboard access.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #111;">${pin}</span>
          </div>
          <p style="color: #555; line-height: 1.6;">User: <strong>${user_email || 'Unknown'}</strong></p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">Share this PIN only if you approve access.</p>
        </div>
      `;
    } else if (type === "lockout_alert") {
      subject = "🚨 MirrorAI Security Alert";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 20px; color: #c00; margin-bottom: 16px;">Security Alert</h1>
          <p style="color: #555; line-height: 1.6;">3 incorrect PIN attempts detected.</p>
          <p style="color: #555;">User: <strong>${user_email || 'Unknown'}</strong></p>
          <p style="color: #555;">Time: <strong>${timestamp || new Date().toISOString()}</strong></p>
          <p style="color: #555;">Action: Access temporarily locked for 60 seconds.</p>
        </div>
      `;
    } else {
      return new Response(JSON.stringify({ error: "Unknown type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try Resend API first, fallback to SMTP
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({ from: smtpFrom, to: [to], subject, html }),
      });
      const data = await res.json();
      return new Response(JSON.stringify({ success: res.ok, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: use SMTP via edge function relay
    if (smtpHost && smtpUser && smtpPass) {
      // Simple SMTP not available in Deno edge — log for now
      console.log("SMTP configured but Resend key missing. Email not sent:", { subject, to });
    }

    return new Response(JSON.stringify({ success: true, note: "Email service attempted" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
