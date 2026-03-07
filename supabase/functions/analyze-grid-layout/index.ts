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

    const systemPrompt = `You are a layout and typography analysis expert specializing in Instagram post design. You receive a cropped screenshot of a photo grid or design layout. Your job is to detect BOTH the grid structure AND any DESIGN typography elements, returning them as structured JSON.

GRID DETECTION RULES:
- Analyze the visual grid structure — how many rows, columns, and how cells span.
- Each cell is defined as [rowStart, colStart, rowEnd, colEnd] using 1-based CSS grid positioning.
- rowEnd and colEnd are EXCLUSIVE (like CSS grid-row / grid-column).
- Cells can span multiple rows or columns for larger image areas.
- Ignore social media UI elements (usernames, icons, nav bars) — focus on the design content.
- The grid should use the minimum number of rows and columns needed to represent the layout.
- canvasRatio is width/height of the overall layout. Use 1 for square, values like 0.8 for portrait, 1.33 for landscape.

TEXT/TYPOGRAPHY DETECTION — CRITICAL DISTINCTION:
You MUST only detect text that is part of the DESIGN OVERLAY — typography intentionally placed on top of images as part of the graphic design composition.

✅ DETECT these (design typography):
- Titles, headings, and subheadings overlaid on the design
- Date text, location text, event names placed as design elements
- Quotes, captions, or taglines that are part of the layout composition
- Watermarks or branding text added by the designer
- Any text with consistent styling that appears to be a deliberate design layer (often with shadows, outlines, or contrasting color against the background)

❌ DO NOT DETECT these (in-photo / environmental text):
- Text on signs, billboards, or street boards visible in photographs
- Text on clothing, products, packaging, or labels within photos
- Store names, license plates, or any text that is part of the photographed scene
- Watermarks from stock photo services embedded in the photo itself
- Any text that is part of the physical world captured by the camera
- Social media UI chrome (usernames, like counts, timestamps, navigation)

HOW TO DISTINGUISH: Design typography is typically:
1. Overlaid on top of images with consistent font styling across the layout
2. Uses clean, professional fonts (serif, sans-serif, or script) with deliberate sizing
3. Has uniform color, often with shadow/outline for readability over photos
4. Positioned deliberately in margins, borders, or framing areas of the design
5. Relates to the design's message (event name, date, couple names, location)

In-photo text is typically:
1. Part of the 3D scene — follows perspective, lighting, and camera angle
2. Has irregular styling dictated by the physical object it's on
3. Appears at various angles and depths within the photograph
4. Is incidental to the design's purpose

For each DESIGN text block detected, analyze and return:
  - text: the exact text content
  - fontGroup: classify as "serif", "sans", or "script" based on visual appearance
  - fontWeight: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
  - fontSize: approximate size in px relative to a 440px wide canvas (range 8-48)
  - color: hex color string (e.g. "#ffffff")
  - letterSpacing: approximate in px (0 normal, 2-8 for spaced uppercase)
  - lineHeight: multiplier (1.0-2.0)
  - alignment: "left", "center", or "right"
  - textTransform: "none", "uppercase", or "lowercase"
  - fontStyle: "normal" or "italic"
  - x: horizontal position as % of canvas width (0-100)
  - y: vertical position as % of canvas height (0-100)
  - hasShadow: true if text has visible drop shadow or glow

If NO design typography is found, return an empty textBlocks array. Do NOT force text detection.

You MUST respond by calling the "grid_layout_with_text" tool.`;

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
                  text: "Analyze this screenshot. Detect the photo grid layout structure AND all typography/text elements. Return both the grid cells and text blocks with full styling details.",
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
                name: "grid_layout_with_text",
                description:
                  "Return the detected grid layout structure and text elements from the screenshot.",
                parameters: {
                  type: "object",
                  properties: {
                    gridCols: {
                      type: "integer",
                      description: "Total number of CSS grid columns needed",
                    },
                    gridRows: {
                      type: "integer",
                      description: "Total number of CSS grid rows needed",
                    },
                    canvasRatio: {
                      type: "number",
                      description: "Width / height ratio of the overall canvas. 1 for square.",
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
                    textBlocks: {
                      type: "array",
                      description: "Array of detected text blocks with typography styling",
                      items: {
                        type: "object",
                        properties: {
                          text: { type: "string", description: "The exact text content" },
                          fontGroup: {
                            type: "string",
                            enum: ["serif", "sans", "script"],
                            description: "Font classification",
                          },
                          fontWeight: {
                            type: "integer",
                            description: "Font weight (300, 400, 500, 600, 700)",
                          },
                          fontSize: {
                            type: "number",
                            description: "Font size in px relative to 440px canvas width",
                          },
                          color: { type: "string", description: "Hex color string" },
                          letterSpacing: {
                            type: "number",
                            description: "Letter spacing in px",
                          },
                          lineHeight: {
                            type: "number",
                            description: "Line height multiplier",
                          },
                          alignment: {
                            type: "string",
                            enum: ["left", "center", "right"],
                          },
                          textTransform: {
                            type: "string",
                            enum: ["none", "uppercase", "lowercase"],
                          },
                          fontStyle: {
                            type: "string",
                            enum: ["normal", "italic"],
                          },
                          x: {
                            type: "number",
                            description: "Horizontal position as % of canvas (0-100)",
                          },
                          y: {
                            type: "number",
                            description: "Vertical position as % of canvas (0-100)",
                          },
                          hasShadow: { type: "boolean" },
                        },
                        required: [
                          "text", "fontGroup", "fontWeight", "fontSize", "color",
                          "letterSpacing", "lineHeight", "alignment", "textTransform",
                          "fontStyle", "x", "y", "hasShadow",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["gridCols", "gridRows", "canvasRatio", "cells", "textBlocks"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "grid_layout_with_text" },
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

    const result = JSON.parse(toolCall.function.arguments);

    // Validate grid
    if (
      !result.cells ||
      !Array.isArray(result.cells) ||
      result.cells.length === 0 ||
      !result.gridCols ||
      !result.gridRows
    ) {
      throw new Error("Invalid layout detected");
    }

    // Ensure textBlocks is always an array
    if (!result.textBlocks || !Array.isArray(result.textBlocks)) {
      result.textBlocks = [];
    }

    return new Response(
      JSON.stringify({
        layout: {
          gridCols: result.gridCols,
          gridRows: result.gridRows,
          canvasRatio: result.canvasRatio,
          cells: result.cells,
        },
        textBlocks: result.textBlocks,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-grid-layout error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
