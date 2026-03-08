/**
 * Website Template System
 * Full-experience presentation wrappers for photographer branding.
 * These control header, hero, footer, typography, and spacing —
 * the gallery engine itself remains unchanged.
 */

export const WEBSITE_TEMPLATES = [
  {
    value: 'minimal-portfolio',
    label: 'Minimal Portfolio',
    description: 'Large hero, clean typography, simple grid',
    fontFamily: '"Inter", sans-serif',
    uiFontFamily: '"Inter", sans-serif',
    bg: '#FAFAFA',
    text: '#111111',
    textSecondary: '#888888',
    navBg: 'rgba(250,250,250,0.95)',
    navBorder: '#E8E8E8',
    headerStyle: 'fixed' as const,
    heroStyle: 'minimal' as const,
    cardBg: '#FFFFFF',
    footerBg: '#111111',
    footerText: '#999999',
  },
  {
    value: 'luxury-wedding',
    label: 'Luxury Wedding',
    description: 'Elegant serif fonts, cinematic hero',
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    uiFontFamily: '"DM Sans", sans-serif',
    bg: '#FAF8F5',
    text: '#2B2118',
    textSecondary: '#8B7355',
    navBg: 'rgba(250,248,245,0.92)',
    navBorder: 'rgba(139,115,85,0.12)',
    headerStyle: 'transparent' as const,
    heroStyle: 'wedding' as const,
    cardBg: '#FFFFFF',
    footerBg: '#2B2118',
    footerText: '#C6A77B',
  },
  {
    value: 'modern-grid',
    label: 'Modern Grid',
    description: 'Instagram-style grid, fast scrolling',
    fontFamily: '"DM Sans", sans-serif',
    uiFontFamily: '"DM Sans", sans-serif',
    bg: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#6B6B6B',
    navBg: 'rgba(255,255,255,0.97)',
    navBorder: '#EFEFEF',
    headerStyle: 'fixed' as const,
    heroStyle: 'compact' as const,
    cardBg: '#F8F8F8',
    footerBg: '#1A1A1A',
    footerText: '#777777',
  },
  {
    value: 'magazine-editorial',
    label: 'Magazine Style',
    description: 'Large editorial sections, fashion feel',
    fontFamily: '"Playfair Display", Georgia, serif',
    uiFontFamily: '"Inter", sans-serif',
    bg: '#F2EDE6',
    text: '#2C2118',
    textSecondary: '#8B7355',
    navBg: 'rgba(242,237,230,0.92)',
    navBorder: 'rgba(139,115,85,0.12)',
    headerStyle: 'transparent' as const,
    heroStyle: 'editorial' as const,
    cardBg: '#FFFFFF',
    footerBg: '#2C2118',
    footerText: '#B8A48A',
  },
  {
    value: 'dark-portfolio',
    label: 'Dark Mode Portfolio',
    description: 'Premium cinematic black and gold',
    fontFamily: '"Playfair Display", Georgia, serif',
    uiFontFamily: '"DM Sans", sans-serif',
    bg: '#0A0906',
    text: '#EDEAE3',
    textSecondary: '#A6A197',
    navBg: 'rgba(10,9,6,0.85)',
    navBorder: 'rgba(255,255,255,0.06)',
    headerStyle: 'transparent' as const,
    heroStyle: 'cinematic' as const,
    cardBg: '#14120D',
    footerBg: '#0A0906',
    footerText: '#A6A197',
  },
] as const;

export type WebsiteTemplateValue = typeof WEBSITE_TEMPLATES[number]['value'];

export function getTemplate(value: string) {
  return WEBSITE_TEMPLATES.find(t => t.value === value) || WEBSITE_TEMPLATES[4]; // default to dark-portfolio
}
