/**
 * Gallery Style Presets
 * Visual presentation system — purely cosmetic, no logic changes.
 */

export const GALLERY_STYLES = [
  {
    value: 'vogue-editorial',
    label: 'Vogue Editorial',
    description: 'Luxury fashion-editorial wedding experience',
  },
  {
    value: 'timeless-wedding',
    label: 'Timeless Wedding',
    description: 'Warm, classic wedding album feel',
  },
  {
    value: 'andhakar',
    label: 'Andhakar',
    description: 'Dramatic dark cinematic photography experience',
  },
] as const;

export type GalleryStyleValue = typeof GALLERY_STYLES[number]['value'];

export const DEFAULT_LAYOUT_FOR_STYLE: Record<GalleryStyleValue, string> = {
  'vogue-editorial': 'masonry',
  'timeless-wedding': 'masonry',
  'andhakar': 'masonry',
};

/**
 * CSS custom properties for Timeless Wedding style.
 */
export const TIMELESS_WEDDING_VARS: React.CSSProperties = {
  // @ts-ignore custom properties
  '--tw-bg': '#F4F1EC',
  '--tw-bg-alt': '#EFEAE3',
  '--tw-surface': '#FFFFFF',
  '--tw-text': '#2B2B2B',
  '--tw-text-secondary': '#7A7A7A',
  '--tw-text-muted': '#9A948A',
  '--tw-divider': '#E7E2DA',
  '--tw-btn-border': '#E7E2DA',
  '--tw-btn-hover': '#DDD3C6',
  '--tw-hero-tint': 'rgba(244,241,236,0.25)',
};

/**
 * CSS custom properties for Andhakar style.
 */
export const ANDHAKAR_VARS: React.CSSProperties = {
  // @ts-ignore custom properties
  '--ak-bg': '#0D0D0D',
  '--ak-text': '#C8C8C8',
  '--ak-text-secondary': '#8B8B8B',
  '--ak-divider': 'rgba(200,200,200,0.1)',
  '--ak-hero-overlay': 'rgba(0,0,0,0.35)',
};
