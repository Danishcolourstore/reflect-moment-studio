import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert AI Developer Assistant for MirrorAI, a photography studio management platform built with React, TypeScript, Tailwind CSS, and Supabase.

When given a prompt, you generate production-ready code following these guidelines:

## Project Structure
- Pages go in /src/pages/
- Components go in /src/components/
- Hooks go in /src/hooks/
- Database tables use Supabase

## Code Standards
- Use TypeScript with proper types
- Use Tailwind CSS for styling with semantic tokens (bg-background, text-foreground, etc.)
- Use shadcn/ui components from @/components/ui/
- Use React Query for data fetching
- Follow existing patterns in the codebase

## Response Format
Always respond with a JSON object containing:
{
  "summary": "Brief description of what was generated",
  "files": [
    {
      "path": "src/pages/Example.tsx",
      "action": "create" | "modify",
      "content": "// Full file content here",
      "description": "What this file does"
    }
  ],
  "database": [
    {
      "type": "table" | "policy" | "function",
      "name": "table_name",
      "sql": "CREATE TABLE...",
      "description": "What this creates"
    }
  ],
  "routes": [
    {
      "path": "/example",
      "component": "Example",
      "description": "Route description"
    }
  ],
  "instructions": "Any manual steps the admin needs to take"
}

Generate complete, working code that follows MirrorAI's design patterns and can be directly used in the project.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { 
        role: "user", 
        content: `Project Context: ${context || "MirrorAI photography platform"}

Developer Request: ${prompt}

Generate the code following the specified JSON format.`
      }
    ];

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
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let parsedResponse;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        generatedContent.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : generatedContent;
      parsedResponse = JSON.parse(jsonStr);
    } catch {
      // If not valid JSON, wrap the content
      parsedResponse = {
        summary: "Generated code response",
        raw_content: generatedContent,
        files: [],
        database: [],
        routes: [],
        instructions: "Review the generated content above."
      };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        result: parsedResponse,
        raw: generatedContent 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("ai-developer error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
