import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Try oEmbed approach first (works for public posts)
    const oembedUrl = `https://www.instagram.com/p/${url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/)?.[2]}/media/?size=l`;
    
    // Fetch the Instagram page to extract og:image
    const pageResp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html",
      },
    });

    if (!pageResp.ok) {
      throw new Error("Could not fetch Instagram page");
    }

    const html = await pageResp.text();
    
    // Extract og:image from meta tags
    const ogImageMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i) 
      || html.match(/content="([^"]+)"\s+(?:property|name)="og:image"/i);
    
    let imageUrl = ogImageMatch?.[1];
    
    if (!imageUrl) {
      // Try extracting from JSON-LD or other embedded data
      const jsonMatch = html.match(/"display_url"\s*:\s*"([^"]+)"/);
      imageUrl = jsonMatch?.[1]?.replace(/\\u0026/g, '&');
    }

    if (!imageUrl) {
      // Fallback: try the /media endpoint
      const mediaResp = await fetch(`https://www.instagram.com/p/${url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/)?.[2]}/media/?size=l`, {
        redirect: 'follow',
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        },
      });
      
      if (mediaResp.ok && mediaResp.headers.get('content-type')?.startsWith('image/')) {
        const imageBuffer = await mediaResp.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
        return new Response(JSON.stringify({ imageBase64: base64 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error("Could not find image in Instagram post. Try uploading a screenshot instead.");
    }

    // Fetch the actual image
    const imgResp = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!imgResp.ok) throw new Error("Could not download image");

    const imageBuffer = await imgResp.arrayBuffer();
    const uint8 = new Uint8Array(imageBuffer);
    
    // Convert to base64 in chunks to avoid stack overflow
    let base64 = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8.length; i += chunkSize) {
      base64 += String.fromCharCode(...uint8.slice(i, i + chunkSize));
    }
    base64 = btoa(base64);

    return new Response(JSON.stringify({ imageBase64: base64 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-instagram-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Failed to fetch Instagram image" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
