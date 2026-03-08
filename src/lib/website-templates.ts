/**
 * Website Template System
 * Templates are loaded from the database (managed by Super Admin).
 * Static defaults serve as fallback when DB templates aren't available yet.
 */

import { supabase } from '@/integrations/supabase/client';

export interface WebsiteTemplateConfig {
  value: string;
  label: string;
  description: string;
  fontFamily: string;
  uiFontFamily: string;
  bg: string;
  text: string;
  textSecondary: string;
  navBg: string;
  navBorder: string;
  headerStyle: 'transparent' | 'solid';
  heroStyle: 'vows' | 'editorial';
  cardBg: string;
  footerBg: string;
  footerText: string;
  demoContent?: {
    hero?: { headline?: string; tagline?: string; button_text?: string; image_url?: string | null };
    portfolio?: { layout?: string; max_images?: number; demo_images?: string[] };
    about?: { bio?: string; profile_image_url?: string | null };
    services?: { title: string; description: string; icon: string }[];
    contact?: { heading?: string; button_text?: string };
    footer?: { text?: string; show_social?: boolean };
  };
}

// Static fallback templates (used when DB is unavailable)
const STATIC_TEMPLATES: WebsiteTemplateConfig[] = [
  {
    value: 'vows-elegance',
    label: 'Vows Elegance',
    description: 'Cinematic dark wedding template with full-bleed gallery and dramatic typography',
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    uiFontFamily: '"DM Sans", sans-serif',
    bg: '#0C0A07',
    text: '#F2EDE4',
    textSecondary: '#A69E8F',
    navBg: 'rgba(12,10,7,0.75)',
    navBorder: 'rgba(242,237,228,0.06)',
    headerStyle: 'transparent',
    heroStyle: 'vows',
    cardBg: '#161310',
    footerBg: '#0C0A07',
    footerText: '#7A7365',
  },
  {
    value: 'editorial-luxury',
    label: 'Editorial Luxury',
    description: 'Fine-art editorial magazine layout with cream tones and elegant serif typography',
    fontFamily: '"Playfair Display", Georgia, serif',
    uiFontFamily: '"DM Sans", sans-serif',
    bg: '#F5F0EA',
    text: '#2B2A28',
    textSecondary: '#6B6560',
    navBg: 'rgba(245,240,234,0.92)',
    navBorder: 'rgba(43,42,40,0.08)',
    headerStyle: 'solid',
    heroStyle: 'editorial',
    cardBg: '#FFFFFF',
    footerBg: '#2B2A28',
    footerText: '#A09A92',
  },
  {
    value: 'modern-photography-grid',
    label: 'Modern Photography Grid',
    description: 'Clean minimal black-and-white photography portfolio with large hero and grid gallery',
    fontFamily: '"DM Sans", "Helvetica Neue", sans-serif',
    uiFontFamily: '"DM Sans", sans-serif',
    bg: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#6B6B6B',
    navBg: 'rgba(255,255,255,0.95)',
    navBorder: 'rgba(0,0,0,0.08)',
    headerStyle: 'solid',
    heroStyle: 'modern-grid' as any,
    cardBg: '#F8F8F8',
    footerBg: '#1A1A1A',
    footerText: '#999999',
  },
];

// Cached DB templates
let _cachedTemplates: WebsiteTemplateConfig[] | null = null;

function mapDbRowToTemplate(row: any): WebsiteTemplateConfig {
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

/**
 * Load templates from database. Caches result for session.
 */
export async function loadTemplatesFromDb(): Promise<WebsiteTemplateConfig[]> {
  if (_cachedTemplates) return _cachedTemplates;
  try {
    const { data, error } = await (supabase.from('website_templates').select('*') as any)
      .eq('is_active', true)
      .order('sort_order');
    if (error || !data || data.length === 0) return STATIC_TEMPLATES;
    _cachedTemplates = data.map(mapDbRowToTemplate);
    return _cachedTemplates;
  } catch {
    return STATIC_TEMPLATES;
  }
}

/** Clear the template cache (call after admin edits) */
export function clearTemplateCache() {
  _cachedTemplates = null;
}

// Keep backward-compatible exports
export const WEBSITE_TEMPLATES = STATIC_TEMPLATES;

export type WebsiteTemplateValue = string;

export function getTemplate(value: string): WebsiteTemplateConfig {
  // Check cached DB templates first
  if (_cachedTemplates) {
    const found = _cachedTemplates.find(t => t.value === value);
    if (found) return found;
  }
  // Fall back to static
  return STATIC_TEMPLATES.find(t => t.value === value) || STATIC_TEMPLATES[0];
}
