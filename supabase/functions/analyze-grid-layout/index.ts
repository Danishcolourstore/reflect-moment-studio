import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a layout analysis expert. You receive a cropped screenshot of a photo grid or design layout. Your job is to detect the grid structure and return it as a JSON layout definition.

IMPORTANT RULES:
- Analyze the visual grid structure — how many rows, columns, and how cells span.
- Each cell is defined as [rowStart, colStart, rowEnd, colEnd] using 1-based CSS grid positioning.
- rowEnd and colEnd are EXCLUSIVE (like CSS grid-row / grid-column).
- Cells can span multiple rows or columns for larger image areas.
- Ignore any text, icons, UI elements — focus ONLY on the image placement grid.
- The grid should use the minimum number of rows and columns needed to represent the layout.
- canvasRatio is width/height of the overall layout. Use 1 for square, values like 0.8 for portrait, 1.33 for landscape.

You MUST respond by calling the "grid_layout" tool with the detected layout.`;

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
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this screenshot and detect the photo grid layout. Return the grid structure with cells, gridCols, gridRows, and canvasRatio.",
                },
                {
                  type: "image_url",
                  image_url: { url: image },
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "grid_layout",
                description:
                  "Return the detected grid layout structure from the screenshot.",
                parameters: {
                  type: "object",
                  properties: {
                    gridCols: {
                      type: "integer",
                      description:
                        "Total number of CSS grid columns needed",
                    },
                    gridRows: {
                      type: "integer",
                      description:
                        "Total number of CSS grid rows needed",
                    },
                    canvasRatio: {
                      type: "number",
                      description:
                        "Width / height ratio of the overall canvas. 1 for square.",
                    },
                    cells: {
                      type: "array",
                      description:
                        "Array of cell definitions, each [rowStart, colStart, rowEnd, colEnd] (1-based, exclusive end)",
                      items: {
                        type: "array",
                        items: { type: "integer" },
                        minItems: 4,
                        maxItems: 4,
                      },
                    },
                  },
                  required: ["gridCols", "gridRows", "canvasRatio", "cells"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "grid_layout" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("AI did not return a structured layout");
    }

    const layout = JSON.parse(toolCall.function.arguments);

    // Validate
    if (
      !layout.cells ||
      !Array.isArray(layout.cells) ||
      layout.cells.length === 0 ||
      !layout.gridCols ||
      !layout.gridRows
    ) {
      throw new Error("Invalid layout detected");
    }

    return new Response(JSON.stringify({ layout }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-grid-layout error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
