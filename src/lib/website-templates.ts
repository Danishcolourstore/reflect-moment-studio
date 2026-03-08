/**
 * Website Template System
 * Templates are loaded from the database (managed by Super Admin).
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
    gallery_images?: string[];
    featured_stories?: { title: string; location: string; image_url: string }[];
    films?: { title: string; thumbnail_url: string; video_url?: string }[];
    social_images?: string[];
  };
  stylingConfig?: Record<string, unknown>;
  sectionConfig?: Record<string, unknown>;
}

const EMPTY_TEMPLATE: WebsiteTemplateConfig = {
  value: '',
  label: '',
  description: '',
  fontFamily: 'serif',
  uiFontFamily: 'sans-serif',
  bg: '#000000',
  text: '#ffffff',
  textSecondary: '#cccccc',
  navBg: 'rgba(0,0,0,0.6)',
  navBorder: 'rgba(255,255,255,0.1)',
  headerStyle: 'transparent',
  heroStyle: 'vows',
  cardBg: '#111111',
  footerBg: '#000000',
  footerText: '#bbbbbb',
};

let _runtimeCache: WebsiteTemplateConfig[] | null = null;

export function _setRuntimeCache(templates: WebsiteTemplateConfig[]) {
  _runtimeCache = templates;
}

export const WEBSITE_TEMPLATES: WebsiteTemplateConfig[] = [];

export type WebsiteTemplateValue = string;

export function getTemplate(value: string): WebsiteTemplateConfig {
  if (_runtimeCache && _runtimeCache.length > 0) {
    const found = _runtimeCache.find((t) => t.value === value);
    return found || _runtimeCache[0];
  }
  return EMPTY_TEMPLATE;
}

export async function loadTemplatesFromDb(): Promise<WebsiteTemplateConfig[]> {
  return _runtimeCache || [];
}

export function clearTemplateCache() {
  _runtimeCache = null;
  // Bump image revision so cached image URLs are invalidated
  import('./cache-bust').then(m => m.bumpImageRevision());
}

