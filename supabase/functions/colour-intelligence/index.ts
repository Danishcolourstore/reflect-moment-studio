import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mediaType, exif } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!imageBase64) throw new Error("imageBase64 is required");

    const exifBlock = [
      `Camera: ${exif?.camera || "Unknown"}`,
      `ISO: ${exif?.iso || "Unknown"}`,
      `Aperture: f/${exif?.aperture || "Unknown"}`,
      `Flash: ${exif?.flash ? "Fired" : "Not fired"}`,
      `Time: ${exif?.time || "Unknown"}`,
      `Lens: ${exif?.lens || "Unknown"}`,
    ].join("\n");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
              content: `You are Colour Store Intelligence — the AI brain of RI (Real Intelligence).
You specialise in Indian wedding photography.
Kerala skin tones. Warm golden Indian skin.
Never plastic. Never bleach. Always real.

Your 6 tools and their ranges (0-100):
- skin: frequency separation strength (never above 68)
- glow: inner luminosity — warm lift only
- form: bone structure micro contrast
- light: eye catchlight enhancement
- grain: film grain character strength
- depth: has two sub-values: texture (always 55-75) and tone

Analyse the photo and EXIF data. Return ONLY valid JSON. Nothing else. No markdown.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mediaType || "image/jpeg"};base64,${imageBase64}`,
                  },
                },
                {
                  type: "text",
                  text: `${exifBlock}

Analyse this photo and return:
{
  "detected": "max 6 words describing lighting/scene conditions",
  "tools": {
    "skin": <number 0-68>,
    "glow": <number 0-100>,
    "form": <number 0-100>,
    "light": <number 0-100>,
    "grain": <number 0-100>,
    "depth": {
      "texture": <number 55-75>,
      "tone": <number 0-100>
    }
  }
}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway returned ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "{}";

    // Strip markdown fences if present
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", raw);
      analysis = {
        detected: "Portrait detected",
        tools: {
          skin: 45,
          glow: 35,
          form: 30,
          light: 25,
          grain: 15,
          depth: { texture: 65, tone: 45 },
        },
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("colour-intelligence error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
