import type { RefynToolValues } from './refyn-types';

export interface RefynFilter {
  id: string;
  name: string;
  category: string;
  values: Partial<RefynToolValues>;
  /** Additional CSS filter overrides: brightness, contrast, saturate, sepia, hueRotate, blur */
  cssOverrides?: {
    brightness?: number;
    contrast?: number;
    saturate?: number;
    sepia?: number;
    hueRotate?: number;
    temperature?: number; // warm/cool shift
  };
}

export interface FilterCategory {
  id: string;
  label: string;
  filters: RefynFilter[];
}

const mkFilter = (
  id: string,
  name: string,
  category: string,
  values: Partial<RefynToolValues>,
  cssOverrides?: RefynFilter['cssOverrides']
): RefynFilter => ({ id, name, category, values, cssOverrides });

// ── YOUR FILTERS (always visible at top) ──
export const USER_FILTERS: RefynFilter[] = [
  mkFilter('glow', 'Glow', 'yours', { lumina: 72, ghostLight: 55, sculpt: 10 }, { brightness: 1.08 }),
  mkFilter('black-mist', 'Black Mist', 'yours', { lumina: 30, ghostLight: 65, sculpt: 5, grain: { style: 'film', strength: 18, shadowsOnly: true } }, { contrast: 0.88, brightness: 0.96 }),
  mkFilter('white-mist', 'White Mist', 'yours', { lumina: 68, ghostLight: 70, sculpt: 8 }, { brightness: 1.12, contrast: 0.9, saturate: 0.85 }),
  mkFilter('polished', 'Polished', 'yours', { frequency: 55, lumina: 45, sculpt: 40, outfit: 60, jewellery: 55, hair: 45 }, { contrast: 1.1, saturate: 1.05 }),
  mkFilter('nd-filter', 'ND Filter', 'yours', { lumina: 20, ghostLight: 15, sculpt: 35 }, { brightness: 0.82, contrast: 1.15, saturate: 0.9 }),
  mkFilter('cosmetic', 'Cosmetic', 'yours', { frequency: 70, lumina: 55, sculpt: 20, hair: 40, outfit: 30 }, { brightness: 1.04, saturate: 1.08 }),
];

// ── ATMOSPHERE ──
const ATMOSPHERE: RefynFilter[] = [
  mkFilter('haze', 'Haze', 'atmosphere', { lumina: 50, ghostLight: 60 }, { brightness: 1.06, contrast: 0.85, saturate: 0.88 }),
  mkFilter('fog-veil', 'Fog Veil', 'atmosphere', { lumina: 65, ghostLight: 72 }, { brightness: 1.1, contrast: 0.8, saturate: 0.75 }),
  mkFilter('cinematic-smoke', 'Cinematic Smoke', 'atmosphere', { lumina: 35, ghostLight: 55, grain: { style: 'film', strength: 25, shadowsOnly: true } }, { brightness: 0.92, contrast: 1.08 }),
  mkFilter('dust-light', 'Dust & Light', 'atmosphere', { lumina: 58, ghostLight: 48 }, { brightness: 1.08, sepia: 0.08, saturate: 0.92 }),
  mkFilter('golden-air', 'Golden Air', 'atmosphere', { lumina: 62, ghostLight: 45 }, { brightness: 1.06, sepia: 0.15, saturate: 1.1, temperature: 15 }),
  mkFilter('blue-hour', 'Blue Hour', 'atmosphere', { lumina: 38, ghostLight: 30, sculpt: 25 }, { brightness: 0.94, saturate: 0.85, hueRotate: 10 }),
];

// ── SKIN & PORTRAIT ──
const SKIN_PORTRAIT: RefynFilter[] = [
  mkFilter('silk-skin', 'Silk Skin', 'skin', { frequency: 75, lumina: 50, sculpt: 15 }, { brightness: 1.04, saturate: 1.02 }),
  mkFilter('porcelain', 'Porcelain', 'skin', { frequency: 80, lumina: 60, sculpt: 10 }, { brightness: 1.08, contrast: 0.95, saturate: 0.9 }),
  mkFilter('soft-diffuse', 'Soft Diffuse', 'skin', { frequency: 60, lumina: 55, ghostLight: 40 }, { brightness: 1.06, contrast: 0.9 }),
  mkFilter('candlelit', 'Candlelit', 'skin', { frequency: 45, lumina: 48, ghostLight: 35 }, { brightness: 0.96, sepia: 0.12, saturate: 1.1 }),
  mkFilter('bare-skin', 'Bare Skin', 'skin', { frequency: 35, lumina: 30, sculpt: 30 }, { contrast: 1.05 }),
  mkFilter('flush', 'Flush', 'skin', { frequency: 55, lumina: 52 }, { brightness: 1.02, saturate: 1.15, sepia: 0.05 }),
];

// ── TEXTURE & MOOD ──
const TEXTURE_MOOD: RefynFilter[] = [
  mkFilter('film-grain-f', 'Film Grain', 'texture', { grain: { style: 'film', strength: 45, shadowsOnly: false }, layerTexture: 65 }, { contrast: 1.06 }),
  mkFilter('velvet-dark', 'Velvet Dark', 'texture', { sculpt: 45, layerTexture: 70, layerTone: 30 }, { brightness: 0.88, contrast: 1.15, saturate: 0.92 }),
  mkFilter('raw-edge', 'Raw Edge', 'texture', { sculpt: 55, layerTexture: 75, grain: { style: 'texture', strength: 30, shadowsOnly: false } }, { contrast: 1.2, saturate: 0.88 }),
  mkFilter('bleach-bypass', 'Bleach Bypass', 'texture', { sculpt: 40, layerTone: 25 }, { contrast: 1.25, saturate: 0.6, brightness: 1.04 }),
  mkFilter('matte-clay', 'Matte Clay', 'texture', { layerTexture: 60, layerTone: 55 }, { contrast: 0.92, saturate: 0.82, sepia: 0.08 }),
  mkFilter('oxidized', 'Oxidized', 'texture', { grain: { style: 'texture', strength: 35, shadowsOnly: true }, layerTone: 40 }, { sepia: 0.18, saturate: 0.78, contrast: 1.08 }),
];

// ── LIGHT EFFECTS ──
const LIGHT_EFFECTS: RefynFilter[] = [
  mkFilter('lens-flare', 'Lens Flare', 'light', { ghostLight: 80, lumina: 55 }, { brightness: 1.12 }),
  mkFilter('aura', 'Aura', 'light', { ghostLight: 65, lumina: 60 }, { brightness: 1.08, saturate: 1.1 }),
  mkFilter('sun-bleed', 'Sun Bleed', 'light', { ghostLight: 75, lumina: 65 }, { brightness: 1.15, sepia: 0.1, contrast: 0.88 }),
  mkFilter('prism', 'Prism', 'light', { ghostLight: 50, lumina: 48 }, { saturate: 1.25, brightness: 1.06 }),
  mkFilter('backlit-burn', 'Backlit Burn', 'light', { ghostLight: 70, lumina: 42, sculpt: 35 }, { brightness: 1.1, contrast: 1.12 }),
  mkFilter('halation', 'Halation', 'light', { ghostLight: 72, lumina: 58 }, { brightness: 1.08, contrast: 0.92, saturate: 1.05 }),
];

// ── DARK SERIES ──
const DARK_SERIES: RefynFilter[] = [
  mkFilter('noir-crush', 'Noir Crush', 'dark', { sculpt: 60, layerTone: 20 }, { brightness: 0.78, contrast: 1.35, saturate: 0.4 }),
  mkFilter('midnight', 'Midnight', 'dark', { sculpt: 45, lumina: 15 }, { brightness: 0.82, contrast: 1.2, saturate: 0.7, hueRotate: 5 }),
  mkFilter('shadow-lift', 'Shadow Lift', 'dark', { sculpt: 30, lumina: 35 }, { brightness: 0.9, contrast: 0.95 }),
  mkFilter('deep-slate', 'Deep Slate', 'dark', { sculpt: 50, layerTone: 28 }, { brightness: 0.85, contrast: 1.1, saturate: 0.65 }),
  mkFilter('obsidian', 'Obsidian', 'dark', { sculpt: 55, layerTexture: 70 }, { brightness: 0.8, contrast: 1.3, saturate: 0.5 }),
  mkFilter('cave-light', 'Cave Light', 'dark', { sculpt: 35, lumina: 28, ghostLight: 40 }, { brightness: 0.88, contrast: 1.08, sepia: 0.06 }),
];

// ── CLEAN & EDITORIAL ──
const CLEAN_EDITORIAL: RefynFilter[] = [
  mkFilter('glass-skin', 'Glass Skin', 'clean', { frequency: 72, lumina: 55, sculpt: 20 }, { brightness: 1.06, contrast: 1.05, saturate: 0.95 }),
  mkFilter('studio-white', 'Studio White', 'clean', { lumina: 65, frequency: 50 }, { brightness: 1.14, contrast: 0.95, saturate: 0.88 }),
  mkFilter('pressed', 'Pressed', 'clean', { sculpt: 38, frequency: 48, outfit: 45 }, { contrast: 1.12, saturate: 0.95 }),
  mkFilter('high-key', 'High Key', 'clean', { lumina: 75, ghostLight: 50 }, { brightness: 1.18, contrast: 0.85, saturate: 0.82 }),
  mkFilter('sterile', 'Sterile', 'clean', { frequency: 65, lumina: 50, sculpt: 25 }, { saturate: 0.6, contrast: 1.05, brightness: 1.08 }),
  mkFilter('chrome', 'Chrome', 'clean', { sculpt: 42, layerTexture: 60 }, { saturate: 0.35, contrast: 1.15, brightness: 1.02 }),
];

// ── DREAMY & SOFT ──
const DREAMY_SOFT: RefynFilter[] = [
  mkFilter('ethereal', 'Ethereal', 'dreamy', { lumina: 68, ghostLight: 65, frequency: 40 }, { brightness: 1.1, contrast: 0.85, saturate: 0.9 }),
  mkFilter('bloom', 'Bloom', 'dreamy', { lumina: 72, ghostLight: 70 }, { brightness: 1.12, contrast: 0.82 }),
  mkFilter('pastel-drift', 'Pastel Drift', 'dreamy', { lumina: 55, ghostLight: 45 }, { saturate: 0.7, brightness: 1.08, sepia: 0.06 }),
  mkFilter('cloud-wash', 'Cloud Wash', 'dreamy', { lumina: 62, ghostLight: 58 }, { brightness: 1.1, contrast: 0.88, saturate: 0.82 }),
  mkFilter('tender', 'Tender', 'dreamy', { lumina: 50, ghostLight: 38, frequency: 45 }, { brightness: 1.04, saturate: 0.92, sepia: 0.04 }),
  mkFilter('soft-focus', 'Soft Focus', 'dreamy', { lumina: 58, ghostLight: 62, frequency: 50 }, { brightness: 1.06, contrast: 0.88 }),
];

// ── SEASONAL MOOD ──
const SEASONAL: RefynFilter[] = [
  mkFilter('golden-harvest', 'Golden Harvest', 'seasonal', { lumina: 55, ghostLight: 35 }, { sepia: 0.2, saturate: 1.15, brightness: 1.04 }),
  mkFilter('winter-pale', 'Winter Pale', 'seasonal', { lumina: 60, sculpt: 15 }, { brightness: 1.1, saturate: 0.65, contrast: 0.92 }),
  mkFilter('monsoon-grey', 'Monsoon Grey', 'seasonal', { sculpt: 35, layerTone: 35 }, { saturate: 0.55, contrast: 1.08, brightness: 0.94 }),
  mkFilter('petal-spring', 'Petal Spring', 'seasonal', { lumina: 58, frequency: 40 }, { saturate: 1.12, brightness: 1.06, sepia: 0.04 }),
  mkFilter('desert-noon', 'Desert Noon', 'seasonal', { lumina: 45, ghostLight: 55 }, { brightness: 1.1, sepia: 0.12, contrast: 1.1, saturate: 1.05 }),
  mkFilter('ember', 'Ember', 'seasonal', { lumina: 38, ghostLight: 42, sculpt: 40 }, { sepia: 0.15, saturate: 1.1, brightness: 0.95, contrast: 1.12 }),
];

export const FILTER_CATEGORIES: FilterCategory[] = [
  { id: 'atmosphere', label: 'Atmosphere', filters: ATMOSPHERE },
  { id: 'skin', label: 'Skin & Portrait', filters: SKIN_PORTRAIT },
  { id: 'texture', label: 'Texture & Mood', filters: TEXTURE_MOOD },
  { id: 'light', label: 'Light Effects', filters: LIGHT_EFFECTS },
  { id: 'dark', label: 'Dark Series', filters: DARK_SERIES },
  { id: 'clean', label: 'Clean & Editorial', filters: CLEAN_EDITORIAL },
  { id: 'dreamy', label: 'Dreamy & Soft', filters: DREAMY_SOFT },
  { id: 'seasonal', label: 'Seasonal Mood', filters: SEASONAL },
];

export const ALL_FILTERS: RefynFilter[] = [
  ...USER_FILTERS,
  ...ATMOSPHERE,
  ...SKIN_PORTRAIT,
  ...TEXTURE_MOOD,
  ...LIGHT_EFFECTS,
  ...DARK_SERIES,
  ...CLEAN_EDITORIAL,
  ...DREAMY_SOFT,
  ...SEASONAL,
];
