import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// S3 signature helpers
async function hmacSHA256(key: ArrayBuffer, msg: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
}

async function sha256(data: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getSignatureKey(key: string, dateStamp: string, region: string, service: string) {
  let k = await hmacSHA256(new TextEncoder().encode("AWS4" + key).buffer as ArrayBuffer, dateStamp);
  k = await hmacSHA256(k, region);
  k = await hmacSHA256(k, service);
  k = await hmacSHA256(k, "aws4_request");
  return k;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub as string;

    // Parse multipart form
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const eventId = formData.get("event_id") as string | null;
    const fileName = formData.get("file_name") as string | null;

    if (!file || !eventId) {
      return new Response(JSON.stringify({ error: "file and event_id required" }), { status: 400, headers: corsHeaders });
    }

    // R2 credentials
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    if (!accessKeyId || !secretAccessKey) {
      return new Response(JSON.stringify({ error: "R2 credentials not configured" }), { status: 500, headers: corsHeaders });
    }

    const bucket = "mirrorai";
    const endpoint = "https://c399000257553435a17d6ff4037df813.r2.cloudflarestorage.com";
    const publicUrl = "https://pub-9a5aa3188af54a99aac7dc284996a4ee.r2.dev";
    const region = "auto";

    // Build object key
    const ext = (fileName || file.name || "photo.jpg").split(".").pop()?.toLowerCase() || "jpg";
    const objectKey = `${userId}/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Read file bytes
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const fileSize = fileBytes.length;

    // AWS Signature V4
    const now = new Date();
    const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z/, "Z");
    const dateStamp = amzDate.slice(0, 8);
    const contentType = file.type || `image/${ext === "jpg" ? "jpeg" : ext}`;
    const payloadHash = await sha256(fileBytes.buffer as ArrayBuffer);

    // Path-style: host is just the endpoint, path includes bucket
    const endpointHost = endpoint.replace("https://", "");
    const canonicalUri = `/${bucket}/${objectKey}`;

    const canonicalHeaders =
      `content-type:${contentType}\nhost:${endpointHost}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest = [
      "PUT",
      canonicalUri,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      await sha256(new TextEncoder().encode(canonicalRequest).buffer as ArrayBuffer),
    ].join("\n");

    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, "s3");
    const signatureBytes = await hmacSHA256(signingKey, stringToSign);
    const signature = [...new Uint8Array(signatureBytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

    const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Upload to R2 (path-style URL)
    const r2Url = `${endpoint}${canonicalUri}`;
    const r2Response = await fetch(r2Url, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
        Authorization: authorization,
      },
      body: fileBytes,
    });

    if (!r2Response.ok) {
      const errText = await r2Response.text();
      console.error("R2 upload failed:", r2Response.status, errText);
      return new Response(JSON.stringify({ error: `R2 upload failed: ${r2Response.status}` }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Build public URL
    const photoPublicUrl = `${publicUrl}/${objectKey}`;

    // Insert metadata into photos table
    const { data: photoRow, error: insertError } = await supabase
      .from("photos")
      .insert({
        event_id: eventId,
        user_id: userId,
        url: photoPublicUrl,
        file_name: fileName || file.name || objectKey.split("/").pop(),
        file_size: fileSize,
      } as any)
      .select("id, url")
      .single();

    if (insertError) {
      console.error("DB insert error:", insertError);
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, photo: photoRow }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("upload-to-r2 error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
