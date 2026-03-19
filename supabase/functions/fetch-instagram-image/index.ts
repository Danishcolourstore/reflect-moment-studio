import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractShortcode(url: string): string | null {
  const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match?.[2] ?? null;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8 = new Uint8Array(buffer);
  let base64 = "";
  const chunkSize = 8192;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    base64 += String.fromCharCode(...uint8.slice(i, i + chunkSize));
  }
  return btoa(base64);
}

async function downloadImageToBase64(imageUrl: string): Promise<string | null> {
  try {
    const resp = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });
    if (!resp.ok || !resp.headers.get("content-type")?.startsWith("image/")) return null;
    const buf = await resp.arrayBuffer();
    if (buf.byteLength < 1000) return null;
    return arrayBufferToBase64(buf);
  } catch { return null; }
}

// Strategy 1: Try JSON API to get ALL carousel slides
async function tryJsonApi(shortcode: string): Promise<string[]> {
  try {
    const resp = await fetch(`https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
      },
    });
    if (!resp.ok) return [];
    const text = await resp.text();
    
    const urls: string[] = [];
    
    // Try to find carousel edges (edge_sidecar_to_children)
    const carouselMatch = text.match(/"edge_sidecar_to_children"\s*:\s*\{[^}]*"edges"\s*:\s*(\[[^\]]*\])/);
    if (carouselMatch) {
      const edgesStr = carouselMatch[1];
      const displayUrls = [...edgesStr.matchAll(/"display_url"\s*:\s*"([^"]+)"/g)];
      for (const m of displayUrls) {
        urls.push(m[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/"));
      }
    }
    
    // If no carousel found, try single display_url
    if (urls.length === 0) {
      const singleMatch = text.match(/"display_url"\s*:\s*"([^"]+)"/);
      if (singleMatch) {
        urls.push(singleMatch[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/"));
      }
    }
    
    return urls;
  } catch { return []; }
}

// Strategy 2: Try og:image scraping (gets only first image)
async function tryOgImage(url: string): Promise<string[]> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!resp.ok) return [];
    const html = await resp.text();
    
    const urls: string[] = [];
    
    // Try all display_url matches (could be multiple in embedded JSON)
    const allDisplayUrls = [...html.matchAll(/"display_url"\s*:\s*"([^"]+)"/g)];
    for (const m of allDisplayUrls) {
      const cleaned = m[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
      if (!urls.includes(cleaned)) urls.push(cleaned);
    }
    
    // Fallback to og:image
    if (urls.length === 0) {
      const ogMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i)
        || html.match(/content="([^"]+)"\s+(?:property|name)="og:image"/i);
      if (ogMatch?.[1]) urls.push(ogMatch[1]);
    }
    
    return urls;
  } catch { return []; }
}

// Strategy 3: Try /media/ endpoint (single image only)
async function tryMediaEndpoint(shortcode: string): Promise<string | null> {
  try {
    const resp = await fetch(`https://www.instagram.com/p/${shortcode}/media/?size=l`, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    if (resp.ok && resp.headers.get("content-type")?.startsWith("image/")) {
      const buf = await resp.arrayBuffer();
      if (buf.byteLength > 1000) return arrayBufferToBase64(buf);
    }
  } catch {}
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url || !/instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/i.test(url)) {
      return new Response(JSON.stringify({ error: "Invalid Instagram URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const shortcode = extractShortcode(url);
    if (!shortcode) {
      return new Response(JSON.stringify({ error: "Could not extract post ID" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strategy 1: JSON API — best chance of getting all carousel slides
    let imageUrls = await tryJsonApi(shortcode);

    // Strategy 2: OG scraping
    if (imageUrls.length === 0) {
      imageUrls = await tryOgImage(url);
    }

    // Download all found images to base64
    const images: Array<{ index: number; base64: string }> = [];
    for (let i = 0; i < Math.min(imageUrls.length, 20); i++) {
      const b64 = await downloadImageToBase64(imageUrls[i]);
      if (b64) images.push({ index: i, base64: b64 });
    }

    // Strategy 3: /media/ fallback (only gets first image)
    if (images.length === 0) {
      const singleBase64 = await tryMediaEndpoint(shortcode);
      if (singleBase64) images.push({ index: 0, base64: singleBase64 });
    }

    if (images.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Instagram blocked this request. Take screenshots of each slide and upload them instead — works perfectly!",
          slideCount: 0,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return all images + backward-compatible imageBase64 for single image
    return new Response(
      JSON.stringify({
        imageBase64: images[0].base64,
        images: images.map(img => img.base64),
        slideCount: images.length,
        isCarousel: images.length > 1,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Failed to fetch. Upload screenshots instead." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
