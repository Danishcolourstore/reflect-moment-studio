/**
 * Website Template System
 * Full-experience presentation wrappers for photographer branding.
 */

export const WEBSITE_TEMPLATES = [
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
    headerStyle: 'transparent' as const,
    heroStyle: 'vows' as const,
    cardBg: '#161310',
    footerBg: '#0C0A07',
    footerText: '#7A7365',
  },
] as const;

export type WebsiteTemplateValue = typeof WEBSITE_TEMPLATES[number]['value'];

export function getTemplate(value: string) {
  return WEBSITE_TEMPLATES.find(t => t.value === value) || WEBSITE_TEMPLATES[0];
}
