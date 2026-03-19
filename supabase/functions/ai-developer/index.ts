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

const CODEBASE_MAP = `
## MirrorAI Codebase Map

### Pages (src/pages/)
Auth, Dashboard, Events, EventGallery, PublicGallery, Analytics, Clients, Profile, Billing, 
Branding, BrandEditor, WebsiteEditor, AlbumDesigner, AlbumEditorPage, AlbumPreviewPage,
Cheetah, CheetahLive, StorybookCreator, GalleryCover, GuestFinder, UploadPage, 
LandingPage, Notifications, Onboarding, PhotographerFeed, StudioSettings, TemplatePreview,
SuperAdmin, admin/*, super-admin/*, client/*

### Components (src/components/)
UI: shadcn/ui primitives (Button, Card, Dialog, Sheet, Tabs, Select, etc.)
Gallery: GalleryShell, PhotoLightbox, GalleryPasswordGate, PhotoSlideshow, ProgressiveImage
Website: WebsiteHero, WebsiteAbout, WebsitePortfolio, WebsiteContact, WebsiteFooter, etc.
Album: AlbumCanvas, AlbumTimeline, AlbumEditorToolbar, AlbumPhotoPanel
Grid: GridBuilder, GridEditor, GridCell, TextOverlay, LogoOverlay
Brand: BrandAssets, BrandTypography, BrandWatermark
Events: SmartQRAccess, EventCard, EventSettingsModal

### Database Tables
profiles, events, photos, favorites, guest_sessions, guest_selections, clients, 
client_events, albums, album_pages, album_layers, storybooks, storybook_blocks,
notifications, photo_comments, event_analytics, gallery_chapters, grid_templates,
studio_profiles, portfolio_albums, blog_posts, contact_inquiries, platform_settings,
user_roles, ai_developer_prompts, cheetah_sessions, cheetah_photos

### Edge Functions
ai-chat, ai-developer, cheetah-analyze, cheetah-ingest, generate-caption, 
invite-client, send-access-pin, send-welcome-email, process-guest-selfie, suggest-layout

### Patterns
- Auth: useAuth() from @/lib/auth, Supabase email+password
- Data: @tanstack/react-query with supabase client
- Styling: Tailwind semantic tokens, shadcn/ui
- State: React hooks, no Redux
- Icons: lucide-react
`;

const SYSTEM_PROMPT = `You are MirrorAI's AI Developer — a senior full-stack engineer.

${CODEBASE_MAP}

## Response Format (STRICT JSON)
Respond ONLY with valid JSON:
{
  "summary": "What was generated/modified",
  "files": [
    {
      "path": "src/pages/NewPage.tsx",
      "action": "create" | "modify" | "delete",
      "content": "// Complete file content",
      "description": "What this file does"
    }
  ],
  "database": [
    {
      "type": "table" | "policy" | "function" | "migration",
      "name": "table_name",
      "sql": "CREATE TABLE...",
      "description": "What this creates"
    }
  ],
  "routes": [
    { "path": "/route", "component": "ComponentName", "description": "Route purpose" }
  ],
  "edge_functions": [
    { "name": "function-name", "content": "// edge function code", "description": "What it does" }
  ],
  "tests": [
    {
      "path": "src/components/__tests__/Component.test.tsx",
      "content": "// vitest test code using @testing-library/react",
      "description": "What this test covers"
    }
  ],
  "documentation": {
    "feature_description": "What this feature does",
    "api_endpoints": ["POST /api/endpoint - description"],
    "database_changes": ["Added table X with columns Y"],
    "usage_instructions": "How to use this feature"
  },
  "validation": {
    "syntax_valid": true,
    "imports_valid": true,
    "types_valid": true,
    "security_issues": [],
    "performance_warnings": [],
    "missing_dependencies": [],
    "confidence_score": 92,
    "confidence_reasons": ["All imports verified", "TypeScript types complete", "RLS policies included"]
  },
  "instructions": "Manual steps needed",
  "safety_warnings": ["Any risks"],
  "affected_files": ["Existing files impacted"]
}

## Validation Rules
When generating the "validation" field:
- Check all imports reference existing packages (@tanstack/react-query, lucide-react, sonner, etc.) or local paths
- Verify no hardcoded API keys or secrets in code
- Check for SQL injection risks in database queries
- Flag SELECT * or unbounded queries as performance warnings
- Verify all React components have proper TypeScript types
- Check that new tables include RLS policies
- Set confidence_score 0-100 based on code quality assessment

## Test Generation Rules
For every new component or feature, generate at minimum:
- A render test verifying the component mounts
- Tests for key user interactions
- Use vitest + @testing-library/react
- Import from "vitest" for describe/it/expect

## Documentation Rules
Always populate the documentation field with:
- Clear feature description
- List of API endpoints if any
- Database changes summary
- Step-by-step usage instructions

## Code Rules
- Generate complete, production-ready TypeScript code
- Use existing patterns and semantic Tailwind tokens
- Include RLS policies for new tables
- Flag breaking changes in safety_warnings
- Never modify auth or payment logic without warning
- Check for proper error handling in all async operations
- Ensure proper loading and error states in components`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const { prompt, context, provider = "lovable", mode = "feature" } = await req.json();
    
    let modeInstruction = "";
    switch (mode) {
      case "page":
        modeInstruction = "Generate a complete page with route, layout, components, and data fetching.";
        break;
      case "api":
        modeInstruction = "Generate edge function(s) with proper CORS, error handling, and types.";
        break;
      case "database":
        modeInstruction = "Generate safe migration SQL with tables, policies, and functions.";
        break;
      case "module":
        modeInstruction = "Generate a complete feature module with pages, components, hooks, and data layer.";
        break;
      case "component":
        modeInstruction = "Generate a reusable React component with proper TypeScript props and styling.";
        break;
      case "refactor":
        modeInstruction = "Analyze the described code and suggest refactoring improvements.";
        break;
      case "full_feature":
        modeInstruction = `Generate a COMPLETE feature with ALL of the following artifacts:

1. **Database Schema** — CREATE TABLE SQL with columns, types, defaults, foreign keys, and RLS policies (USING + WITH CHECK).
2. **Backend API** — A Deno edge function with CORS headers, input validation, error handling, and Supabase client usage.
3. **Frontend Page** — A React page component with data fetching (useQuery), loading/error states, and proper layout.
4. **UI Components** — Reusable sub-components (forms, cards, lists, modals) with TypeScript props and Tailwind semantic tokens.
5. **Documentation** — Feature description, API endpoints, database changes, and usage instructions.

Each artifact MUST be in its own labeled code block with a filename comment on the first line.
Use existing patterns: @tanstack/react-query, supabase client from @/integrations/supabase/client, shadcn/ui components, lucide-react icons.`;
        break;
      default:
        modeInstruction = "Generate whatever is needed based on the prompt.";
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { 
        role: "user", 
        content: `## Mode: ${mode.toUpperCase()}
${modeInstruction}

## Context: ${context || "MirrorAI photography platform"}

## Request:
${prompt}

Respond with valid JSON only.`
      }
    ];

    if (provider === "anthropic") {
      return await callAnthropic(req, messages);
    }
    return await callLovable(req, messages);

  } catch (error) {
    console.error("ai-developer error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});

async function callLovable(messages: { role: string; content: string }[]) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      temperature: 0.7,
      max_tokens: 16000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Lovable error:", response.status, errorText);
    return new Response(JSON.stringify({ error: `AI generation failed (${response.status})` }),
      { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const data = await response.json();
  return parseAndRespond(data.choices?.[0]?.message?.content || "");
}

async function callAnthropic(messages: { role: string; content: string }[]) {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const systemMsg = messages.find(m => m.role === "system")?.content || "";
  const userMsgs = messages.filter(m => m.role !== "system");

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
      system: systemMsg,
      messages: userMsgs,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Anthropic error:", response.status, errorText);
    return new Response(JSON.stringify({ error: `Anthropic API failed (${response.status})` }),
      { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || "";
  return parseAndRespond(content);
}

function parseAndRespond(generatedContent: string) {
  let parsedResponse;
  try {
    const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                      generatedContent.match(/```\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : generatedContent;
    parsedResponse = JSON.parse(jsonStr);
  } catch {
    parsedResponse = {
      summary: "Generated code response",
      raw_content: generatedContent,
      files: [],
      database: [],
      routes: [],
      edge_functions: [],
      instructions: "Review the generated content above.",
      safety_warnings: [],
      affected_files: [],
    };
  }

  return new Response(
    JSON.stringify({ success: true, result: parsedResponse, raw: generatedContent }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
