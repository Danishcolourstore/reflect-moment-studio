/**
 * Curated luxury wedding photography for MirrorAI website templates.
 * All images sourced from Unsplash at high resolution (1200px+ wide).
 *
 * Image sets are tone-matched per template:
 *  - Reverie / Heirloom / Vesper → warm tones
 *  - Linen → neutral tones
 *  - Alabaster → cool / high-contrast tones
 */

/* ── Hero cover images ── */
export const HERO_IMAGES: Record<string, string> = {
  reverie:   'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80', // romantic couple in golden light
  linen:     'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=1600&q=80', // clean bright wedding portrait
  vesper:    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1600&q=80', // warm golden hour couple
  alabaster: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1600&q=80', // high contrast editorial couple
  heirloom:  'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=1600&q=80', // nostalgic film-like ceremony
  monolith:  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80', // hero (collage uses HERO_QUAD)
};

/* Monolith — 4-image collage tiles (B&W rendered via CSS filter) */
export const HERO_QUAD_MONOLITH = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80',
  'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=1200&q=80',
];

/* ── About / portrait images ── */
export const ABOUT_IMAGES: Record<string, string> = {
  reverie:   'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=800&q=80',  // couple intimate moment
  linen:     'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',  // clean professional portrait
  vesper:    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80',  // warm storytelling portrait
  alabaster: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',  // editorial minimal portrait
  heirloom:  'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&q=80',  // vintage warm portrait
  monolith:  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',  // editorial portrait (B&W via filter)
};

/* ── Portfolio image collections (12-15 per template) ── */

/** Reverie — soft, romantic, airy */
export const PORTFOLIO_REVERIE = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80', // couple in light
  'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200&q=80', // bridal details
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80', // ceremony moment
  'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=1200&q=80', // couple portrait
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80', // bride getting ready
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80', // ceremony florals
  'https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=1200&q=80', // reception moment
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80', // stolen glance
  'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200&q=80', // couple walking
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=80', // ring detail
  'https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=1200&q=80', // bride portrait
  'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=1200&q=80', // reception dance
];

/** Linen — clean, neutral, professional */
export const PORTFOLIO_LINEN = [
  'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=1200&q=80', // clean couple
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80', // ceremony
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1200&q=80', // couple editorial
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80', // outdoor ceremony
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80', // getting ready
  'https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=1200&q=80', // reception
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80', // flowers detail
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80', // family portrait
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=80', // ring
  'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200&q=80', // veil detail
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80', // candid
  'https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=1200&q=80', // bridal
];

/** Vesper — warm, golden, moody */
export const PORTFOLIO_VESPER = [
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80', // golden hour
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80', // warm candid
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80', // ceremony warm
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80', // couple light
  'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=1200&q=80', // intimate
  'https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=1200&q=80', // reception candid
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=80', // detail ring
  'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200&q=80', // walk together
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80', // getting ready
  'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200&q=80', // bridal details
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80', // ceremony florals
  'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=1200&q=80', // portrait
  'https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=1200&q=80', // bridal solo
];

/** Alabaster — crisp, high contrast, editorial */
export const PORTFOLIO_ALABASTER = [
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1200&q=80', // editorial couple
  'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=1200&q=80', // clean portrait
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80', // ceremony
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80', // couple
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80', // preparation
  'https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=1200&q=80', // reception
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=80', // ring detail
  'https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=1200&q=80', // bridal
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80', // candid
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80', // portrait
  'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200&q=80', // couple walk
  'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200&q=80', // veil
];

/** Heirloom — film, nostalgic, warm storytelling */
export const PORTFOLIO_HEIRLOOM = [
  'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=1200&q=80', // nostalgic ceremony
  'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=1200&q=80', // intimate couple
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80', // stolen glance
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80', // golden couple
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80', // outdoor ceremony
  'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200&q=80', // couple walking
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80', // ceremony details
  'https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=1200&q=80', // reception joy
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80', // getting ready
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=80', // ring
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80', // golden moment
  'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200&q=80', // bridal veil
  'https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=1200&q=80', // bride portrait
  'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=1200&q=80', // reception dance
];

/** Monolith — same set as Alabaster, rendered B&W via CSS filter at the section level */
export const PORTFOLIO_MONOLITH = PORTFOLIO_ALABASTER;

/** Get portfolio images for a given template id */
export const PORTFOLIO_IMAGES: Record<string, string[]> = {
  reverie: PORTFOLIO_REVERIE,
  linen: PORTFOLIO_LINEN,
  vesper: PORTFOLIO_VESPER,
  alabaster: PORTFOLIO_ALABASTER,
  heirloom: PORTFOLIO_HEIRLOOM,
  monolith: PORTFOLIO_MONOLITH,
};

export function getHeroImage(templateId: string): string {
  return HERO_IMAGES[templateId] || HERO_IMAGES.reverie;
}

export function getAboutImage(templateId: string): string {
  return ABOUT_IMAGES[templateId] || ABOUT_IMAGES.reverie;
}

export function getPortfolioImages(templateId: string): string[] {
  return PORTFOLIO_IMAGES[templateId] || PORTFOLIO_REVERIE;
}
