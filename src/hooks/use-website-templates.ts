import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type WebsiteTemplateConfig, _setRuntimeCache, STATIC_TEMPLATES } from '@/lib/website-templates';

function mapDbRow(row: any): WebsiteTemplateConfig {
  return {
    value: row.slug,
    label: row.label,
    description: row.description || '',
    fontFamily: row.font_family,
    uiFontFamily: row.ui_font_family,
    bg: row.bg_color,
    text: row.text_color,
    textSecondary: row.text_secondary_color,
    navBg: row.nav_bg,
    navBorder: row.nav_border,
    headerStyle: row.header_style as 'transparent' | 'solid',
    heroStyle: row.hero_style as 'vows' | 'editorial',
    cardBg: row.card_bg,
    footerBg: row.footer_bg,
    footerText: row.footer_text_color,
    demoContent: row.demo_content || undefined,
  };
}

async function fetchTemplates(): Promise<WebsiteTemplateConfig[]> {
  const { data, error } = await (supabase.from('website_templates').select('*') as any)
    .eq('is_active', true)
    .order('sort_order');
  if (error || !data || data.length === 0) return STATIC_TEMPLATES;
  const mapped = data.map(mapDbRow);
  // Keep runtime cache in sync so getTemplate() works everywhere
  _setRuntimeCache(mapped);
  return mapped;
}

export const TEMPLATES_QUERY_KEY = ['website-templates'];

/**
 * Fetches website templates from the database via React Query.
 * Falls back to static templates on error.
 */
export function useWebsiteTemplates() {
  return useQuery({
    queryKey: TEMPLATES_QUERY_KEY,
    queryFn: fetchTemplates,
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000,
  });
}

/** Call after admin saves to force all consumers to refetch */
export function useInvalidateTemplates() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
}
