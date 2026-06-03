// Hardened R2 presigned URL issuer.
// - Verifies JWT via Supabase getClaims (signing-keys / JWKS).
// - Derives user_id from the token. Body cannot influence ownership.
// - Verifies event_id belongs to the authenticated user.
// - Allowlists file extension. Caps upload to 50MB via signed Content-Length.
// - Builds the R2 object key server-side. Client cannot influence the path.
// - Returns { url, public_url, storage_path }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ---------- AWS SigV4 helpers ----------
function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const keyData = key instanceof ArrayBuffer ? key : key.slice().buffer;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
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
  service: string,
): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(new TextEncoder().encode("AWS4" + secretKey), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB
const PRESIGN_TTL_SECONDS = 15 * 60; // 15 minutes

async function generatePresignedPutUrl(params: {
  endpoint: string;
  bucket: string;
  key: string;
  accessKeyId: string;
  secretAccessKey: string;
  maxBytes: number;
  expiresIn: number;
}): Promise<string> {
  const { endpoint, bucket, key, accessKeyId, secretAccessKey, maxBytes, expiresIn } = params;

  const region = "auto";
  const service = "s3";
  const now = new Date();
  const dateStamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const shortDate = dateStamp.slice(0, 8);

  const url = new URL(endpoint);
  const host = `${bucket}.${url.hostname}`;
  const path = `/${encodeURIComponent(key).replace(/%2F/g, "/")}`;

  const credential = `${accessKeyId}/${shortDate}/${region}/${service}/aws4_request`;
  // Sign host AND content-length so the upload is bound to a max size.
  const signedHeaders = "content-length;host";

  const queryParams = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": dateStamp,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": signedHeaders,
  });
  queryParams.sort();

  const canonicalRequest = [
    "PUT",
    path,
    queryParams.toString(),
    `content-length:${maxBytes}\nhost:${host}\n`,
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
}

// ---------- Validation ----------
const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "webp", "heic"]);

function normalizeExt(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const ext = raw.toLowerCase().replace(/^\./, "").trim();
  if (!ALLOWED_EXTS.has(ext)) return null;
  return ext;
}

function isUuid(v: unknown): v is string {
  return typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

// URL-safe nanoid-style ID
function nanoid(len = 10): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

// ---------- Handler ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    // 1) Auth — JWT only, never trust body for identity.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // 2) Parse + validate body. Only event_id and ext are accepted.
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const eventId = body.event_id ?? body.eventId;
    if (!isUuid(eventId)) {
      return json({ error: "event_id must be a valid UUID" }, 400);
    }

    const ext = normalizeExt(body.ext ?? body.extension);
    if (!ext) {
      return json(
        { error: "ext must be one of: jpg, jpeg, png, webp, heic" },
        400,
      );
    }

    // 3) Verify event ownership using service role (bypasses RLS, scoped query).
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: ownedEvent, error: ownErr } = await admin
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (ownErr) {
      console.error("Event ownership lookup failed:", ownErr);
      return json({ error: "Server error" }, 500);
    }
    if (!ownedEvent) {
      return json({ error: "Forbidden" }, 403);
    }

    // 4) Build storage path server-side. Client cannot influence it.
    const storagePath = `${userId}/${eventId}/${Date.now()}-${nanoid(10)}.${ext}`;

    // 5) Sign the PUT URL with size cap + 15min TTL.
    const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT");
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL");

    if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_URL) {
      console.error("Missing R2 environment configuration");
      return json({ error: "Storage not configured" }, 500);
    }

    const url = await generatePresignedPutUrl({
      endpoint: R2_ENDPOINT,
      bucket: "mirrorai-photos",
      key: storagePath,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      maxBytes: MAX_UPLOAD_BYTES,
      expiresIn: PRESIGN_TTL_SECONDS,
    });

    const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${storagePath}`;

    return json({
      url,
      public_url: publicUrl,
      storage_path: storagePath,
      max_bytes: MAX_UPLOAD_BYTES,
      expires_in: PRESIGN_TTL_SECONDS,
      required_headers: {
        "Content-Length": String(MAX_UPLOAD_BYTES),
      },
    });
  } catch (err) {
    console.error("get-r2-presigned-url error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
