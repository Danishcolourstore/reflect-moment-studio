/**
 * cheetah-score-photo — async AI scoring for a single Cheetah photo.
 * Invoked fire-and-forget from cheetah-camera-upload after a successful upload.
 *
 * Uses Lovable AI Gateway (Gemini 2.5 Flash) to score:
 *   - sharpness (0-10)    — focus quality
 *   - exposure ('under'|'good'|'over')
 *   - composition (0-10)  — framing strength
 *   - eyes_open (boolean) — for portraits
 *   - cull category: 'best' | 'maybe' | 'reject'
 *   - one-line recommendation
 *
 * Updates the cheetah_photos row via service-role. Realtime UI picks up the
 * change instantly because cheetah_photos is in the supabase_realtime publication.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface AIScore {
  sharpness: number;
  exposure: "under" | "good" | "over";
  composition: number;
  eyes_open: boolean;
  cull: "best" | "maybe" | "reject";
  recommendation: string;
}

async function scoreWithGemini(imageUrl: string, apiKey: string): Promise<AIScore | null> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are an expert wedding photography culling assistant. Score one image and return strict JSON only — no prose, no markdown.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Evaluate this photo for a live wedding gallery. Return JSON with keys:
{
  "sharpness": 0-10,
  "exposure": "under" | "good" | "over",
  "composition": 0-10,
  "eyes_open": true | false,
  "cull": "best" | "maybe" | "reject",
  "recommendation": "one short sentence"
}
Be strict: blurry, motion-blurred, eyes-closed, or underexposed photos = reject. Strong moments, good light, sharp eyes = best.`,
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    console.error("Gemini scoring failed:", resp.status, await resp.text().catch(() => ""));
    return null;
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    return {
      sharpness: Number(parsed.sharpness) || 0,
      exposure: ["under", "good", "over"].includes(parsed.exposure) ? parsed.exposure : "good",
      composition: Number(parsed.composition) || 0,
      eyes_open: Boolean(parsed.eyes_open),
      cull: ["best", "maybe", "reject"].includes(parsed.cull) ? parsed.cull : "maybe",
      recommendation: String(parsed.recommendation || "").slice(0, 280),
    };
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", e, content);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const { photo_id } = await req.json();
    if (!photo_id || typeof photo_id !== "string") {
      return json({ error: "photo_id required" }, 400);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Lookup photo
    const { data: photo, error: lookupErr } = await supabase
      .from("cheetah_photos")
      .select("id, original_url, preview_url, ai_status")
      .eq("id", photo_id)
      .maybeSingle();

    if (lookupErr || !photo) return json({ error: "Photo not found" }, 404);
    if (photo.ai_status === "completed") return json({ ok: true, skipped: "already scored" });

    // Mark processing
    await supabase
      .from("cheetah_photos")
      .update({ ai_status: "processing" })
      .eq("id", photo_id);

    const imgUrl = photo.preview_url || photo.original_url;
    const score = await scoreWithGemini(imgUrl, apiKey);

    if (!score) {
      await supabase
        .from("cheetah_photos")
        .update({
          ai_status: "failed",
          ai_recommendation: "Auto-scoring unavailable — review manually.",
        })
        .eq("id", photo_id);
      return json({ ok: false, error: "scoring failed" }, 502);
    }

    const overall = Math.round(((score.sharpness + score.composition) / 2) * 10) / 10;

    await supabase
      .from("cheetah_photos")
      .update({
        ai_status: "completed",
        ai_score: overall,
        ai_recommendation: score.recommendation,
        sharpness: score.sharpness,
        composition: score.composition,
        eyes_open: score.eyes_open,
        exposure: score.exposure,
        cull_status: score.cull,
        processed_at: new Date().toISOString(),
      })
      .eq("id", photo_id);

    return json({ ok: true, score: { ...score, overall } });
  } catch (err) {
    console.error("score-photo error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
