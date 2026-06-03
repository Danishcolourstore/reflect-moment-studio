/**
 * Vercel cron handler — invokes sneak-peek-scheduler every 15 minutes.
 * Set CRON_SECRET in Vercel env; Vercel sends Authorization: Bearer <CRON_SECRET>.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Missing Supabase configuration" });
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/sneak-peek-scheduler`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json(payload);
    }

    return res.status(200).json(payload);
  } catch (err: any) {
    console.error("sneak-peek-cron error:", err);
    return res.status(500).json({ error: err?.message || "Cron failed" });
  }
}
