import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, location, studioName, specialties, eventData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "seo_pages") {
      systemPrompt = `You are an expert SEO content writer for wedding and event photographers. Generate landing pages that rank on Google for local search queries. Write naturally, avoid keyword stuffing. Include structured content with headings, paragraphs, and calls to action.`;
      userPrompt = `Generate 5 SEO landing pages for a photographer with these details:
- Studio Name: ${studioName || "Photography Studio"}
- Location: ${location || "India"}
- Specialties: ${specialties || "Wedding, Candid, Portrait"}

For each page return a JSON array with objects containing:
- slug (URL-friendly, e.g., "wedding-photographer-kochi")
- title (SEO title, max 60 chars)
- meta_description (max 160 chars)
- heading (H1 tag)
- body_html (300-500 words of SEO content in HTML with h2, p, ul tags)
- keywords (array of 5-8 keywords)
- location (city/region targeted)

Focus on local SEO terms that wedding photographers need to rank for.`;
    } else if (type === "blog_post") {
      systemPrompt = `You are a professional wedding photography blogger. Write engaging, SEO-optimized blog posts about real wedding shoots. Use natural storytelling tone. Include relevant keywords naturally.`;
      const event = eventData || {};
      userPrompt = `Write a blog post for a completed photography shoot:
- Event: ${event.name || "Wedding"}
- Location: ${event.location || "India"}
- Type: ${event.event_type || "wedding"}
- Studio: ${studioName || "Photography Studio"}

Return a JSON object with:
- title (SEO-friendly blog title, max 60 chars)
- seo_title (optimized title tag)
- seo_description (meta description, max 160 chars)
- slug (URL-friendly)
- content (800-1200 words in HTML with h2, p tags, natural storytelling about the shoot)
- keywords (array of relevant keywords)

Write as if telling the story of the shoot. Include tips for couples planning similar events.`;
    } else if (type === "optimize") {
      systemPrompt = `You are an SEO optimization expert. Analyze and improve existing content for better search rankings.`;
      userPrompt = `Optimize this content for SEO:
Title: ${eventData?.title || ""}
Description: ${eventData?.description || ""}
Location: ${location || ""}
Studio: ${studioName || ""}

Return a JSON object with:
- improved_title (max 60 chars)
- improved_description (max 160 chars)
- suggested_keywords (array of 5-8 keywords)
- suggestions (array of 3-5 actionable improvement tips as strings)`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_seo_result",
              description: "Return the generated SEO content as structured data",
              parameters: {
                type: "object",
                properties: {
                  result: {
                    type: type === "seo_pages" ? "array" : "object",
                    description: "The generated content"
                  }
                },
                required: ["result"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_seo_result" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result;

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      result = parsed.result;
    } else {
      // Fallback: try parsing content directly
      const content = aiData.choices?.[0]?.message?.content || "{}";
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\[[\s\S]*\]/) || content.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch?.[1] || jsonMatch?.[0] || content);
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-seo-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
