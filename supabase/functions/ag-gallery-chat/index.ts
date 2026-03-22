import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOLS = [
  { type: "function", function: { name: "list_photographers", description: "List all featured photographers", parameters: { type: "object", properties: {}, required: [] } } },
  { type: "function", function: { name: "add_photographer", description: "Add a new featured photographer", parameters: { type: "object", properties: { name: { type: "string" }, location: { type: "string" }, bio: { type: "string" }, website: { type: "string" }, status: { type: "string", enum: ["active", "draft"] } }, required: ["name"] } } },
  { type: "function", function: { name: "update_photographer", description: "Update a photographer by ID", parameters: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, location: { type: "string" }, bio: { type: "string" }, website: { type: "string" }, status: { type: "string", enum: ["active", "draft"] } }, required: ["id"] } } },
  { type: "function", function: { name: "delete_photographer", description: "Delete a photographer by ID", parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } } },
  { type: "function", function: { name: "list_stories", description: "List all wedding stories", parameters: { type: "object", properties: {}, required: [] } } },
  { type: "function", function: { name: "add_story", description: "Add a new wedding story", parameters: { type: "object", properties: { couple: { type: "string" }, location: { type: "string" }, story_date: { type: "string" }, snippet: { type: "string" }, cover_url: { type: "string" }, status: { type: "string", enum: ["active", "draft"] } }, required: ["couple"] } } },
  { type: "function", function: { name: "update_story", description: "Update a story by ID", parameters: { type: "object", properties: { id: { type: "string" }, couple: { type: "string" }, location: { type: "string" }, story_date: { type: "string" }, snippet: { type: "string" }, status: { type: "string", enum: ["active", "draft"] } }, required: ["id"] } } },
  { type: "function", function: { name: "delete_story", description: "Delete a story by ID", parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } } },
  { type: "function", function: { name: "list_education", description: "List all education tutorials", parameters: { type: "object", properties: {}, required: [] } } },
  { type: "function", function: { name: "add_tutorial", description: "Add a new tutorial", parameters: { type: "object", properties: { title: { type: "string" }, author: { type: "string" }, description: { type: "string" }, duration: { type: "string" }, tag: { type: "string" }, url: { type: "string" }, status: { type: "string", enum: ["active", "draft"] } }, required: ["title"] } } },
  { type: "function", function: { name: "delete_tutorial", description: "Delete a tutorial by ID", parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } } },
  { type: "function", function: { name: "list_discover", description: "List all discover profiles", parameters: { type: "object", properties: {}, required: [] } } },
  { type: "function", function: { name: "add_discover_profile", description: "Add a discover profile", parameters: { type: "object", properties: { name: { type: "string" }, location: { type: "string" }, profile_link: { type: "string" } }, required: ["name"] } } },
  { type: "function", function: { name: "delete_discover_profile", description: "Delete a discover profile by ID", parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } } },
  { type: "function", function: { name: "get_settings", description: "Get Art Gallery settings", parameters: { type: "object", properties: {}, required: [] } } },
  { type: "function", function: { name: "update_settings", description: "Update Art Gallery settings (name, tagline, heroText, showEducation, showNews, showDiscover)", parameters: { type: "object", properties: { name: { type: "string" }, tagline: { type: "string" }, heroText: { type: "string" }, showEducation: { type: "boolean" }, showNews: { type: "boolean" }, showDiscover: { type: "boolean" } } } } },
  // Feed posts tools
  { type: "function", function: { name: "list_feed_posts", description: "List all photographer feed posts across the platform. Returns title, caption, user_id, visible status, created_at.", parameters: { type: "object", properties: { limit: { type: "number", description: "Max posts to return, default 50" }, user_id: { type: "string", description: "Filter by specific user ID" } } } } },
  { type: "function", function: { name: "update_feed_post", description: "Update a feed post (title, caption, visible, image_url, location)", parameters: { type: "object", properties: { id: { type: "string" }, title: { type: "string" }, caption: { type: "string" }, visible: { type: "boolean" }, image_url: { type: "string" }, location: { type: "string" } }, required: ["id"] } } },
  { type: "function", function: { name: "delete_feed_post", description: "Delete a feed post by ID", parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } } },
  { type: "function", function: { name: "hide_feed_post", description: "Hide a feed post (set visible=false)", parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } } },
  { type: "function", function: { name: "show_feed_post", description: "Show a hidden feed post (set visible=true)", parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } } },
  { type: "function", function: { name: "list_all_users", description: "List all registered photographers with their studio names and user IDs", parameters: { type: "object", properties: {}, required: [] } } },
  { type: "function", function: { name: "list_events", description: "List events for a user or all events", parameters: { type: "object", properties: { user_id: { type: "string" }, limit: { type: "number" } } } } },
];

const SYSTEM_PROMPT = `You are the Art Gallery super admin AI for MirrorAI — a premium photography platform. You have FULL control over:

1. **Featured Photographers** — Add, update, delete, list photographers
2. **Wedding Stories** — Add, update, delete stories
3. **Education** — Add, delete tutorials
4. **Discover Profiles** — Add, delete profiles
5. **Settings** — Update gallery name, tagline, hero text, toggle sections
6. **Feed Posts** — List, update, delete, hide/show any photographer's feed posts across the platform
7. **Users** — List all photographers
8. **Events** — List events

When the user asks to manage content, use the appropriate tool. Be concise and confirm actions.
You can manage ALL feed posts from ALL photographers — hide inappropriate content, edit titles, delete spam, etc.
Use a warm, editorial tone. If multiple items need changes, handle them one by one.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    let aiMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
    let response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: aiMessages, tools: TOOLS }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    let data = await response.json();
    let assistantMsg = data.choices?.[0]?.message;

    let iterations = 0;
    while (assistantMsg?.tool_calls && iterations < 15) {
      iterations++;
      aiMessages.push(assistantMsg);

      for (const tc of assistantMsg.tool_calls) {
        const fn = tc.function.name;
        const args = JSON.parse(tc.function.arguments || "{}");
        let result: any;

        try {
          switch (fn) {
            case "list_photographers": {
              const { data: rows } = await sb.from("ag_featured_photographers").select("*").order("sort_order");
              result = rows;
              break;
            }
            case "add_photographer": {
              const { data: maxRow } = await sb.from("ag_featured_photographers").select("sort_order").order("sort_order", { ascending: false }).limit(1);
              const nextOrder = (maxRow?.[0]?.sort_order ?? -1) + 1;
              const { data: row, error } = await sb.from("ag_featured_photographers").insert({ ...args, sort_order: nextOrder }).select().single();
              result = error ? { error: error.message } : { success: true, photographer: row };
              break;
            }
            case "update_photographer": {
              const { id, ...updates } = args;
              const { error } = await sb.from("ag_featured_photographers").update(updates).eq("id", id);
              result = error ? { error: error.message } : { success: true };
              break;
            }
            case "delete_photographer": {
              const { error } = await sb.from("ag_featured_photographers").delete().eq("id", args.id);
              result = error ? { error: error.message } : { success: true };
              break;
            }
            case "list_stories": {
              const { data: rows } = await sb.from("ag_stories").select("*").order("sort_order");
              result = rows;
              break;
            }
            case "add_story": {
              const { data: maxRow } = await sb.from("ag_stories").select("sort_order").order("sort_order", { ascending: false }).limit(1);
              const nextOrder = (maxRow?.[0]?.sort_order ?? -1) + 1;
              const { data: row, error } = await sb.from("ag_stories").insert({ ...args, sort_order: nextOrder }).select().single();
              result = error ? { error: error.message } : { success: true, story: row };
              break;
            }
            case "update_story": {
              const { id, ...updates } = args;
              const { error } = await sb.from("ag_stories").update(updates).eq("id", id);
              result = error ? { error: error.message } : { success: true };
              break;
            }
            case "delete_story": {
              const { error } = await sb.from("ag_stories").delete().eq("id", args.id);
              result = error ? { error: error.message } : { success: true };
              break;
            }
            case "list_education": {
              const { data: rows } = await sb.from("ag_education").select("*").order("sort_order");
              result = rows;
              break;
            }
            case "add_tutorial": {
              const { data: maxRow } = await sb.from("ag_education").select("sort_order").order("sort_order", { ascending: false }).limit(1);
              const nextOrder = (maxRow?.[0]?.sort_order ?? -1) + 1;
              const { data: row, error } = await sb.from("ag_education").insert({ ...args, sort_order: nextOrder }).select().single();
              result = error ? { error: error.message } : { success: true, tutorial: row };
              break;
            }
            case "delete_tutorial": {
              const { error } = await sb.from("ag_education").delete().eq("id", args.id);
              result = error ? { error: error.message } : { success: true };
              break;
            }
            case "list_discover": {
              const { data: rows } = await sb.from("ag_discover_profiles").select("*").order("sort_order");
              result = rows;
              break;
            }
            case "add_discover_profile": {
              const { data: maxRow } = await sb.from("ag_discover_profiles").select("sort_order").order("sort_order", { ascending: false }).limit(1);
              const nextOrder = (maxRow?.[0]?.sort_order ?? -1) + 1;
              const { data: row, error } = await sb.from("ag_discover_profiles").insert({ ...args, sort_order: nextOrder }).select().single();
              result = error ? { error: error.message } : { success: true, profile: row };
              break;
            }
            case "delete_discover_profile": {
              const { error } = await sb.from("ag_discover_profiles").delete().eq("id", args.id);
              result = error ? { error: error.message } : { success: true };
              break;
            }
            case "get_settings": {
              const { data: row } = await sb.from("ag_settings").select("setting_value").eq("setting_key", "gallery_config").single();
              result = row?.setting_value || {};
              break;
            }
            case "update_settings": {
              const { data: existing } = await sb.from("ag_settings").select("setting_value").eq("setting_key", "gallery_config").single();
              const merged = { ...(existing?.setting_value || {}), ...args };
              const { error } = await sb.from("ag_settings").update({ setting_value: merged, updated_at: new Date().toISOString() }).eq("setting_key", "gallery_config");
              result = error ? { error: error.message } : { success: true, settings: merged };
              break;
            }
            // Feed posts
            case "list_feed_posts": {
              let query = sb.from("feed_posts").select("id, title, caption, image_url, visible, user_id, created_at").order("created_at", { ascending: false });
              if (args.user_id) query = query.eq("user_id", args.user_id);
              const { data: rows } = await query.limit(args.limit || 50);
              result = rows;
              break;
            }
            case "update_feed_post": {
              const { id, ...updates } = args;
              const { error } = await sb.from("feed_posts").update(updates).eq("id", id);
              result = error ? { error: error.message } : { success: true };
              break;
            }
            case "delete_feed_post": {
              const { error } = await sb.from("feed_posts").delete().eq("id", args.id);
              result = error ? { error: error.message } : { success: true };
              break;
            }
            case "hide_feed_post": {
              const { error } = await sb.from("feed_posts").update({ visible: false }).eq("id", args.id);
              result = error ? { error: error.message } : { success: true };
              break;
            }
            case "show_feed_post": {
              const { error } = await sb.from("feed_posts").update({ visible: true }).eq("id", args.id);
              result = error ? { error: error.message } : { success: true };
              break;
            }
            case "list_all_users": {
              const { data: rows } = await sb.from("profiles").select("user_id, studio_name, email").order("created_at", { ascending: false }).limit(100);
              result = rows;
              break;
            }
            case "list_events": {
              let query = sb.from("events").select("id, name, event_date, location, photo_count, user_id").order("created_at", { ascending: false });
              if (args.user_id) query = query.eq("user_id", args.user_id);
              const { data: rows } = await query.limit(args.limit || 20);
              result = rows;
              break;
            }
            default:
              result = { error: `Unknown function: ${fn}` };
          }
        } catch (e) {
          result = { error: e.message };
        }

        aiMessages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
      }

      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: aiMessages, tools: TOOLS }),
      });

      if (!response.ok) throw new Error(`AI gateway error on follow-up: ${response.status}`);
      data = await response.json();
      assistantMsg = data.choices?.[0]?.message;
    }

    const reply = assistantMsg?.content || "Done.";
    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ag-gallery-chat error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
