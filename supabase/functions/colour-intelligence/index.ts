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
              content: `You are MirrorAI Intelligence — the AI brain of RI (Real Intelligence).
You specialise in Indian wedding photography.
Kerala skin tones. Warm golden Indian skin.
Never plastic. Never bleach. Always real.

When given a photo you must identify SEMANTIC ZONES:

1. SKIN ZONES:
   - Face skin area, neck and décolletage, hands and arms
   - Skin tone: warm_golden / deep_brown / fair / dusky
   - Lighting direction on skin

2. OUTFIT ZONE:
   - Saree / lehenga / sherwani / suit
   - Fabric type: silk / georgette / velvet / net / unknown
   - Primary outfit color
   - Embroidery or zari work present: yes/no

3. JEWELLERY ZONE:
   - Gold jewellery present: yes/no
   - Diamond/stone jewellery: yes/no
   - Location: neck / ears / head / hands / nose

4. HAIR ZONE:
   - Hair color
   - Hair accessories present: yes/no
   - Flowers in hair: yes/no

5. BACKGROUND ZONE:
   - Indoor/outdoor
   - Background complexity: simple/medium/busy

Your 9 tools and ranges (0-100):
- skin: frequency separation on skin zones only (never above 68)
- glow: inner luminosity on face — warm lift only
- form: bone structure micro contrast on face
- light: eye catchlight enhancement
- grain: film grain character (applied last, over everything)
- depth: texture (always 55-75) and tone sub-values
- outfit: fabric texture enhancement, color richness, embroidery detail (0-100)
- jewellery: gold warmth, diamond sparkle, detail enhancement (0-100)
- hair: strand definition, shine, flower/accessory enhancement (0-100)

Each tool knows its zone. Skin never touches dress. Outfit never touches face. Jewellery enhances only metal. Intelligent. Surgical. Precise.

Return ONLY valid JSON. No markdown. No explanation.`,
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

Analyse this photo deeply. Return:
{
  "zones": {
    "skin": {
      "tone": "warm_golden|deep_brown|fair|dusky",
      "lighting": "golden_hour|flash|indoor|outdoor",
      "areas": ["face", "neck", "hands"]
    },
    "outfit": {
      "type": "saree|lehenga|sherwani|other",
      "fabric": "silk|georgette|velvet|net|unknown",
      "color": "hex or description",
      "embroidery": true|false
    },
    "jewellery": {
      "gold": true|false,
      "diamonds": true|false,
      "heavy": true|false
    },
    "hair": {
      "accessories": true|false,
      "flowers": true|false
    },
    "background": {
      "type": "indoor|outdoor",
      "complexity": "simple|medium|busy"
    }
  },
  "tools": {
    "skin": <number 0-68>,
    "glow": <number 0-100>,
    "form": <number 0-100>,
    "light": <number 0-100>,
    "grain": <number 0-100>,
    "depth": { "texture": <number 55-75>, "tone": <number 0-100> },
    "outfit": <number 0-100>,
    "jewellery": <number 0-100>,
    "hair": <number 0-100>
  },
  "detected": "brief description e.g. Silk saree · Gold temple jewellery · Golden hour"
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
        zones: {},
        tools: {
          skin: 45, glow: 35, form: 30, light: 25, grain: 15,
          depth: { texture: 65, tone: 45 },
          outfit: 40, jewellery: 35, hair: 30,
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
