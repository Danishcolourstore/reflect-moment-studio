import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { photo_id, preview_url } = await req.json();
    if (!photo_id || !preview_url) {
      return new Response(JSON.stringify({ error: "Missing photo_id or preview_url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Update status to processing
    await adminClient
      .from("cheetah_photos")
      .update({ ai_status: "processing" })
      .eq("id", photo_id);

    // Call Lovable AI with vision
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert photography analyst. Analyze the provided photo and return a structured assessment. You MUST call the analyze_photo function with your results.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this photo for technical quality. Evaluate sharpness, exposure, composition, and whether eyes are open (if faces visible). Provide an overall quality score.",
              },
              {
                type: "image_url",
                image_url: { url: preview_url },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_photo",
              description: "Return photo analysis results",
              parameters: {
                type: "object",
                properties: {
                  ai_score: {
                    type: "integer",
                    description: "Overall quality score 0-100",
                  },
                  sharpness: {
                    type: "integer",
                    description: "Sharpness score 0-100",
                  },
                  exposure: {
                    type: "string",
                    enum: ["Underexposed", "Balanced", "Overexposed", "Mixed"],
                    description: "Exposure assessment",
                  },
                  composition: {
                    type: "integer",
                    description: "Composition score 0-100",
                  },
                  eyes_open: {
                    type: "boolean",
                    description: "Whether eyes are open (true if no faces)",
                  },
                  recommendation: {
                    type: "string",
                    description: "Short recommendation (max 60 chars)",
                  },
                },
                required: ["ai_score", "sharpness", "exposure", "composition", "eyes_open", "recommendation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_photo" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);

      const errorMsg =
        status === 429
          ? "Rate limited, will retry"
          : status === 402
          ? "Payment required for AI"
          : "AI analysis failed";

      await adminClient
        .from("cheetah_photos")
        .update({ ai_status: "failed", ai_recommendation: errorMsg })
        .eq("id", photo_id);

      return new Response(JSON.stringify({ error: errorMsg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();

    // Extract tool call result
    let analysis: any = null;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        analysis = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse AI response");
      }
    }

    if (!analysis) {
      await adminClient
        .from("cheetah_photos")
        .update({ ai_status: "failed", ai_recommendation: "Could not parse AI response" })
        .eq("id", photo_id);
      return new Response(JSON.stringify({ error: "Parse failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine cull_status based on scores
    const score = Math.min(100, Math.max(0, analysis.ai_score));
    const sharp = Math.min(100, Math.max(0, analysis.sharpness));
    const eyesOk = analysis.eyes_open !== false;
    const exposureOk = analysis.exposure === "Balanced";

    let cullStatus = "unreviewed";
    if (score >= 80 && sharp >= 70 && eyesOk && exposureOk) {
      cullStatus = "pick"; // ⭐ Best
    } else if (score >= 50 && sharp >= 40) {
      cullStatus = "unreviewed"; // 👍 Good (keep as unreviewed for manual review)
    } else {
      cullStatus = "reject"; // ⚠️ Reject
    }

    // Refine: if score >= 80 but something is off, downgrade to good territory
    if (cullStatus === "pick" && (!eyesOk || !exposureOk)) {
      cullStatus = "unreviewed";
    }

    // Update photo with AI results + auto cull
    await adminClient
      .from("cheetah_photos")
      .update({
        ai_score: score,
        sharpness: sharp,
        exposure: analysis.exposure,
        composition: Math.min(100, Math.max(0, analysis.composition)),
        eyes_open: analysis.eyes_open,
        ai_recommendation: analysis.recommendation,
        ai_status: "completed",
        cull_status: cullStatus,
        processed_at: new Date().toISOString(),
      })
      .eq("id", photo_id);

    // ── Burst detection ──
    // Find the session for this photo
    const { data: photo } = await adminClient
      .from("cheetah_photos")
      .select("session_id, created_at")
      .eq("id", photo_id)
      .single();

    if (photo) {
      // Get photos within 3 seconds of this one
      const createdAt = new Date(photo.created_at);
      const windowStart = new Date(createdAt.getTime() - 3000).toISOString();
      const windowEnd = new Date(createdAt.getTime() + 3000).toISOString();

      const { data: nearby } = await adminClient
        .from("cheetah_photos")
        .select("id, ai_score, burst_group, created_at")
        .eq("session_id", photo.session_id)
        .gte("created_at", windowStart)
        .lte("created_at", windowEnd)
        .order("created_at");

      if (nearby && nearby.length > 1) {
        // Determine burst group ID (use earliest photo's ID or existing group)
        const existingGroup = nearby.find((p) => p.burst_group)?.burst_group;
        const burstGroupId = existingGroup || nearby[0].id;

        // Assign burst group to all nearby
        const ids = nearby.map((p) => p.id);
        await adminClient
          .from("cheetah_photos")
          .update({ burst_group: burstGroupId })
          .in("id", ids);

        // Find best in burst (only among completed)
        const { data: burstPhotos } = await adminClient
          .from("cheetah_photos")
          .select("id, ai_score")
          .eq("burst_group", burstGroupId)
          .eq("ai_status", "completed")
          .order("ai_score", { ascending: false });

        if (burstPhotos && burstPhotos.length > 0) {
          // Reset all, then set best
          await adminClient
            .from("cheetah_photos")
            .update({ is_best_in_burst: false })
            .eq("burst_group", burstGroupId);
          await adminClient
            .from("cheetah_photos")
            .update({ is_best_in_burst: true })
            .eq("id", burstPhotos[0].id);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cheetah-analyze error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
