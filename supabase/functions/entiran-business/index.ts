import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { action, leadName, leadMessage } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Action: Generate Reply ───
    if (action === "generate_reply") {
      // Get user's packages for pricing context
      const { data: packages } = await supabase
        .from("packages")
        .select("name, price, description")
        .eq("photographer_id", userId)
        .limit(5);

      // Get user's bookings for availability context
      const { data: bookings } = await supabase
        .from("bookings")
        .select("event_date, status")
        .eq("photographer_id", userId)
        .eq("status", "confirmed")
        .gte("event_date", new Date().toISOString().split("T")[0]);

      const bookedDates = (bookings || []).map((b: any) => b.event_date);

      const prompt = `You are drafting a WhatsApp reply for a professional wedding/event photographer. 
      
Lead name: ${leadName}
Lead message: "${leadMessage || "Hi, I'm interested in your photography services."}"

Photographer's packages:
${packages?.length ? packages.map((p: any) => `- ${p.name}: ₹${p.price} — ${p.description || ""}`).join("\n") : "No packages set up yet. Use general pricing."}

Already booked dates: ${bookedDates.length ? bookedDates.join(", ") : "No confirmed bookings"}

Draft a warm, professional WhatsApp reply that:
1. Greets by name
2. Thanks them for reaching out
3. Briefly mentions relevant package(s) with pricing
4. Mentions availability (if they asked about a date, check against booked dates)
5. Ends with a soft CTA (suggest a call or meeting)
6. Keep it under 100 words, conversational, not salesy
7. Use emojis sparingly (1-2 max)`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI request failed");
      }

      const aiData = await aiResponse.json();
      const draftReply = aiData.choices?.[0]?.message?.content || "Could not generate reply.";

      // Save draft
      const { data: draft } = await supabase.from("ai_reply_drafts").insert({
        user_id: userId,
        lead_name: leadName,
        lead_message: leadMessage,
        draft_reply: draftReply,
        pricing_context: { packages: packages || [] },
        availability_context: { booked_dates: bookedDates },
      }).select().single();

      return new Response(JSON.stringify({ draft: draftReply, id: draft?.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Action: Pricing Analysis ───
    if (action === "pricing_analysis") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("city, specialty")
        .eq("user_id", userId)
        .single();

      const { data: userPackages } = await supabase
        .from("packages")
        .select("name, price, category")
        .eq("photographer_id", userId);

      const prompt = `Analyze this photographer's pricing and provide market intelligence.

City: ${profile?.city || "Unknown"}
Specialty: ${profile?.specialty || "Wedding"}
Their packages: ${JSON.stringify(userPackages || [])}

Provide a JSON response with this structure (respond ONLY with valid JSON, no markdown):
{
  "insights": [
    {
      "category": "wedding",
      "percentile_rank": 45,
      "trend": "below_average",
      "insight": "Your wedding package is 30% below the local average. Consider adjusting."
    }
  ],
  "overall_position": "Your pricing is competitive but leaves room for growth.",
  "recommendation": "Consider a 10-15% increase on your premium package."
}`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!aiResponse.ok) {
        throw new Error("AI request failed");
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "{}";
      
      let analysis;
      try {
        analysis = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, ""));
      } catch {
        analysis = { insights: [], overall_position: content, recommendation: "" };
      }

      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("daan-business error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
