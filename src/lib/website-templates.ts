/**
 * Website Template System
 * Templates are loaded from the database (managed by Super Admin).
 * Static defaults serve as fallback when DB templates aren't available yet.
 */

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
export const STATIC_TEMPLATES: WebsiteTemplateConfig[] = [
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
  {
    value: 'cinematic-wedding-story',
    label: 'Cinematic Wedding Story',
    description: 'Luxury cinematic wedding photography with storytelling flow',
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    uiFontFamily: '"DM Sans", sans-serif',
    bg: '#FAF8F5',
    text: '#1A1715',
    textSecondary: '#7A756E',
    navBg: 'rgba(250,248,245,0.95)',
    navBorder: 'rgba(26,23,21,0.06)',
    headerStyle: 'transparent',
    heroStyle: 'cinematic' as any,
    cardBg: '#FFFFFF',
    footerBg: '#1A1715',
    footerText: '#9A958E',
  },
];

// Runtime cache synced from React Query via useWebsiteTemplates hook
let _runtimeCache: WebsiteTemplateConfig[] | null = null;

/** Called by the useWebsiteTemplates hook to keep getTemplate() in sync */
export function _setRuntimeCache(templates: WebsiteTemplateConfig[]) {
  _runtimeCache = templates;
}

// Backward-compatible export — consumers that can't use hooks still get static list.
// Prefer useWebsiteTemplates() hook for dynamic DB-sourced templates.
export const WEBSITE_TEMPLATES = STATIC_TEMPLATES;

export type WebsiteTemplateValue = string;

/**
 * Synchronous template lookup.
 * Checks runtime DB cache first, then falls back to static templates.
 */
export function getTemplate(value: string): WebsiteTemplateConfig {
  if (_runtimeCache) {
    const found = _runtimeCache.find(t => t.value === value);
    if (found) return found;
  }
  return STATIC_TEMPLATES.find(t => t.value === value) || STATIC_TEMPLATES[0];
}

// Legacy exports kept for backward compat — no-ops now that React Query manages cache
export async function loadTemplatesFromDb(): Promise<WebsiteTemplateConfig[]> {
  return _runtimeCache || STATIC_TEMPLATES;
}
export function clearTemplateCache() {
  _runtimeCache = null;
}
