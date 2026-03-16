import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const photographerId = user.id;
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // 1. Get all clients for this photographer
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, email, phone, created_at")
      .eq("photographer_id", photographerId);

    if (!clients?.length) {
      return new Response(JSON.stringify({ generated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientIds = clients.map((c: any) => c.id);
    let generated = 0;

    // 2. Get milestones coming up in next 7 days
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 7);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    const { data: milestones } = await supabase
      .from("client_milestones")
      .select("*")
      .eq("photographer_id", photographerId);

    // Check recurring milestones (anniversary pattern - same month/day)
    for (const m of (milestones || [])) {
      const mDate = new Date(m.milestone_date);
      const thisYearDate = new Date(today.getFullYear(), mDate.getMonth(), mDate.getDate());
      const daysUntil = Math.floor((thisYearDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil >= 0 && daysUntil <= 7) {
        // Check if reminder already exists for this year
        const yearStart = `${today.getFullYear()}-01-01`;
        const yearEnd = `${today.getFullYear()}-12-31`;
        const { count } = await supabase
          .from("client_reminders")
          .select("*", { count: "exact", head: true })
          .eq("milestone_id", m.id)
          .gte("due_date", yearStart)
          .lte("due_date", yearEnd);

        if (!count || count === 0) {
          const client = clients.find((c: any) => c.id === m.client_id);
          await supabase.from("client_reminders").insert({
            photographer_id: photographerId,
            client_id: m.client_id,
            milestone_id: m.id,
            reminder_type: m.milestone_type,
            title: `${m.milestone_type === 'anniversary' ? '💍' : '🎂'} ${m.title}`,
            message: `${client?.name || 'Client'} - ${m.title} is on ${thisYearDate.toLocaleDateString()}`,
            due_date: thisYearDate.toISOString().split("T")[0],
            status: "pending",
            action_type: "whatsapp",
            action_data: { client_name: client?.name, phone: client?.phone, milestone_type: m.milestone_type },
          });
          generated++;
        }
      }
    }

    // 3. Check for inactive clients (no activity 180+ days)
    const { data: clientEvents } = await supabase
      .from("client_events")
      .select("client_id, event_id")
      .in("client_id", clientIds);

    const { data: clientFavs } = await supabase
      .from("client_favorites")
      .select("client_id, created_at")
      .in("client_id", clientIds);

    const { data: clientDls } = await supabase
      .from("client_downloads")
      .select("client_id, downloaded_at")
      .in("client_id", clientIds);

    for (const client of clients) {
      const lastFav = (clientFavs || [])
        .filter((f: any) => f.client_id === client.id)
        .map((f: any) => new Date(f.created_at).getTime())
        .sort()
        .reverse()[0];
      const lastDl = (clientDls || [])
        .filter((d: any) => d.client_id === client.id)
        .map((d: any) => new Date(d.downloaded_at).getTime())
        .sort()
        .reverse()[0];

      const lastActivity = Math.max(lastFav || 0, lastDl || 0, new Date(client.created_at).getTime());
      const daysSince = Math.floor((today.getTime() - lastActivity) / (1000 * 60 * 60 * 24));

      if (daysSince >= 180) {
        // Check if inactive reminder already exists recently
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { count } = await supabase
          .from("client_reminders")
          .select("*", { count: "exact", head: true })
          .eq("client_id", client.id)
          .eq("reminder_type", "reactivation")
          .gte("created_at", thirtyDaysAgo.toISOString());

        if (!count || count === 0) {
          await supabase.from("client_reminders").insert({
            photographer_id: photographerId,
            client_id: client.id,
            reminder_type: "reactivation",
            title: `🔄 Reconnect with ${client.name}`,
            message: `Haven't connected in ${daysSince} days — send a message?`,
            due_date: todayStr,
            status: "pending",
            action_type: "whatsapp",
            action_data: { client_name: client.name, phone: client.phone, days_inactive: daysSince },
          });
          generated++;
        }
      }
    }

    // 4. Generate follow-up reminders from rules
    const { data: rules } = await supabase
      .from("follow_up_rules")
      .select("*")
      .eq("photographer_id", photographerId)
      .eq("is_active", true);

    for (const rule of (rules || [])) {
      if (rule.rule_type === "gallery_reminder") {
        // Check events created X days ago with no views
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() - rule.trigger_days);
        const targetStr = targetDate.toISOString().split("T")[0];

        const { data: recentEvents } = await supabase
          .from("events")
          .select("id, name, created_at, views")
          .eq("user_id", photographerId)
          .lte("created_at", targetDate.toISOString())
          .gte("created_at", new Date(targetDate.getTime() - 86400000).toISOString());

        for (const evt of (recentEvents || [])) {
          if (evt.views === 0) {
            const eventClients = (clientEvents || [])
              .filter((ce: any) => ce.event_id === evt.id)
              .map((ce: any) => clients.find((c: any) => c.id === ce.client_id))
              .filter(Boolean);

            for (const client of eventClients) {
              await supabase.from("client_reminders").insert({
                photographer_id: photographerId,
                client_id: client.id,
                reminder_type: "gallery_reminder",
                title: `📸 ${client.name} hasn't opened gallery`,
                message: `Gallery "${evt.name}" hasn't been viewed yet — send a reminder?`,
                due_date: todayStr,
                status: "pending",
                action_type: "whatsapp",
                action_data: { client_name: client.name, phone: client.phone, event_name: evt.name },
              });
              generated++;
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ generated, message: `Generated ${generated} reminders` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-reminders error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
