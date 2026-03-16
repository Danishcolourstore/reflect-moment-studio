import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, user_id } = await req.json();
    if (!domain || !user_id) {
      return new Response(JSON.stringify({ success: false, status: "error", message: "Missing domain or user_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let verified = false;

    // Check CNAME
    try {
      const cnameRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=CNAME`);
      const cnameData = await cnameRes.json();
      if (cnameData.Answer?.some((a: any) => a.data?.toLowerCase().includes("mirroraigallery.com"))) {
        verified = true;
      }
    } catch {}

    // Check A record
    if (!verified) {
      try {
        const aRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`);
        const aData = await aRes.json();
        if (aData.Answer?.some((a: any) => a.data === "76.76.21.21")) {
          verified = true;
        }
      } catch {}
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const newStatus = verified ? "verified" : "error";
    const updateData: any = { verification_status: newStatus, updated_at: new Date().toISOString() };
    if (verified) updateData.verified_at = new Date().toISOString();

    await sb.from("domains").update(updateData).eq("custom_domain", domain).eq("user_id", user_id);

    return new Response(JSON.stringify({
      success: verified,
      status: newStatus,
      message: verified ? "Domain verified successfully!" : "DNS records not detected yet. Please check your configuration and try again.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, status: "error", message: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
