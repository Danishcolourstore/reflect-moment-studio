import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Extract shortcode from an Instagram URL.
 */
function extractShortcode(url: string): string | null {
  const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match?.[2] ?? null;
}

/**
 * Fetch image via Instagram oEmbed API (most reliable, public endpoint).
 */
async function tryOEmbed(shortcode: string): Promise<string | null> {
  try {
    const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=https://www.instagram.com/p/${shortcode}/&access_token=`;
    // Try without token — sometimes works for public posts
    const resp = await fetch(`https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
      },
    });
    if (resp.ok) {
      const text = await resp.text();
      // Try to find image URL in the response
      const imgMatch = text.match(/"display_url"\s*:\s*"([^"]+)"/) 
        || text.match(/"image_versions2".*?"url"\s*:\s*"([^"]+)"/);
      if (imgMatch) {
        return imgMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
      }
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Try the /media/ redirect endpoint.
 */
async function tryMediaEndpoint(shortcode: string): Promise<ArrayBuffer | null> {
  try {
    const resp = await fetch(`https://www.instagram.com/p/${shortcode}/media/?size=l`, {
      redirect: 'follow',
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (resp.ok && resp.headers.get('content-type')?.startsWith('image/')) {
      return await resp.arrayBuffer();
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Try scraping og:image from the page HTML.
 */
async function tryOgImage(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    
    // Try og:image
    const ogMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i) 
      || html.match(/content="([^"]+)"\s+(?:property|name)="og:image"/i);
    if (ogMatch?.[1]) return ogMatch[1];
    
    // Try display_url in embedded JSON
    const jsonMatch = html.match(/"display_url"\s*:\s*"([^"]+)"/);
    if (jsonMatch?.[1]) return jsonMatch[1].replace(/\\u0026/g, '&');
    
    // Try thumbnail_src
    const thumbMatch = html.match(/"thumbnail_src"\s*:\s*"([^"]+)"/);
    if (thumbMatch?.[1]) return thumbMatch[1].replace(/\\u0026/g, '&');
  } catch { /* ignore */ }
  return null;
}

/**
 * Convert ArrayBuffer to base64 in chunks (avoids stack overflow).
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8 = new Uint8Array(buffer);
  let base64 = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    base64 += String.fromCharCode(...uint8.slice(i, i + chunkSize));
  }
  return btoa(base64);
}

/**
 * Download image URL and return base64.
 */
async function downloadImage(imageUrl: string): Promise<string> {
  const resp = await fetch(imageUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
  if (!resp.ok) throw new Error("Could not download image");
  return arrayBufferToBase64(await resp.arrayBuffer());
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url || !/instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/i.test(url)) {
      return new Response(JSON.stringify({ error: "Invalid Instagram URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const shortcode = extractShortcode(url);
    if (!shortcode) {
      return new Response(JSON.stringify({ error: "Could not extract post ID from URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[fetch-instagram-image] Processing shortcode: ${shortcode}`);

    // Strategy 1: Try /media/ endpoint (fastest, most reliable for public posts)
    console.log("[fetch-instagram-image] Trying /media/ endpoint...");
    const mediaBuffer = await tryMediaEndpoint(shortcode);
    if (mediaBuffer && mediaBuffer.byteLength > 1000) {
      console.log(`[fetch-instagram-image] /media/ succeeded: ${mediaBuffer.byteLength} bytes`);
      return new Response(JSON.stringify({ imageBase64: arrayBufferToBase64(mediaBuffer) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strategy 2: Try og:image scraping
    console.log("[fetch-instagram-image] Trying og:image scraping...");
    const ogImageUrl = await tryOgImage(url);
    if (ogImageUrl) {
      console.log(`[fetch-instagram-image] og:image found, downloading...`);
      try {
        const base64 = await downloadImage(ogImageUrl);
        return new Response(JSON.stringify({ imageBase64: base64 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        console.error("[fetch-instagram-image] og:image download failed:", e);
      }
    }

    // Strategy 3: Try JSON API endpoint  
    console.log("[fetch-instagram-image] Trying JSON API...");
    const apiImageUrl = await tryOEmbed(shortcode);
    if (apiImageUrl) {
      console.log(`[fetch-instagram-image] API image found, downloading...`);
      try {
        const base64 = await downloadImage(apiImageUrl);
        return new Response(JSON.stringify({ imageBase64: base64 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        console.error("[fetch-instagram-image] API image download failed:", e);
      }
    }

    // All strategies failed
    console.error("[fetch-instagram-image] All strategies failed for:", shortcode);
    return new Response(
      JSON.stringify({ 
        error: "Instagram is blocking this request. Please take a screenshot of the post and upload it instead — it works just as well!" 
      }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("fetch-instagram-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Failed to fetch Instagram image. Try uploading a screenshot instead." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
