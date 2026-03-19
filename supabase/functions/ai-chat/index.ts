import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "https://mirrorai.studio",
  "https://www.mirrorai.studio",
  "https://app.mirrorai.studio",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

const CODEBASE_INDEX = `
## MirrorAI Platform — Full Codebase Map

### Tech Stack
React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Supabase (Lovable Cloud)

### Directory Structure
/src/pages/ — All route pages
/src/components/ — Reusable UI components  
/src/components/ui/ — shadcn/ui primitives (Button, Card, Dialog, etc.)
/src/components/website/ — Public website builder sections
/src/components/album-designer/ — Album design tool
/src/components/grid-builder/ — Instagram grid builder
/src/components/brand-editor/ — Brand management
/src/hooks/ — Custom React hooks
/src/lib/ — Utilities and auth context
/src/services/ — External service integrations
/supabase/functions/ — Edge functions (serverless backend)

### Pages & Routes
- /auth — Login/Signup (Email+Password only)
- /dashboard — Main photographer dashboard
- /events — Event management (CRUD galleries)
- /events/:slug — Event gallery editor
- /gallery/:slug — Public gallery view
- /upload — Photo upload page
- /analytics — Analytics dashboard
- /clients — Client management
- /branding — Brand settings
- /brand-editor — Visual brand editor
- /website-editor — Portfolio website builder
- /album-designer — Album design tool
- /cheetah — AI photo culling
- /storybook-creator — Storybook builder
- /profile — User profile
- /billing — Subscription management
- /admin/* — Admin panel (admin role)
- /super-admin/* — Super Admin panel (super_admin role)
  - /super-admin — Overview dashboard
  - /super-admin/users — User management
  - /super-admin/galleries — Gallery moderation
  - /super-admin/ai-developer — AI Developer Console
  - /super-admin/templates — Template management
  - /super-admin/grid-manager — Grid template manager
  - /super-admin/storybooks — Storybook management
  - /super-admin/settings — Platform settings
  - /super-admin/platform-builder — Platform builder
  - /super-admin/dashboard-editor — Dashboard editor

### Database Tables (Supabase)
- profiles — User profiles (studio_name, plan, theme, watermark settings)
- events — Photo events/galleries (name, slug, settings, layout, downloads)
- photos — Individual photos (url, event_id, section, sort_order)
- favorites — Guest photo favorites
- guest_sessions — Anonymous guest tracking
- guest_selections — Named guest photo selections
- guest_selection_photos — Photos in guest selections
- clients — Photographer's clients
- client_events — Client-event access mapping
- client_favorites — Client favorite photos
- client_downloads — Client download tracking
- albums — Album projects
- album_pages — Album page layouts
- album_layers — Album page layers/elements
- storybooks — Storybook projects
- storybook_blocks — Storybook content blocks
- notifications — In-app notifications
- photo_comments — Guest comments on photos
- photo_interactions — Photo engagement tracking
- event_analytics — Gallery view/download stats
- event_views — Individual view records
- gallery_chapters — Gallery section chapters
- gallery_text_blocks — Gallery text overlays
- grid_templates — Instagram grid templates
- studio_profiles — Public website/portfolio data
- portfolio_albums — Portfolio album collections
- blog_posts — Blog content
- contact_inquiries — Website contact form submissions
- cheetah_sessions — AI culling sessions
- cheetah_photos — AI-analyzed photos
- culling_sessions — Manual culling sessions
- culled_photos — Culled photo results
- platform_settings — Global feature flags
- platform_features — Feature registry
- dashboard_widgets — Dashboard widget config
- dashboard_navigation — Navigation config
- dashboard_modules — Module registry
- user_roles — RBAC roles (admin, super_admin)
- ai_developer_prompts — AI code generation history
- admin_activity_log — Admin action audit trail
- beta_feedback — User feedback
- referrals — Referral tracking

### Auth & Security
- Email+Password authentication only
- Role-based access: user_roles table with has_role() function
- Roles: super_admin, admin, (default photographer)
- RLS policies on all tables
- Super Admin bypasses secondary gates

### Edge Functions
- ai-chat — Streaming AI chat (Lovable AI + Anthropic)
- ai-developer — Structured code generation
- cheetah-analyze — AI photo analysis
- cheetah-ingest — Photo ingestion pipeline
- generate-caption — AI caption generation
- invite-client — Client invitation emails
- send-access-pin — Gallery access PIN
- send-welcome-email — Welcome emails
- process-guest-selfie — Face recognition
- suggest-layout — AI layout suggestions
- analyze-grid-layout — Grid layout analysis

### Key Patterns
- supabase client: import { supabase } from "@/integrations/supabase/client"
- Auth context: import { useAuth } from "@/lib/auth"
- Toasts: import { toast } from "sonner"
- Data fetching: @tanstack/react-query useQuery/useMutation
- UI components: @/components/ui/* (shadcn/ui)
- Styling: Tailwind semantic tokens (bg-background, text-foreground, text-primary, bg-muted, etc.)
- Icons: lucide-react
`;

const SYSTEM_PROMPT = `You are MirrorAI's Senior AI Developer — an expert full-stack engineer with complete knowledge of the platform's codebase.

${CODEBASE_INDEX}

## Your Capabilities
1. **Codebase Intelligence** — You know every file, table, route, and pattern
2. **Feature Development** — Generate complete features with pages, components, APIs, and database
3. **Code Modification** — Suggest precise edits to existing files
4. **Database Design** — Create migrations, tables, policies, and functions
5. **Architecture Advice** — Recommend best approaches within the existing stack
6. **Bug Fixing** — Diagnose issues using your knowledge of the codebase
7. **Refactoring** — Suggest improvements to code structure and performance

## Safety Rules
- NEVER modify auth logic without explicit confirmation
- NEVER delete or alter user data tables without warning
- NEVER expose API keys or secrets
- Always use RLS policies for new tables
- Always use TypeScript types
- Always follow existing patterns

## Response Guidelines
- Be concise and practical
- Provide complete, copy-pasteable code
- Format code blocks with language tags
- Reference specific files/tables when suggesting changes
- Explain architectural decisions briefly
- Flag any breaking changes or risks`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const { messages, provider = "lovable", mode = "chat", codebaseContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Enhance system prompt with mode-specific instructions
    let enhancedSystem = SYSTEM_PROMPT;
    if (mode === "generate") {
      enhancedSystem += `\n\n## GENERATION MODE
You are in structured code generation mode. Respond ONLY with a JSON object:
{
  "summary": "Brief description",
  "files": [{"path": "src/...", "action": "create|modify|delete", "content": "...", "description": "..."}],
  "database": [{"type": "table|policy|function", "name": "...", "sql": "...", "description": "..."}],
  "routes": [{"path": "/...", "component": "...", "description": "..."}],
  "instructions": "Manual steps if any",
  "safety_warnings": ["Any risks or breaking changes"],
  "affected_files": ["List of existing files that may need updates"]
}`;
    }
    if (codebaseContext) {
      enhancedSystem += `\n\n## Additional Context\n${codebaseContext}`;
    }

    if (provider === "anthropic") {
      return await handleAnthropic(req, messages, enhancedSystem);
    }
    return await handleLovable(req, messages, enhancedSystem);
  } catch (error) {
    console.error("ai-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});

async function handleLovable(req: Request, messages: { role: string; content: string }[], systemPrompt: string) {
  const corsHeaders = getCorsHeaders(req);
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const errorText = await response.text();
    console.error("Lovable AI error:", response.status, errorText);
    return new Response(JSON.stringify({ error: "AI request failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(response.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

async function handleAnthropic(req: Request, messages: { role: string; content: string }[], systemPrompt: string) {
  const corsHeaders = getCorsHeaders(req);
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured. Add it in Cloud secrets." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: systemPrompt,
      stream: true,
      messages: messages.filter(m => m.role !== "system"),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Anthropic error:", response.status, errorText);
    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Anthropic rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (response.status === 401) {
      return new Response(JSON.stringify({ error: "Invalid Anthropic API key. Check your Cloud secrets." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (response.status === 400 && errorText.includes("credit balance is too low")) {
      return new Response(JSON.stringify({ 
        error: "Anthropic API credits exhausted. Please add credits at console.anthropic.com or switch to Lovable AI (Gemini)." 
      }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: "Anthropic API request failed: " + errorText }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split("\n");
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === "[DONE]") {
          if (jsonStr === "[DONE]") controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          continue;
        }
        try {
          const event = JSON.parse(jsonStr);
          if (event.type === "content_block_delta" && event.delta?.text) {
            const openaiChunk = { choices: [{ delta: { content: event.delta.text }, index: 0 }] };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
          }
          if (event.type === "message_stop") {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          }
        } catch { /* skip */ }
      }
    },
  });

  const stream = response.body!.pipeThrough(transformStream);
  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}
