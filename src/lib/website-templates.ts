/**
 * MirrorAI Website Builder — Template System
 * Five luxury photographer website templates.
 */

export type TemplateId = 'reverie' | 'linen' | 'vesper' | 'alabaster' | 'heirloom';

export type HeroVariant = 'centered' | 'split-left' | 'split-right' | 'bottom-left';
export type AboutVariant = 'two-col' | 'full-width-image' | 'typography-first';
export type PortfolioVariant = 'masonry' | 'uniform' | 'editorial' | 'two-col';
export type ServicesVariant = 'list' | 'cards' | 'numbered';
export type TestimonialsVariant = 'single-centered' | 'horizontal-scroll' | 'dark-break';
export type ContactVariant = 'minimal' | 'two-col' | 'split-dark';
export type FooterVariant = 'centered' | 'two-col' | 'dark-bar';
export type NavVariant = 'transparent' | 'solid' | 'masthead';

export interface TemplateColors {
  bg: string;
  text: string;
  textSecondary: string;
  accent: string;
  border: string;
  cardBg: string;
  heroBg: string;
  heroText: string;
  navBg: string;
  navText: string;
  navScrollBg: string;
  navScrollText: string;
  footerBg: string;
  footerText: string;
  footerSecondary: string;
}

export interface TemplateFonts {
  display: string;
  displayWeight: string;
  displayStyle: string;
  ui: string;
  uiWeight: string;
}

export interface TemplateSections {
  hero: HeroVariant;
  about: AboutVariant;
  portfolio: PortfolioVariant;
  services: ServicesVariant;
  testimonials: TestimonialsVariant;
  contact: ContactVariant;
  footer: FooterVariant;
  nav: NavVariant;
}

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  tagline: string;
  description: string;
  colors: TemplateColors;
  fonts: TemplateFonts;
  sections: TemplateSections;
  /** Extra template-specific details */
  extras: Record<string, any>;
}

/* ── Template Definitions ── */

const REVERIE: TemplateConfig = {
  id: 'reverie',
  name: 'Reverie',
  tagline: 'Soft · Romantic · Airy',
  description: 'Made for wedding photographers who want their work to whisper, not shout.',
  colors: {
    bg: '#FDFCFB',
    text: '#2C2422',
    textSecondary: '#5C5450',
    accent: '#B8953F',
    border: '#F0EDE8',
    cardBg: '#FDFCFB',
    heroBg: 'transparent',
    heroText: '#FFFFFF',
    navBg: 'transparent',
    navText: '#FFFFFF',
    navScrollBg: '#FDFCFB',
    navScrollText: '#2C2422',
    footerBg: '#FDFCFB',
    footerText: '#2C2422',
    footerSecondary: '#AAAAAA',
  },
  fonts: {
    display: "'Cormorant Garamond', Georgia, serif",
    displayWeight: '400',
    displayStyle: 'italic',
    ui: "'DM Sans', sans-serif",
    uiWeight: '400',
  },
  sections: {
    hero: 'centered',
    about: 'two-col',
    portfolio: 'masonry',
    services: 'list',
    testimonials: 'single-centered',
    contact: 'minimal',
    footer: 'centered',
    nav: 'transparent',
  },
  extras: {
    heroOverlay: 'rgba(255,248,240,0.08)',
    portfolioCols: { desktop: 3, mobile: 2 },
    portfolioGap: 6,
  },
};

const LINEN: TemplateConfig = {
  id: 'linen',
  name: 'Linen',
  tagline: 'Clean · Minimal · Confident',
  description: 'The everyday professional. Maximum confidence with zero excess.',
  colors: {
    bg: '#FFFFFF',
    text: '#111111',
    textSecondary: '#999999',
    accent: '#1A1A1A',
    border: '#F0F0F0',
    cardBg: '#FFFFFF',
    heroBg: '#FFFFFF',
    heroText: '#111111',
    navBg: '#FFFFFF',
    navText: '#111111',
    navScrollBg: '#FFFFFF',
    navScrollText: '#111111',
    footerBg: '#F8F8F8',
    footerText: '#111111',
    footerSecondary: '#999999',
  },
  fonts: {
    display: "'Cormorant Garamond', Georgia, serif",
    displayWeight: '400',
    displayStyle: 'normal',
    ui: "'DM Sans', sans-serif",
    uiWeight: '400',
  },
  sections: {
    hero: 'split-left',
    about: 'full-width-image',
    portfolio: 'uniform',
    services: 'cards',
    testimonials: 'horizontal-scroll',
    contact: 'two-col',
    footer: 'two-col',
    nav: 'solid',
  },
  extras: {
    portfolioCols: { desktop: 3, mobile: 2 },
    portfolioGap: 3,
  },
};

const VESPER: TemplateConfig = {
  id: 'vesper',
  name: 'Vesper',
  tagline: 'Warm · Golden · Moody',
  description: 'For storytelling photographers. The feeling of 5pm light through a dusty window.',
  colors: {
    bg: '#FAF7F2',
    text: '#1E1916',
    textSecondary: '#999999',
    accent: '#B8873A',
    border: '#EBE5DB',
    cardBg: '#FAF7F2',
    heroBg: 'transparent',
    heroText: '#FFFFFF',
    navBg: 'transparent',
    navText: '#FFFFFF',
    navScrollBg: '#FAF7F2',
    navScrollText: '#1E1916',
    footerBg: '#1E1916',
    footerText: '#FAF7F2',
    footerSecondary: '#999999',
  },
  fonts: {
    display: "'Cormorant Garamond', Georgia, serif",
    displayWeight: '400',
    displayStyle: 'italic',
    ui: "'DM Sans', sans-serif",
    uiWeight: '400',
  },
  sections: {
    hero: 'bottom-left',
    about: 'two-col',
    portfolio: 'editorial',
    services: 'list',
    testimonials: 'dark-break',
    contact: 'minimal',
    footer: 'dark-bar',
    nav: 'transparent',
  },
  extras: {
    heroOverlay: 'linear-gradient(to bottom, transparent 40%, rgba(20,14,8,0.4) 100%)',
    portfolioGap: 8,
    imageFilter: 'sepia(15%) saturate(90%)',
  },
};

const ALABASTER: TemplateConfig = {
  id: 'alabaster',
  name: 'Alabaster',
  tagline: 'Crisp · High fashion · Editorial',
  description: 'For luxury brand photographers. A Vogue editorial in website form.',
  colors: {
    bg: '#FFFFFF',
    text: '#0A0A0A',
    textSecondary: '#999999',
    accent: '#0A0A0A',
    border: '#E0E0E0',
    cardBg: '#FFFFFF',
    heroBg: '#FFFFFF',
    heroText: '#0A0A0A',
    navBg: '#FFFFFF',
    navText: '#0A0A0A',
    navScrollBg: '#FFFFFF',
    navScrollText: '#0A0A0A',
    footerBg: '#0A0A0A',
    footerText: '#FFFFFF',
    footerSecondary: '#555555',
  },
  fonts: {
    display: "'Cormorant Garamond', Georgia, serif",
    displayWeight: '300',
    displayStyle: 'normal',
    ui: "'DM Sans', sans-serif",
    uiWeight: '300',
  },
  sections: {
    hero: 'split-right',
    about: 'typography-first',
    portfolio: 'two-col',
    services: 'numbered',
    testimonials: 'single-centered',
    contact: 'split-dark',
    footer: 'dark-bar',
    nav: 'solid',
  },
  extras: {
    portfolioCols: { desktop: 2, mobile: 1 },
    portfolioGap: 2,
  },
};

const HEIRLOOM: TemplateConfig = {
  id: 'heirloom',
  name: 'Heirloom',
  tagline: 'Film · Vintage · Storytelling',
  description: 'For documentary and lifestyle photographers. Nostalgic but never kitsch.',
  colors: {
    bg: '#F5F0E8',
    text: '#2A2118',
    textSecondary: '#5A4A3A',
    accent: '#8B6914',
    border: '#E8E0D0',
    cardBg: '#F5F0E8',
    heroBg: 'transparent',
    heroText: '#FFFFFF',
    navBg: '#F5F0E8',
    navText: '#2A2118',
    navScrollBg: '#F5F0E8',
    navScrollText: '#2A2118',
    footerBg: '#F5F0E8',
    footerText: '#2A2118',
    footerSecondary: '#999999',
  },
  fonts: {
    display: "'Cormorant Garamond', Georgia, serif",
    displayWeight: '400',
    displayStyle: 'normal',
    ui: "'DM Sans', sans-serif",
    uiWeight: '400',
  },
  sections: {
    hero: 'centered',
    about: 'full-width-image',
    portfolio: 'masonry',
    services: 'numbered',
    testimonials: 'single-centered',
    contact: 'minimal',
    footer: 'centered',
    nav: 'masthead',
  },
  extras: {
    filmGrainOpacity: 0.04,
    heroFrameBorder: '1px solid rgba(255,255,255,0.3)',
    heroFrameInset: 12,
    imageFilter: 'saturate(88%)',
    imageHoverFilter: 'saturate(100%)',
    portfolioCols: { desktop: 3, mobile: 2 },
    portfolioGap: 10,
    yearEstablished: '2019',
  },
};

/* ── Registry ── */

export const TEMPLATES: Record<TemplateId, TemplateConfig> = {
  reverie: REVERIE,
  linen: LINEN,
  vesper: VESPER,
  alabaster: ALABASTER,
  heirloom: HEIRLOOM,
};

export const TEMPLATE_LIST: TemplateConfig[] = [REVERIE, LINEN, VESPER, ALABASTER, HEIRLOOM];

export function getTemplate(id: string): TemplateConfig {
  return TEMPLATES[id as TemplateId] || REVERIE;
}

export function clearTemplateCache() {
  // placeholder for query invalidation
}
