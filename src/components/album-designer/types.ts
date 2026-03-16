/* ───────────────────────────────────────────────
   ALBUM CORE TYPES — Spread-based architecture
   ─────────────────────────────────────────────── */

export type AlbumSize = "12x36" | "12x24" | "10x30" | "10x24" | "8x24";

export type CoverType = "hardcover" | "softcover" | "layflat";

export type AlbumStatus = "draft" | "review" | "approved" | "print";

/* ─── Spread Dimensions ─── */

export interface SpreadDimensions {
  label: string;
  /** Spread width in inches (left + right page) */
  spreadWidthIn: number;
  /** Spread height in inches */
  spreadHeightIn: number;
  /** Print pixels at 300 DPI */
  spreadWidthPx: number;
  spreadHeightPx: number;
  /** Aspect ratio (width / height) */
  aspectRatio: number;
  bleedMm: number;
  safeMarginMm: number;
}

export const SPREAD_SIZES: Record<AlbumSize, SpreadDimensions> = {
  "12x36": {
    label: "12 × 36 (Default)",
    spreadWidthIn: 36,
    spreadHeightIn: 12,
    spreadWidthPx: 10800,
    spreadHeightPx: 3600,
    aspectRatio: 3,
    bleedMm: 3,
    safeMarginMm: 5,
  },
  "12x24": {
    label: "12 × 24",
    spreadWidthIn: 24,
    spreadHeightIn: 12,
    spreadWidthPx: 7200,
    spreadHeightPx: 3600,
    aspectRatio: 2,
    bleedMm: 3,
    safeMarginMm: 5,
  },
  "10x30": {
    label: "10 × 30",
    spreadWidthIn: 30,
    spreadHeightIn: 10,
    spreadWidthPx: 9000,
    spreadHeightPx: 3000,
    aspectRatio: 3,
    bleedMm: 3,
    safeMarginMm: 5,
  },
  "10x24": {
    label: "10 × 24",
    spreadWidthIn: 24,
    spreadHeightIn: 10,
    spreadWidthPx: 7200,
    spreadHeightPx: 3000,
    aspectRatio: 2.4,
    bleedMm: 3,
    safeMarginMm: 5,
  },
  "8x24": {
    label: "8 × 24",
    spreadWidthIn: 24,
    spreadHeightIn: 8,
    spreadWidthPx: 7200,
    spreadHeightPx: 2400,
    aspectRatio: 3,
    bleedMm: 3,
    safeMarginMm: 5,
  },
};

/* ─── Frame: a photo container on a spread ─── */

export interface SpreadFrame {
  id: string;
  /** Position & size as % of spread (0-100) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Image placed in this frame */
  imageUrl: string | null;
  /** Crop offset inside frame (px of image relative to frame center) */
  panX: number;
  panY: number;
  /** Zoom level (1 = fill, >1 = zoomed in) */
  zoom: number;
  rotation: number;
}

export function createFrame(partial: Partial<SpreadFrame> = {}): SpreadFrame {
  return {
    id: crypto.randomUUID(),
    x: 0, y: 0, w: 100, h: 100,
    imageUrl: null,
    panX: 0, panY: 0, zoom: 1, rotation: 0,
    ...partial,
  };
}

/* ─── Spread Layout Preset ─── */

export interface LayoutPreset {
  id: string;
  name: string;
  category: "hero" | "grid" | "collage" | "portrait" | "panorama" | "mixed";
  photoCount: number;
  /** Frame definitions as % of spread */
  frames: Array<{ x: number; y: number; w: number; h: number }>;
}

/* ─── 15 Professional Presets ─── */

export const ALBUM_PRESETS: LayoutPreset[] = [
  // Hero layouts
  { id: "full-spread", name: "Full Spread Hero", category: "hero", photoCount: 1,
    frames: [{ x: 0, y: 0, w: 100, h: 100 }] },
  { id: "hero-left", name: "Hero + Side", category: "hero", photoCount: 2,
    frames: [{ x: 0, y: 0, w: 66, h: 100 }, { x: 67, y: 0, w: 33, h: 100 }] },
  { id: "hero-3", name: "Hero + 3 Strip", category: "hero", photoCount: 4,
    frames: [
      { x: 0, y: 0, w: 60, h: 100 },
      { x: 61, y: 0, w: 39, h: 32 },
      { x: 61, y: 34, w: 39, h: 32 },
      { x: 61, y: 68, w: 39, h: 32 },
    ] },

  // Grid layouts
  { id: "grid-2h", name: "Two Horizontal", category: "grid", photoCount: 2,
    frames: [{ x: 0, y: 0, w: 49, h: 100 }, { x: 51, y: 0, w: 49, h: 100 }] },
  { id: "grid-2v", name: "Two Vertical", category: "grid", photoCount: 2,
    frames: [{ x: 0, y: 0, w: 100, h: 48 }, { x: 0, y: 52, w: 100, h: 48 }] },
  { id: "grid-4", name: "Four Grid", category: "grid", photoCount: 4,
    frames: [
      { x: 0, y: 0, w: 49, h: 48 }, { x: 51, y: 0, w: 49, h: 48 },
      { x: 0, y: 52, w: 49, h: 48 }, { x: 51, y: 52, w: 49, h: 48 },
    ] },
  { id: "grid-6", name: "Six Grid", category: "grid", photoCount: 6,
    frames: [
      { x: 0, y: 0, w: 32, h: 48 }, { x: 34, y: 0, w: 32, h: 48 }, { x: 68, y: 0, w: 32, h: 48 },
      { x: 0, y: 52, w: 32, h: 48 }, { x: 34, y: 52, w: 32, h: 48 }, { x: 68, y: 52, w: 32, h: 48 },
    ] },

  // Portrait layouts
  { id: "portrait-3", name: "Three Portraits", category: "portrait", photoCount: 3,
    frames: [
      { x: 2, y: 5, w: 30, h: 90 },
      { x: 35, y: 5, w: 30, h: 90 },
      { x: 68, y: 5, w: 30, h: 90 },
    ] },
  { id: "portrait-center", name: "Center Portrait", category: "portrait", photoCount: 1,
    frames: [{ x: 25, y: 5, w: 50, h: 90 }] },

  // Panorama
  { id: "panorama-top", name: "Panorama + Strip", category: "panorama", photoCount: 4,
    frames: [
      { x: 0, y: 0, w: 100, h: 60 },
      { x: 0, y: 63, w: 32, h: 37 },
      { x: 34, y: 63, w: 32, h: 37 },
      { x: 68, y: 63, w: 32, h: 37 },
    ] },
  { id: "panorama-full", name: "Full Panorama", category: "panorama", photoCount: 1,
    frames: [{ x: 0, y: 15, w: 100, h: 70 }] },

  // Collage layouts
  { id: "collage-5", name: "5 Photo Collage", category: "collage", photoCount: 5,
    frames: [
      { x: 0, y: 0, w: 40, h: 60 },
      { x: 42, y: 0, w: 28, h: 48 },
      { x: 72, y: 0, w: 28, h: 48 },
      { x: 0, y: 62, w: 50, h: 38 },
      { x: 52, y: 50, w: 48, h: 50 },
    ] },
  { id: "collage-mosaic", name: "Mosaic", category: "collage", photoCount: 5,
    frames: [
      { x: 0, y: 0, w: 60, h: 55 },
      { x: 62, y: 0, w: 38, h: 35 },
      { x: 62, y: 37, w: 38, h: 63 },
      { x: 0, y: 57, w: 30, h: 43 },
      { x: 32, y: 57, w: 28, h: 43 },
    ] },

  // Mixed
  { id: "mixed-magazine", name: "Magazine Layout", category: "mixed", photoCount: 4,
    frames: [
      { x: 0, y: 0, w: 55, h: 65 },
      { x: 57, y: 0, w: 43, h: 45 },
      { x: 57, y: 47, w: 43, h: 53 },
      { x: 0, y: 67, w: 55, h: 33 },
    ] },
  { id: "mixed-editorial", name: "Editorial", category: "mixed", photoCount: 3,
    frames: [
      { x: 0, y: 0, w: 45, h: 100 },
      { x: 47, y: 0, w: 53, h: 55 },
      { x: 47, y: 57, w: 53, h: 43 },
    ] },
];

/* ─── Leaf presets ─── */

export const LEAF_PRESETS = [
  { leaves: 15, label: "15 Leaf = 15 Spreads" },
  { leaves: 20, label: "20 Leaf = 20 Spreads" },
  { leaves: 30, label: "30 Leaf = 30 Spreads" },
  { leaves: 40, label: "40 Leaf = 40 Spreads" },
];

/* ─── DB types ─── */

export interface Album {
  id: string;
  user_id: string;
  event_id: string | null;
  name: string;
  size: AlbumSize;
  cover_type: CoverType;
  leaf_count: number;
  page_count: number;
  status: AlbumStatus;
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

/* ─── Helpers ─── */

export function getSpreadSize(size: AlbumSize) {
  return SPREAD_SIZES[size];
}

// Keep backward compat aliases
export type AlbumDimensions = SpreadDimensions;
export const ALBUM_SIZES = SPREAD_SIZES;
export function getAlbumPageSize(size: AlbumSize) {
  const s = SPREAD_SIZES[size];
  return { widthPx: s.spreadWidthPx / 2, heightPx: s.spreadHeightPx };
}
export function getAlbumSpreadSize(size: AlbumSize) {
  const s = SPREAD_SIZES[size];
  return { widthPx: s.spreadWidthPx, heightPx: s.spreadHeightPx };
}
export function getTotalPages(leafCount: number) {
  return leafCount * 2;
}
