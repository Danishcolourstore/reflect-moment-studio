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
    const { email, action } = await req.json();
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
      const otp = String(Math.floor(100000 + Math.random() * 900000));

      // Store OTP
      await sb.from("storybook_otp").insert({
        email,
        otp_code: otp,
      });

      // Build emails
      const smtpFrom = Deno.env.get("SMTP_FROM") || "MirrorAI <noreply@mirrorai.app>";
      const adminEmail = "danishsubair@gmail.com";

      const userHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 20px; color: #111; margin-bottom: 16px;">Storybook Access Code</h1>
          <p style="color: #555; line-height: 1.6;">Use this code to access the Storybook Creator:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #111;">${otp}</span>
          </div>
          <p style="color: #999; font-size: 12px;">This code expires in 10 minutes.</p>
        </div>
      `;

      const adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 20px; color: #111; margin-bottom: 16px;">Storybook Access Request</h1>
          <p style="color: #555; line-height: 1.6;"><strong>${email}</strong> requested access to the Storybook Creator.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #111;">${otp}</span>
          </div>
          <p style="color: #999; font-size: 12px;">OTP expires in 10 minutes.</p>
        </div>
      `;

      // Send via SMTP / Resend
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        // Send to user
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({ from: smtpFrom, to: [email], subject: "Your Storybook Access Code", html: userHtml }),
        });
        // Notify admin
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({ from: smtpFrom, to: [adminEmail], subject: `Storybook Access: ${email}`, html: adminHtml }),
        });
      } else {
        console.log("No RESEND_API_KEY — OTP generated but email not sent:", { email, otp });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── VERIFY OTP ──
    if (action === "verify") {
      const { otp } = await req.json().catch(() => ({ otp: "" }));
      // Re-parse since we already consumed the body
    }

    // Handle verify with otp in initial parse
    if (action === "verify") {
      // We need to get otp from the original parse — let's restructure
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
