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
] as const;

export type GalleryStyleValue = typeof GALLERY_STYLES[number]['value'];

export const DEFAULT_LAYOUT_FOR_STYLE: Record<GalleryStyleValue, string> = {
  'vogue-editorial': 'masonry',
  'timeless-wedding': 'masonry',
};

/**
 * CSS custom properties for Timeless Wedding style.
 * Applied as inline styles on the gallery wrapper.
 */
export const TIMELESS_WEDDING_VARS: React.CSSProperties = {
  // @ts-ignore custom properties
  '--tw-bg': '#FAF8F5',
  '--tw-text': '#2B2B2B',
  '--tw-text-secondary': '#8A8A8A',
  '--tw-divider': '#EAEAEA',
  '--tw-hero-overlay': 'rgba(0,0,0,0.18)',
};
