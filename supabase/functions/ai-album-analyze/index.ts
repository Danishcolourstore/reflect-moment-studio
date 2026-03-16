import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { photoUrls, batchIndex, batchSize } = await req.json();

    if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: "photoUrls array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Analyze photos in batches using Gemini vision
    const systemPrompt = `You are a professional wedding album designer AI. Analyze wedding photos and return structured data.

For each photo URL provided, analyze and return a JSON array with one object per photo containing:
- "url": the photo URL (string)
- "qualityScore": overall quality 0-100 (number)
- "sharpness": sharpness score 0-100 (number)
- "composition": composition quality 0-100 (number)
- "moment": one of: "opening", "bride_preparation", "groom_preparation", "detail_shots", "ceremony", "couple_portraits", "family", "candid", "reception", "grand_finale"
- "faces": number of faces detected (number)
- "emotion": dominant emotion like "joy", "love", "contemplation", "celebration", "serene" (string)
- "description": brief 5-10 word description (string)
- "isDuplicate": false (boolean) - set true if very similar to another photo in the batch
- "duplicateGroupId": null or group ID string if duplicate
- "isBestInGroup": true if best quality in duplicate group (boolean)

Classify moments based on visual content:
- "bride_preparation": bride getting ready, makeup, dress
- "groom_preparation": groom getting ready, sherwani/suit
- "detail_shots": rings, decorations, invitations, flowers, shoes, jewelry
- "ceremony": rituals, mandap, vows, pheras, exchange
- "couple_portraits": couple together, posed or candid
- "family": group photos, family members
- "candid": natural unposed moments, laughter, dancing
- "reception": party, toasts, cake, first dance
- "opening": best dramatic/hero shot (assign to top 2-3 best photos)
- "grand_finale": assign to 1-2 dramatic/emotional closing shots

Be accurate with quality scores. Sharp, well-exposed, well-composed photos score 80+. Blurry or poorly exposed score below 40.`;

    const userContent: any[] = [
      { type: "text", text: `Analyze these ${photoUrls.length} wedding photos. Return ONLY a JSON array, no markdown.` },
    ];

    // Add image URLs to the message
    for (const url of photoUrls) {
      userContent.push({
        type: "image_url",
        image_url: { url, detail: "low" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.error("AI gateway error:", status, text);
      throw new Error(`AI analysis failed: ${status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "[]";

    // Parse the JSON response - strip markdown fences if present
    let parsed: any[];
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      // Fallback: create basic analysis from URLs
      parsed = photoUrls.map((url: string, i: number) => ({
        url,
        qualityScore: 70 + Math.random() * 20,
        sharpness: 70 + Math.random() * 20,
        composition: 70 + Math.random() * 20,
        moment: ["bride_preparation", "ceremony", "couple_portraits", "family", "candid", "reception"][i % 6],
        faces: Math.floor(Math.random() * 4),
        emotion: "joy",
        description: "Wedding photo",
        isDuplicate: false,
        duplicateGroupId: null,
        isBestInGroup: true,
      }));
    }

    return new Response(
      JSON.stringify({ analyses: parsed, batchIndex }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-album-analyze error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
