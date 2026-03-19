import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Generate an AWS Signature V4 presigned URL for R2 PUT operations.
 * No external dependencies — pure crypto implementation.
 */

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key instanceof ArrayBuffer ? key : key.buffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
}

async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return toHex(hash);
}

async function getSignatureKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string
): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(new TextEncoder().encode("AWS4" + secretKey), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

function generatePresignedUrl(params: {
  endpoint: string;
  bucket: string;
  key: string;
  accessKeyId: string;
  secretAccessKey: string;
  contentType: string;
  expiresIn?: number;
}): Promise<string> {
  const { endpoint, bucket, key, accessKeyId, secretAccessKey, contentType, expiresIn = 600 } = params;

  const region = "auto";
  const service = "s3";
  const now = new Date();
  const dateStamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const shortDate = dateStamp.slice(0, 8);

  // Parse the endpoint to get the host
  const url = new URL(endpoint);
  const host = `${bucket}.${url.hostname}`;
  const path = `/${encodeURIComponent(key).replace(/%2F/g, "/")}`;

  const credential = `${accessKeyId}/${shortDate}/${region}/${service}/aws4_request`;
  const signedHeaders = "host";

  const queryParams = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": dateStamp,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": signedHeaders,
  });
  // Sort query params
  queryParams.sort();

  return (async () => {
    const canonicalRequest = [
      "PUT",
      path,
      queryParams.toString(),
      `host:${host}\n`,
      signedHeaders,
      "UNSIGNED-PAYLOAD",
    ].join("\n");

    const canonicalRequestHash = await sha256Hex(canonicalRequest);

    const stringToSign = [
      "AWS4-HMAC-SHA256",
      dateStamp,
      `${shortDate}/${region}/${service}/aws4_request`,
      canonicalRequestHash,
    ].join("\n");

    const signingKey = await getSignatureKey(secretAccessKey, shortDate, region, service);
    const signatureBuf = await hmacSha256(signingKey, stringToSign);
    const signature = toHex(signatureBuf);

    queryParams.set("X-Amz-Signature", signature);

    return `https://${host}${path}?${queryParams.toString()}`;
  })();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { fileName, contentType, eventId } = await req.json();
    if (!fileName || !contentType || !eventId) {
      return new Response(JSON.stringify({ error: "Missing fileName, contentType, or eventId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT")!;
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!;
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
    const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL")!;

    const ext = fileName.split(".").pop() || "jpg";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const key = `${userId}/${eventId}/${uniqueName}`;

    const presignedUrl = await generatePresignedUrl({
      endpoint: R2_ENDPOINT,
      bucket: "mirrorai-photos",
      key,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      contentType,
      expiresIn: 600,
    });

    const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;

    return new Response(
      JSON.stringify({ presignedUrl, publicUrl, key }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
