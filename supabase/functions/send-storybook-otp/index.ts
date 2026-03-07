import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, action, otp } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // ── SEND OTP ──
    if (action === "send") {
      const code = String(Math.floor(100000 + Math.random() * 900000));

      await sb.from("storybook_otp").insert({ email, otp_code: code });

      const smtpFrom = Deno.env.get("SMTP_FROM") || "MirrorAI <noreply@mirrorai.app>";
      const adminEmail = "danishsubair@gmail.com";

      const userHtml = `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px">
          <h1 style="font-size:20px;color:#111;margin-bottom:16px">Storybook Access Code</h1>
          <p style="color:#555;line-height:1.6">Use this code to access the Storybook Creator:</p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;text-align:center;margin:24px 0">
            <span style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#111">${code}</span>
          </div>
          <p style="color:#999;font-size:12px">This code expires in 10 minutes.</p>
        </div>`;

      const adminHtml = `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px">
          <h1 style="font-size:20px;color:#111;margin-bottom:16px">Storybook Access Request</h1>
          <p style="color:#555;line-height:1.6"><strong>${email}</strong> requested Storybook access.</p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;text-align:center;margin:24px 0">
            <span style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#111">${code}</span>
          </div>
          <p style="color:#999;font-size:12px">OTP expires in 10 minutes.</p>
        </div>`;

      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        // Only send OTP to admin — testers receive the code from admin directly
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({ from: smtpFrom, to: [adminEmail], subject: `Storybook Access: ${email}`, html: adminHtml }),
        });
      } else {
        console.log("No RESEND_API_KEY — OTP stored but email not sent:", { email, code });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── VERIFY OTP ──
    if (action === "verify") {
      if (!otp) {
        return new Response(JSON.stringify({ valid: false, error: "OTP required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await sb
        .from("storybook_otp")
        .select("*")
        .eq("email", email)
        .eq("otp_code", otp)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ valid: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await sb.from("storybook_otp").update({ verified: true }).eq("id", data.id);

      return new Response(JSON.stringify({ valid: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
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
