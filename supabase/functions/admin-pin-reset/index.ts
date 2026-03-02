import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Handle reset request (POST) - sends email with reset token
  if (req.method === "POST") {
    const { action, token, new_pin } = await req.json();

    if (action === "request_reset") {
      // Generate a reset token
      const resetToken = crypto.randomUUID();
      
      // Store it
      await supabase.from("platform_settings").upsert(
        { key: "admin_reset_token", value: resetToken, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

      // Send email via SMTP
      const smtpHost = Deno.env.get("SMTP_HOST");
      const smtpPort = Deno.env.get("SMTP_PORT");
      const smtpUser = Deno.env.get("SMTP_USER");
      const smtpPass = Deno.env.get("SMTP_PASS");
      const smtpFrom = Deno.env.get("SMTP_FROM");

      const projectUrl = url.origin.replace("supabase.co/functions/v1/admin-pin-reset", "");
      // Use the published app URL
      const appUrl = Deno.env.get("SITE_URL") || "https://reflect-moment-studio.lovable.app";
      const resetLink = `${appUrl}/admin/reset-pin?token=${resetToken}`;

      if (smtpHost && smtpUser && smtpPass) {
        try {
          // Use Resend-style API or basic fetch to send email
          const emailResponse = await fetch(`https://api.resend.com/emails`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY") || smtpPass}`,
            },
            body: JSON.stringify({
              from: smtpFrom || "MirrorAI <noreply@mirrorai.app>",
              to: ["danishsubair@gmail.com"],
              subject: "MirrorAI Admin Access Reset Requested",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                  <h1 style="font-size: 20px; color: #111;">MirrorAI Admin Access Reset</h1>
                  <p style="color: #555; line-height: 1.6;">Someone entered the wrong admin PIN 3 times. Click below to reset your Admin PIN securely.</p>
                  <a href="${resetLink}" style="display: inline-block; margin: 24px 0; padding: 12px 32px; background: #111; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px;">Reset Admin PIN</a>
                  <p style="color: #999; font-size: 12px;">If you didn't request this, you can ignore this email.</p>
                </div>
              `,
            }),
          });
          console.log("Email sent:", emailResponse.status);
        } catch (e) {
          console.error("Email send failed:", e);
        }
      }

      return new Response(JSON.stringify({ success: true, message: "Reset email sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_pin") {
      if (!token || !new_pin || new_pin.length !== 6 || !/^\d{6}$/.test(new_pin)) {
        return new Response(JSON.stringify({ success: false, error: "Invalid PIN format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data } = await supabase.rpc("update_admin_pin", { new_pin, reset_token: token });
      
      // Clear attempts on successful reset
      if (data?.success) {
        await supabase.from("admin_pin_attempts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      }

      return new Response(JSON.stringify(data || { success: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
