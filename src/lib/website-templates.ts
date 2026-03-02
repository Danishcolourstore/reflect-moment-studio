/**
 * Website Template System
 * Full-experience presentation wrappers for photographer branding.
 * These control header, hero, footer, typography, and spacing —
 * the gallery engine itself remains unchanged.
 */

export const WEBSITE_TEMPLATES = [
  {
    value: 'editorial-studio',
    label: 'Editorial Studio',
    description: 'Luxury minimal fashion-style website',
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    uiFontFamily: 'Inter, sans-serif',
    bg: '#F2EDE6',
    text: '#2C2118',
    textSecondary: '#8B7355',
    navBg: 'rgba(242, 237, 230, 0.92)',
    navBorder: 'rgba(139, 115, 85, 0.12)',
    headerStyle: 'transparent' as const,
    heroStyle: 'editorial' as const,
  },
  {
    value: 'timeless-wedding',
    label: 'Timeless Wedding',
    description: 'Warm wedding website feel',
    fontFamily: 'Inter, sans-serif',
    uiFontFamily: 'Inter, sans-serif',
    bg: '#FAF8F5',
    text: '#2B2B2B',
    textSecondary: '#8A8A8A',
    navBg: 'rgba(250, 248, 245, 0.92)',
    navBorder: '#EAEAEA',
    headerStyle: 'centered' as const,
    heroStyle: 'wedding' as const,
  },
  {
    value: 'modern-portfolio',
    label: 'Modern Portfolio',
    description: 'Clean photographer portfolio look',
    fontFamily: 'Inter, sans-serif',
    uiFontFamily: 'Inter, sans-serif',
    bg: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#6B6B6B',
    navBg: 'rgba(255, 255, 255, 0.95)',
    navBorder: '#E5E5E5',
    headerStyle: 'fixed' as const,
    heroStyle: 'minimal' as const,
  },
] as const;

export type WebsiteTemplateValue = typeof WEBSITE_TEMPLATES[number]['value'];

export function getTemplate(value: string) {
  return WEBSITE_TEMPLATES.find(t => t.value === value) || WEBSITE_TEMPLATES[0];
}
