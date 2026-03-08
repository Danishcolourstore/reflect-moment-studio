/**
 * Text overlay types, font definitions, and quick-apply presets
 * for cinematic wedding typography in Grid Builder.
 */

export interface TextLayer {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  color: string;
  opacity: number;
  shadow: TextShadow | null;
  alignment: 'left' | 'center' | 'right';
  /** Position as percentage of container width/height */
  x: number;
  y: number;
  rotation: number;
  scale: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textTransform: 'none' | 'uppercase' | 'lowercase';
  /** Advanced styling */
  underline?: boolean;
  stroke?: TextStroke | null;
  bgHighlight?: string | null;
  gradientColors?: [string, string] | null;
}

export interface TextShadow {
  x: number;
  y: number;
  blur: number;
  color: string;
}

// ─── Font Groups ───────────────────────────────

export interface FontOption {
  family: string;
  label: string;
  group: 'serif' | 'sans' | 'script';
  weights: number[];
}

export const FONT_GROUPS = [
  { key: 'serif' as const, label: 'Editorial Serif' },
  { key: 'sans' as const, label: 'Modern Sans' },
  { key: 'script' as const, label: 'Romantic Script' },
];

export const FONTS: FontOption[] = [
  // Editorial Serif
  { family: 'Playfair Display', label: 'Playfair Display', group: 'serif', weights: [400, 500, 600, 700] },
  { family: 'Cormorant Garamond', label: 'Cormorant Garamond', group: 'serif', weights: [300, 400, 500, 600, 700] },
  { family: 'Bodoni Moda', label: 'Bodoni Moda', group: 'serif', weights: [400, 500, 600, 700] },
  { family: 'DM Serif Display', label: 'DM Serif Display', group: 'serif', weights: [400] },

  // Modern Minimal Sans
  { family: 'Inter', label: 'Inter', group: 'sans', weights: [300, 400, 500, 600, 700] },
  { family: 'Poppins', label: 'Poppins', group: 'sans', weights: [300, 400, 500, 600, 700] },
  { family: 'DM Sans', label: 'DM Sans', group: 'sans', weights: [400, 500, 700] },
  { family: 'Montserrat', label: 'Montserrat', group: 'sans', weights: [300, 400, 500, 600, 700] },

  // Romantic Script
  { family: 'Great Vibes', label: 'Great Vibes', group: 'script', weights: [400] },
  { family: 'Allura', label: 'Allura', group: 'script', weights: [400] },
  { family: 'Parisienne', label: 'Parisienne', group: 'script', weights: [400] },
  { family: 'Alex Brush', label: 'Alex Brush', group: 'script', weights: [400] },
];

// ─── Quick Presets ─────────────────────────────

export interface TextPreset {
  id: string;
  label: string;
  description: string;
  preview: string;
  layer: Partial<TextLayer>;
}

export const TEXT_PRESETS: TextPreset[] = [
  {
    id: 'wedding-title',
    label: 'Wedding Title',
    description: 'Large editorial serif, centered',
    preview: 'ANANYA & RAHUL',
    layer: {
      text: 'ANANYA & RAHUL',
      fontFamily: 'Cormorant Garamond',
      fontSize: 32,
      fontWeight: 400,
      fontStyle: 'normal',
      letterSpacing: 8,
      lineHeight: 1.2,
      color: '#ffffff',
      opacity: 1,
      alignment: 'center',
      textTransform: 'uppercase',
      shadow: { x: 0, y: 2, blur: 12, color: 'rgba(0,0,0,0.5)' },
    },
  },
  {
    id: 'location-tag',
    label: 'Location Tag',
    description: 'Small uppercase sans, spaced',
    preview: 'KOCHI • INDIA',
    layer: {
      text: 'KOCHI • INDIA',
      fontFamily: 'Montserrat',
      fontSize: 12,
      fontWeight: 400,
      fontStyle: 'normal',
      letterSpacing: 6,
      lineHeight: 1.4,
      color: '#ffffff',
      opacity: 0.9,
      alignment: 'center',
      textTransform: 'uppercase',
      shadow: { x: 0, y: 1, blur: 6, color: 'rgba(0,0,0,0.4)' },
    },
  },
  {
    id: 'date-style',
    label: 'Date',
    description: 'Minimal sans serif',
    preview: 'MARCH 2026',
    layer: {
      text: 'MARCH 2026',
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: 300,
      fontStyle: 'normal',
      letterSpacing: 5,
      lineHeight: 1.4,
      color: '#ffffff',
      opacity: 0.85,
      alignment: 'center',
      textTransform: 'uppercase',
      shadow: { x: 0, y: 1, blur: 4, color: 'rgba(0,0,0,0.35)' },
    },
  },
  {
    id: 'editorial-quote',
    label: 'Editorial Quote',
    description: 'Italic serif or script accent',
    preview: '"A beautiful beginning"',
    layer: {
      text: '"A beautiful beginning"',
      fontFamily: 'Playfair Display',
      fontSize: 18,
      fontWeight: 400,
      fontStyle: 'italic',
      letterSpacing: 1,
      lineHeight: 1.5,
      color: '#ffffff',
      opacity: 0.95,
      alignment: 'center',
      textTransform: 'none',
      shadow: { x: 0, y: 2, blur: 8, color: 'rgba(0,0,0,0.4)' },
    },
  },
  {
    id: 'romantic-name',
    label: 'Romantic Name',
    description: 'Elegant script accent',
    preview: 'Forever Yours',
    layer: {
      text: 'Forever Yours',
      fontFamily: 'Great Vibes',
      fontSize: 36,
      fontWeight: 400,
      fontStyle: 'normal',
      letterSpacing: 1,
      lineHeight: 1.3,
      color: '#ffffff',
      opacity: 1,
      alignment: 'center',
      textTransform: 'none',
      shadow: { x: 0, y: 2, blur: 10, color: 'rgba(0,0,0,0.45)' },
    },
  },
];

// ─── Helpers ───────────────────────────────────

let _idCounter = 0;

export function createTextLayer(preset?: Partial<TextLayer>): TextLayer {
  _idCounter++;
  return {
    id: `text-${Date.now()}-${_idCounter}`,
    text: 'Your Text',
    fontFamily: 'Cormorant Garamond',
    fontSize: 24,
    fontWeight: 400,
    fontStyle: 'normal',
    letterSpacing: 2,
    lineHeight: 1.3,
    color: '#ffffff',
    opacity: 1,
    shadow: null,
    alignment: 'center',
    x: 50,
    y: 50,
    rotation: 0,
    scale: 1,
    textTransform: 'none',
    ...preset,
  };
}

/** Google Fonts URL for all typography fonts */
export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Bodoni+Moda:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&family=Great+Vibes&family=Allura&family=Parisienne&family=Alex+Brush&display=swap';
