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

    const systemPrompt = `You are an expert at analyzing Instagram post screenshots to extract grid layouts and design typography. You receive a cropped screenshot and must return BOTH the grid structure AND all overlay text as structured JSON.

GRID DETECTION:
- Detect grid rows, columns, and how cells span using 1-based CSS grid coordinates.
- Each cell: [rowStart, colStart, rowEnd, colEnd] with exclusive end values.
- Use minimum rows/columns needed. Ignore social media UI chrome.
- canvasRatio = width/height (1 for square, 0.8 portrait, 1.33 landscape).

TEXT DETECTION — ONLY DESIGN OVERLAY TEXT:
Detect ONLY text that is deliberately overlaid on the design as typography (titles, dates, locations, names, quotes, captions, watermarks). Do NOT detect text that is part of photographed scenes (signs, clothing, products, license plates).

CRITICAL POSITIONING RULES — READ CAREFULLY:
- x and y represent the CENTER POINT of the text block as a percentage (0-100) of the CROPPED AREA dimensions.
- x=50 means horizontally centered. x=15 means near the left edge. x=85 means near the right edge.
- y=10 means near the top. y=50 means vertically centered. y=90 means near the bottom.
- Measure positions PRECISELY by estimating pixel positions relative to the total canvas dimensions.
- For centered text spanning the full width, x should be 50.
- For text near margins/edges, use values like 10-20 or 80-90.
- Multiple lines of text at the same position should be returned as ONE text block with newlines.

FONT ANALYSIS — BE PRECISE:
- fontGroup: "serif" for fonts with serifs (Times, Garamond, Playfair, Bodoni style), "sans" for clean geometric fonts (Helvetica, Montserrat, Inter style), "script" for cursive/handwritten fonts.
- fontWeight: Use 300 for thin/light, 400 for regular, 500 for medium, 600 for semibold, 700 for bold. Match the visual thickness precisely.
- fontSize: Size in px assuming a 440px wide canvas. Measure the actual cap height and convert:
  - Very small labels/dates: 9-12px
  - Small subtitles: 13-16px  
  - Body text: 17-22px
  - Subheadings: 23-30px
  - Main titles: 31-42px
  - Large hero text: 43-56px
- letterSpacing: 0 for normal, 1-3 for slightly spaced, 4-8 for heavily spaced uppercase, 10+ for very wide tracking.
- color: Exact hex color. "#ffffff" for white, "#000000" for black, etc. Sample the actual text color.
- textTransform: "uppercase" if ALL CAPS, "lowercase" if all lowercase, "none" for mixed case.
- hasShadow: true ONLY if text has a visible drop shadow or glow effect for readability.

IMPORTANT: Return the EXACT text content as it appears — preserve casing, punctuation, special characters (•, &, etc.), and line breaks.

If NO design typography is found, return an empty textBlocks array.

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
                  text: "Analyze this screenshot. Detect the photo grid layout AND all design typography overlays. Return precise positions (x,y as center-point percentage), exact text content, accurate font classification, and full styling. Be precise with fontSize relative to 440px canvas width.",
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
          temperature: 0.2,
          max_tokens: 4096,
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
    
    // Handle both tool_calls and regular content responses
    let result: any;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse from content (some models return JSON in content)
      const content = data.choices?.[0]?.message?.content || "";
      console.log("No tool_calls found, trying content parse. Content:", content.substring(0, 200));
      
      try {
        const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        result = JSON.parse(cleaned);
      } catch {
        // Try extracting JSON object from content
        const jsonMatch = content.match(/\{[\s\S]*"cells"[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("AI did not return a valid grid layout. Please try again.");
        }
      }
    }

    // Validate grid
    if (
      !result.cells ||
      !Array.isArray(result.cells) ||
      result.cells.length === 0 ||
      !result.gridCols ||
      !result.gridRows
    ) {
      throw new Error("Could not detect a valid grid layout. Try a clearer screenshot.");
    }

    // Validate and fix cells — ensure all values are integers and within bounds
    const validatedCells = result.cells.map((cell: any[]) => {
      if (!Array.isArray(cell) || cell.length < 4) return [1, 1, 2, 2];
      return [
        Math.max(1, Math.round(cell[0])),
        Math.max(1, Math.round(cell[1])),
        Math.max(2, Math.round(cell[2])),
        Math.max(2, Math.round(cell[3])),
      ];
    });

    // Ensure textBlocks is always an array
    if (!result.textBlocks || !Array.isArray(result.textBlocks)) {
      result.textBlocks = [];
    }

    // Validate canvas ratio
    const canvasRatio = typeof result.canvasRatio === 'number' && result.canvasRatio > 0.1 && result.canvasRatio < 10
      ? result.canvasRatio
      : 1;

    return new Response(
      JSON.stringify({
        layout: {
          gridCols: Math.max(1, Math.round(result.gridCols)),
          gridRows: Math.max(1, Math.round(result.gridRows)),
          canvasRatio,
          cells: validatedCells,
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
