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
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a pixel-precise reverse-engineer of Instagram-style design screenshots. You return a FULL reconstruction so a renderer can repaint the post identically: background, free-positioned photo cells (with rotation/overlap/z-order), text overlays, and watermark.

Return ALL values via the "full_layout" tool. NEVER skip freeCells — even for tight grids, return one freeCell per photo with its exact bounding box.

GOLDEN RULES — read carefully:
1. IGNORE Instagram UI chrome entirely: top status bar, username/avatar header, like/comment/share/bookmark icons, caption text below the image, carousel dots, nav bars. Reconstruct ONLY the visible POST canvas (the square / 4:5 / 9:16 image area).
2. SAMPLE COLORS FROM PIXELS — do not guess. For backgroundColor, sample the dominant color of the canvas BEHIND the photos (negative space / paper / matte). If the entire canvas is one wash (deep red, cream, charcoal, etc.), return that exact hex. If it is a gradient, set backgroundType="gradient" with from/to/angle.
3. POSITIONS ARE MEASURED, NOT GUESSED. For every photo: locate its top-left and bottom-right corners in canvas-relative % to ±2%. x,y = top-left; width,height = box size.
4. ROTATION: if a photo is tilted, measure the angle. Negative = counter-clockwise. Scrapbook tilts are commonly ±2° to ±12°. Use 0 only when truly upright.
5. OVERLAP & Z-ORDER: when photos overlap, the one ON TOP gets the higher zIndex. Number them 1 (bottom) upward in stacking order, not reading order.
6. opacity defaults 1. borderWidth in px at 375px canvas reference. borderColor hex (often #FFFFFF for polaroid frames).

CANVAS:
- canvasRatio: closest of "1:1" | "4:5" | "9:16" | "3:2" | "16:9".

FREE-POSITIONED CELLS — REQUIRED, one per visible photo:
- index = stacking order (1 = bottom).
- x, y = top-left % (0–100). width, height = % of canvas.
- rotation deg, scale (default 1), zIndex, opacity, borderWidth, borderColor.

ALSO return a fallback grid: cells as [rowStart,colStart,rowEnd,colEnd] (1-based, exclusive end), gridCols, gridRows. For non-grid scrapbook layouts use gridCols=1, gridRows=1, cells=[[1,1,2,2]] and rely on freeCells.

TEXT BLOCKS (overlay typography only — NOT text inside photos, NOT the Instagram caption below the post):
- x, y = CENTER of text in % of canvas.
- fontSize px @ 375 canvas. fontWeight 300/400/500/600/700.
- fontCategory: "serif" | "sans" | "script". color = sampled hex. opacity 0–1.
- letterSpacing px, lineHeight multiplier, alignment, textTransform, fontStyle, rotation, zIndex.

WATERMARK (optional): tiny handle / @username / url near a corner or edge of the post canvas. If present include {text, x, y, fontSize, color, opacity}.

If unsure between two values, choose the one that matches the visible pixels. Never invent defaults.`;

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
                { type: "text", text: "Analyze this screenshot. Measure the post canvas precisely. Ignore all Instagram UI chrome. Return the full reconstruction with one freeCell per visible photo." },
                { type: "image_url", image_url: { url: image } },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "full_layout",
                description: "Full reconstruction of an Instagram-style design.",
                parameters: {
                  type: "object",
                  properties: {
                    backgroundColor: { type: "string" },
                    backgroundType: { type: "string", enum: ["solid", "gradient"] },
                    backgroundGradient: {
                      type: "object",
                      properties: {
                        from: { type: "string" },
                        to: { type: "string" },
                        angle: { type: "number" },
                      },
                    },
                    canvasRatio: { type: "string" },
                    gridCols: { type: "integer" },
                    gridRows: { type: "integer" },
                    cells: {
                      type: "array",
                      description: "[rowStart,colStart,rowEnd,colEnd] 1-based, exclusive end",
                      items: { type: "array", items: { type: "integer" } },
                    },
                    freeCells: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          index: { type: "integer" },
                          x: { type: "number" },
                          y: { type: "number" },
                          width: { type: "number" },
                          height: { type: "number" },
                          rotation: { type: "number" },
                          scale: { type: "number" },
                          zIndex: { type: "integer" },
                          opacity: { type: "number" },
                          borderWidth: { type: "number" },
                          borderColor: { type: "string" },
                        },
                        required: ["index", "x", "y", "width", "height"],
                      },
                    },
                    textBlocks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          text: { type: "string" },
                          x: { type: "number" },
                          y: { type: "number" },
                          fontSize: { type: "number" },
                          fontWeight: { type: "integer" },
                          fontStyle: { type: "string", enum: ["normal", "italic"] },
                          fontCategory: { type: "string", enum: ["serif", "sans", "script"] },
                          color: { type: "string" },
                          opacity: { type: "number" },
                          letterSpacing: { type: "number" },
                          lineHeight: { type: "number" },
                          alignment: { type: "string", enum: ["left", "center", "right"] },
                          textTransform: { type: "string", enum: ["none", "uppercase", "lowercase"] },
                          rotation: { type: "number" },
                          zIndex: { type: "integer" },
                        },
                        required: ["text", "x", "y", "fontSize", "color"],
                      },
                    },
                    watermark: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        x: { type: "number" },
                        y: { type: "number" },
                        fontSize: { type: "number" },
                        color: { type: "string" },
                        opacity: { type: "number" },
                      },
                    },
                  },
                  required: ["backgroundColor", "canvasRatio", "gridCols", "gridRows", "cells"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "full_layout" } },
          temperature: 0.2,
          max_tokens: 4096,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    let result: any;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      const content = data.choices?.[0]?.message?.content || "";
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(cleaned);
    }

    const hasFreeCells = Array.isArray(result.freeCells) && result.freeCells.length > 0;
    const hasGrid = Array.isArray(result.cells) && result.cells.length > 0 && result.gridCols && result.gridRows;
    if (!hasFreeCells && !hasGrid) {
      throw new Error("Could not detect a valid layout. Try a clearer screenshot.");
    }

    // Synthesize a trivial grid fallback when only freeCells were returned
    if (!hasGrid) {
      result.gridCols = 1;
      result.gridRows = 1;
      result.cells = result.freeCells.map(() => [1, 1, 2, 2]);
    }

    const validatedCells = result.cells.map((cell: any[]) => {
      if (!Array.isArray(cell) || cell.length < 4) return [1, 1, 2, 2];
      return [
        Math.max(1, Math.round(cell[0])),
        Math.max(1, Math.round(cell[1])),
        Math.max(2, Math.round(cell[2])),
        Math.max(2, Math.round(cell[3])),
      ];
    });

    const ratioStr = typeof result.canvasRatio === "string" ? result.canvasRatio : "1:1";
    const ratioMap: Record<string, number> = {
      "1:1": 1, "4:5": 0.8, "9:16": 9 / 16, "3:2": 1.5, "16:9": 16 / 9, "3:4": 0.75,
    };
    const canvasRatio = ratioMap[ratioStr] ?? 1;

    return new Response(
      JSON.stringify({
        layout: {
          gridCols: Math.max(1, Math.round(result.gridCols)),
          gridRows: Math.max(1, Math.round(result.gridRows)),
          canvasRatio,
          canvasRatioLabel: ratioStr,
          cells: validatedCells,
        },
        backgroundColor: result.backgroundColor || "#FFFFFF",
        backgroundType: result.backgroundType || "solid",
        backgroundGradient: result.backgroundGradient || null,
        freeCells: Array.isArray(result.freeCells) ? result.freeCells : [],
        textBlocks: Array.isArray(result.textBlocks) ? result.textBlocks : [],
        watermark: result.watermark || null,
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
