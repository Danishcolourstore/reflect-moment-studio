import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type WebsiteTemplateConfig, _setRuntimeCache } from '@/lib/website-templates';
import { bumpImageRevision } from '@/lib/cache-bust';

function mapDbRow(row: any): WebsiteTemplateConfig {
  const styling = row.styling_config || {};
  const sections = row.section_config || {};

  return {
    value: row.slug,
    label: row.label,
    description: row.description || '',
    fontFamily: styling.fontFamily || row.font_family,
    uiFontFamily: styling.uiFontFamily || row.ui_font_family,
    bg: styling.bg || row.bg_color,
    text: styling.text || row.text_color,
    textSecondary: styling.textSecondary || row.text_secondary_color,
    navBg: styling.navBg || row.nav_bg,
    navBorder: styling.navBorder || row.nav_border,
    headerStyle: (styling.headerStyle || row.header_style) as 'transparent' | 'solid',
    heroStyle: (styling.heroStyle || row.hero_style) as 'vows' | 'editorial',
    cardBg: styling.cardBg || row.card_bg,
    footerBg: styling.footerBg || row.footer_bg,
    footerText: styling.footerText || row.footer_text_color,
    demoContent: row.demo_content || undefined,
    stylingConfig: row.styling_config || undefined,
    sectionConfig: row.section_config || undefined,
  };
}

async function fetchTemplates(): Promise<WebsiteTemplateConfig[]> {
  const { data, error } = await (supabase.from('website_templates').select('*') as any)
    .eq('is_active', true)
    .order('sort_order');

  if (error || !data) {
    _setRuntimeCache([]);
    return [];
  }

  const mapped = data.map(mapDbRow);
  _setRuntimeCache(mapped);
  return mapped;
}

export const TEMPLATES_QUERY_KEY = ['website-templates'];

export function useWebsiteTemplates() {
  return useQuery({
    queryKey: TEMPLATES_QUERY_KEY,
    queryFn: fetchTemplates,
    staleTime: 0,
    gcTime: 2 * 60_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useInvalidateTemplates() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
}

