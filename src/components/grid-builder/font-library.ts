/**
 * Professional font library with dynamic Google Fonts loading,
 * caching, categories, and font pairing suggestions.
 */

// ─── Font Categories ─────────────────────────────

export type FontCategory = 'sans' | 'serif' | 'display' | 'script';

export interface FontDef {
  family: string;
  category: FontCategory;
  weights: number[];
  hasItalic?: boolean;
}

export interface FontPairing {
  title: FontDef;
  body: FontDef;
  label: string;
}

export const FONT_CATEGORIES: { key: FontCategory; label: string }[] = [
  { key: 'sans', label: 'Sans Serif' },
  { key: 'serif', label: 'Serif' },
  { key: 'display', label: 'Display' },
  { key: 'script', label: 'Script' },
];

// ─── Full Font Library ───────────────────────────

export const FONT_LIBRARY: FontDef[] = [
  // Sans-serif
  { family: 'Inter', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true },
  { family: 'Poppins', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true },
  { family: 'Montserrat', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true },
  { family: 'DM Sans', category: 'sans', weights: [400, 500, 700], hasItalic: true },
  { family: 'Roboto', category: 'sans', weights: [100, 300, 400, 500, 700, 900], hasItalic: true },
  { family: 'Open Sans', category: 'sans', weights: [300, 400, 500, 600, 700, 800], hasItalic: true },
  { family: 'Lato', category: 'sans', weights: [100, 300, 400, 700, 900], hasItalic: true },
  { family: 'Nunito', category: 'sans', weights: [200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true },
  { family: 'Raleway', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true },
  { family: 'Work Sans', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true },
  { family: 'Jost', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true },

  // Serif
  { family: 'Playfair Display', category: 'serif', weights: [400, 500, 600, 700, 800, 900], hasItalic: true },
  { family: 'Lora', category: 'serif', weights: [400, 500, 600, 700], hasItalic: true },
  { family: 'Merriweather', category: 'serif', weights: [300, 400, 700, 900], hasItalic: true },
  { family: 'Libre Baskerville', category: 'serif', weights: [400, 700], hasItalic: true },
  { family: 'Cormorant Garamond', category: 'serif', weights: [300, 400, 500, 600, 700], hasItalic: true },
  { family: 'EB Garamond', category: 'serif', weights: [400, 500, 600, 700, 800], hasItalic: true },
  { family: 'Bodoni Moda', category: 'serif', weights: [400, 500, 600, 700, 800, 900], hasItalic: true },
  { family: 'DM Serif Display', category: 'serif', weights: [400], hasItalic: true },

  // Display / Headline
  { family: 'Bebas Neue', category: 'display', weights: [400] },
  { family: 'Oswald', category: 'display', weights: [200, 300, 400, 500, 600, 700] },
  { family: 'Anton', category: 'display', weights: [400] },
  { family: 'League Spartan', category: 'display', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Abril Fatface', category: 'display', weights: [400] },
  { family: 'Righteous', category: 'display', weights: [400] },
  { family: 'Fredoka', category: 'display', weights: [300, 400, 500, 600, 700] },

  // Script / Decorative
  { family: 'Pacifico', category: 'script', weights: [400] },
  { family: 'Lobster', category: 'script', weights: [400] },
  { family: 'Great Vibes', category: 'script', weights: [400] },
  { family: 'Dancing Script', category: 'script', weights: [400, 500, 600, 700] },
  { family: 'Allura', category: 'script', weights: [400] },
  { family: 'Parisienne', category: 'script', weights: [400] },
  { family: 'Alex Brush', category: 'script', weights: [400] },
  { family: 'Sacramento', category: 'script', weights: [400] },
];

// ─── Font Pairing Suggestions ────────────────────

const findFont = (name: string) => FONT_LIBRARY.find(f => f.family === name)!;

export const FONT_PAIRINGS: FontPairing[] = [
  { title: findFont('Playfair Display'), body: findFont('Inter'), label: 'Classic Editorial' },
  { title: findFont('Montserrat'), body: findFont('Lora'), label: 'Modern Warmth' },
  { title: findFont('Bebas Neue'), body: findFont('Open Sans'), label: 'Bold Impact' },
  { title: findFont('Cormorant Garamond'), body: findFont('Jost'), label: 'Luxury Minimal' },
  { title: findFont('Abril Fatface'), body: findFont('Poppins'), label: 'Statement Pair' },
  { title: findFont('Oswald'), body: findFont('Lato'), label: 'Clean Power' },
  { title: findFont('Great Vibes'), body: findFont('DM Sans'), label: 'Romantic Modern' },
  { title: findFont('League Spartan'), body: findFont('Merriweather'), label: 'Strong + Readable' },
];

// ─── Dynamic Font Loading ────────────────────────

const loadedFonts = new Set<string>();
const loadingPromises = new Map<string, Promise<void>>();

/**
 * Dynamically loads a Google Font. Caches to prevent re-fetching.
 * Returns a promise that resolves when the font is ready.
 */
export function loadFont(family: string, weights?: number[]): Promise<void> {
  if (loadedFonts.has(family)) return Promise.resolve();
  if (loadingPromises.has(family)) return loadingPromises.get(family)!;

  const fontDef = FONT_LIBRARY.find(f => f.family === family);
  const wghts = weights || fontDef?.weights || [400];
  const wghtStr = wghts.join(';');
  const encoded = family.replace(/ /g, '+');

  const url = `https://fonts.googleapis.com/css2?family=${encoded}:wght@${wghtStr}&display=swap`;

  const promise = new Promise<void>((resolve) => {
    // Check if already in DOM
    if (document.querySelector(`link[data-font="${family}"]`)) {
      loadedFonts.add(family);
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.setAttribute('data-font', family);
    link.onload = () => {
      loadedFonts.add(family);
      loadingPromises.delete(family);
      resolve();
    };
    link.onerror = () => {
      loadingPromises.delete(family);
      resolve(); // Don't block on error
    };
    document.head.appendChild(link);
  });

  loadingPromises.set(family, promise);
  return promise;
}

/**
 * Preloads a set of commonly used fonts for instant availability.
 */
export function preloadCommonFonts(): void {
  const common = ['Inter', 'Playfair Display', 'Montserrat', 'Bebas Neue', 'Great Vibes', 'Cormorant Garamond', 'DM Sans', 'Poppins'];
  common.forEach(f => loadFont(f));
}

/** Check if a font is already loaded */
export function isFontLoaded(family: string): boolean {
  return loadedFonts.has(family);
}

// ─── Recently Used & Favorites (localStorage) ────

const RECENTS_KEY = 'grid-builder-recent-fonts';
const FAVORITES_KEY = 'grid-builder-favorite-fonts';
const MAX_RECENTS = 8;

export function getRecentFonts(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]');
  } catch { return []; }
}

export function addRecentFont(family: string): void {
  const recents = getRecentFonts().filter(f => f !== family);
  recents.unshift(family);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS)));
}

export function getFavoriteFonts(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch { return []; }
}

export function toggleFavoriteFont(family: string): boolean {
  const favs = getFavoriteFonts();
  const idx = favs.indexOf(family);
  if (idx >= 0) {
    favs.splice(idx, 1);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return false;
  } else {
    favs.push(family);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return true;
  }
}
