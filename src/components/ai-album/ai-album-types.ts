/* ─── AI Album Builder Types & Presets ─── */

export type IndianAlbumSize =
  | "12x36"
  | "12x30"
  | "10x30"
  | "10x24"
  | "12x24"
  | "8x24";

export interface AlbumSizeSpec {
  label: string;
  widthIn: number;
  heightIn: number;
  widthPx: number; // 300 DPI
  heightPx: number;
  bleedMm: number;
  safeMarginMm: number;
  aspectLabel: string;
}

export const INDIAN_ALBUM_SIZES: Record<IndianAlbumSize, AlbumSizeSpec> = {
  "12x36": {
    label: "12 × 36 inches",
    widthIn: 36,
    heightIn: 12,
    widthPx: 10800,
    heightPx: 3600,
    bleedMm: 3,
    safeMarginMm: 5,
    aspectLabel: "Panoramic (3:1)",
  },
  "12x30": {
    label: "12 × 30 inches",
    widthIn: 30,
    heightIn: 12,
    widthPx: 9000,
    heightPx: 3600,
    bleedMm: 3,
    safeMarginMm: 5,
    aspectLabel: "Wide (5:2)",
  },
  "10x30": {
    label: "10 × 30 inches",
    widthIn: 30,
    heightIn: 10,
    widthPx: 9000,
    heightPx: 3000,
    bleedMm: 3,
    safeMarginMm: 5,
    aspectLabel: "Wide (3:1)",
  },
  "10x24": {
    label: "10 × 24 inches",
    widthIn: 24,
    heightIn: 10,
    widthPx: 7200,
    heightPx: 3000,
    bleedMm: 3,
    safeMarginMm: 5,
    aspectLabel: "Wide (12:5)",
  },
  "12x24": {
    label: "12 × 24 inches",
    widthIn: 24,
    heightIn: 12,
    widthPx: 7200,
    heightPx: 3600,
    bleedMm: 3,
    safeMarginMm: 5,
    aspectLabel: "Standard (2:1)",
  },
  "8x24": {
    label: "8 × 24 inches",
    widthIn: 24,
    heightIn: 8,
    widthPx: 7200,
    heightPx: 2400,
    bleedMm: 3,
    safeMarginMm: 5,
    aspectLabel: "Panoramic (3:1)",
  },
};

/* ─── Design Presets ─── */

export interface DesignPreset {
  id: string;
  name: string;
  description: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  spacing: number; // px between photos
  margins: number; // px safe margin
  borderRadius: number;
  fontFamily: string;
  captionSize: number;
  style: "minimal" | "cinematic" | "editorial" | "traditional" | "luxury" | "grid" | "classic";
  photoArrangement: "balanced" | "hero-heavy" | "grid-heavy" | "cinematic" | "collage";
}

export const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: "minimal-luxury",
    name: "Minimal Luxury",
    description: "Clean whites, generous spacing, understated elegance",
    bgColor: "#FFFFFF",
    textColor: "#1A1A1A",
    accentColor: "#C4A882",
    spacing: 20,
    margins: 40,
    borderRadius: 0,
    fontFamily: "Cormorant Garamond",
    captionSize: 14,
    style: "minimal",
    photoArrangement: "balanced",
  },
  {
    id: "cinematic-dark",
    name: "Cinematic Dark",
    description: "Deep blacks, dramatic framing, film-noir mood",
    bgColor: "#0A0A0A",
    textColor: "#E8E8E8",
    accentColor: "#B8953F",
    spacing: 8,
    margins: 24,
    borderRadius: 0,
    fontFamily: "Playfair Display",
    captionSize: 13,
    style: "cinematic",
    photoArrangement: "cinematic",
  },
  {
    id: "editorial-magazine",
    name: "Editorial Magazine",
    description: "Vogue-inspired layouts with bold typography",
    bgColor: "#F5F5F0",
    textColor: "#1C1C1C",
    accentColor: "#8B4513",
    spacing: 16,
    margins: 32,
    borderRadius: 0,
    fontFamily: "EB Garamond",
    captionSize: 12,
    style: "editorial",
    photoArrangement: "hero-heavy",
  },
  {
    id: "traditional-indian",
    name: "Traditional Indian Wedding",
    description: "Rich golds, ornate feel, celebration of culture",
    bgColor: "#FDF8F0",
    textColor: "#2D1810",
    accentColor: "#B8860B",
    spacing: 12,
    margins: 28,
    borderRadius: 4,
    fontFamily: "Playfair Display",
    captionSize: 14,
    style: "traditional",
    photoArrangement: "collage",
  },
  {
    id: "storytelling-documentary",
    name: "Storytelling Documentary",
    description: "Photojournalistic flow, moments as they happened",
    bgColor: "#F8F6F3",
    textColor: "#333333",
    accentColor: "#6B7B5E",
    spacing: 10,
    margins: 20,
    borderRadius: 0,
    fontFamily: "DM Sans",
    captionSize: 11,
    style: "editorial",
    photoArrangement: "balanced",
  },
  {
    id: "premium-white",
    name: "Premium White Luxury",
    description: "All-white backgrounds, premium gallery feel",
    bgColor: "#FFFFFF",
    textColor: "#2C2C2C",
    accentColor: "#9B8B7A",
    spacing: 24,
    margins: 48,
    borderRadius: 0,
    fontFamily: "Jost",
    captionSize: 12,
    style: "luxury",
    photoArrangement: "hero-heavy",
  },
  {
    id: "modern-grid",
    name: "Modern Grid Layout",
    description: "Structured grids, geometric precision",
    bgColor: "#F0F0F0",
    textColor: "#1A1A1A",
    accentColor: "#4A90D9",
    spacing: 6,
    margins: 16,
    borderRadius: 2,
    fontFamily: "DM Sans",
    captionSize: 11,
    style: "grid",
    photoArrangement: "grid-heavy",
  },
  {
    id: "hero-image",
    name: "Hero Image Spread",
    description: "Large hero photos, impactful storytelling",
    bgColor: "#1A1A1A",
    textColor: "#F0E8DC",
    accentColor: "#C4A882",
    spacing: 12,
    margins: 20,
    borderRadius: 0,
    fontFamily: "Cormorant Garamond",
    captionSize: 16,
    style: "cinematic",
    photoArrangement: "hero-heavy",
  },
  {
    id: "soft-pastel",
    name: "Soft Pastel Wedding",
    description: "Gentle pastels, dreamy romantic tones",
    bgColor: "#FFF5F5",
    textColor: "#4A3728",
    accentColor: "#D4A5A5",
    spacing: 18,
    margins: 36,
    borderRadius: 8,
    fontFamily: "Cormorant Garamond",
    captionSize: 13,
    style: "luxury",
    photoArrangement: "balanced",
  },
  {
    id: "black-matte",
    name: "Black Matte Album",
    description: "Pure black canvas, photos float in darkness",
    bgColor: "#000000",
    textColor: "#CCCCCC",
    accentColor: "#FFFFFF",
    spacing: 16,
    margins: 32,
    borderRadius: 0,
    fontFamily: "Jost",
    captionSize: 12,
    style: "cinematic",
    photoArrangement: "cinematic",
  },
  {
    id: "fashion-editorial",
    name: "Fashion Editorial",
    description: "High-fashion layouts, asymmetric compositions",
    bgColor: "#EDEDEB",
    textColor: "#111111",
    accentColor: "#FF4444",
    spacing: 8,
    margins: 20,
    borderRadius: 0,
    fontFamily: "EB Garamond",
    captionSize: 11,
    style: "editorial",
    photoArrangement: "hero-heavy",
  },
  {
    id: "film-look",
    name: "Film Look Layout",
    description: "Analog film borders, vintage warmth",
    bgColor: "#F5F0E8",
    textColor: "#3C3428",
    accentColor: "#8B7355",
    spacing: 14,
    margins: 30,
    borderRadius: 2,
    fontFamily: "EB Garamond",
    captionSize: 12,
    style: "classic",
    photoArrangement: "balanced",
  },
  {
    id: "clean-classic",
    name: "Clean Classic",
    description: "Timeless design, perfect symmetry",
    bgColor: "#FAFAFA",
    textColor: "#222222",
    accentColor: "#888888",
    spacing: 16,
    margins: 32,
    borderRadius: 0,
    fontFamily: "DM Sans",
    captionSize: 12,
    style: "classic",
    photoArrangement: "grid-heavy",
  },
  {
    id: "dramatic-portrait",
    name: "Dramatic Portrait Style",
    description: "Bold portraits, chiaroscuro lighting feel",
    bgColor: "#0D0D0D",
    textColor: "#E0D5C5",
    accentColor: "#B8953F",
    spacing: 10,
    margins: 24,
    borderRadius: 0,
    fontFamily: "Playfair Display",
    captionSize: 14,
    style: "cinematic",
    photoArrangement: "hero-heavy",
  },
  {
    id: "royal-wedding",
    name: "Royal Wedding Layout",
    description: "Regal opulence, grand layouts for grand celebrations",
    bgColor: "#1B0F05",
    textColor: "#F5E6D3",
    accentColor: "#FFD700",
    spacing: 12,
    margins: 28,
    borderRadius: 0,
    fontFamily: "Playfair Display",
    captionSize: 15,
    style: "traditional",
    photoArrangement: "cinematic",
  },
];

/* ─── Wedding Moments ─── */

export type WeddingMoment =
  | "opening"
  | "bride_preparation"
  | "groom_preparation"
  | "detail_shots"
  | "ceremony"
  | "couple_portraits"
  | "family"
  | "candid"
  | "reception"
  | "grand_finale";

export const MOMENT_ORDER: WeddingMoment[] = [
  "opening",
  "bride_preparation",
  "groom_preparation",
  "detail_shots",
  "ceremony",
  "couple_portraits",
  "family",
  "candid",
  "reception",
  "grand_finale",
];

export const MOMENT_LABELS: Record<WeddingMoment, string> = {
  opening: "Opening",
  bride_preparation: "Bride Preparation",
  groom_preparation: "Groom Preparation",
  detail_shots: "Detail Shots",
  ceremony: "Ceremony Highlights",
  couple_portraits: "Couple Portraits",
  family: "Family Photos",
  candid: "Candid Moments",
  reception: "Reception",
  grand_finale: "Grand Finale",
};

/* ─── Spread Layout Types ─── */

export type SpreadLayoutType =
  | "full_bleed"
  | "two_photo"
  | "three_photo"
  | "four_grid"
  | "hero_left"
  | "hero_right"
  | "panoramic"
  | "collage_5"
  | "portrait_hero"
  | "cinematic_strip";

export interface SpreadLayout {
  type: SpreadLayoutType;
  gridCols: number;
  gridRows: number;
  cells: number[][]; // [rowStart, colStart, rowEnd, colEnd]
  photoCount: number;
}

export const SPREAD_LAYOUTS: Record<SpreadLayoutType, SpreadLayout> = {
  full_bleed: {
    type: "full_bleed",
    gridCols: 1,
    gridRows: 1,
    cells: [[1, 1, 2, 2]],
    photoCount: 1,
  },
  two_photo: {
    type: "two_photo",
    gridCols: 2,
    gridRows: 1,
    cells: [
      [1, 1, 2, 2],
      [1, 2, 2, 3],
    ],
    photoCount: 2,
  },
  three_photo: {
    type: "three_photo",
    gridCols: 3,
    gridRows: 2,
    cells: [
      [1, 1, 3, 2],
      [1, 2, 2, 4],
      [2, 2, 3, 4],
    ],
    photoCount: 3,
  },
  four_grid: {
    type: "four_grid",
    gridCols: 2,
    gridRows: 2,
    cells: [
      [1, 1, 2, 2],
      [1, 2, 2, 3],
      [2, 1, 3, 2],
      [2, 2, 3, 3],
    ],
    photoCount: 4,
  },
  hero_left: {
    type: "hero_left",
    gridCols: 3,
    gridRows: 2,
    cells: [
      [1, 1, 3, 3],
      [1, 3, 2, 4],
      [2, 3, 3, 4],
    ],
    photoCount: 3,
  },
  hero_right: {
    type: "hero_right",
    gridCols: 3,
    gridRows: 2,
    cells: [
      [1, 1, 2, 2],
      [2, 1, 3, 2],
      [1, 2, 3, 4],
    ],
    photoCount: 3,
  },
  panoramic: {
    type: "panoramic",
    gridCols: 1,
    gridRows: 3,
    cells: [
      [1, 1, 2, 2],
      [2, 1, 3, 2],
      [3, 1, 4, 2],
    ],
    photoCount: 3,
  },
  collage_5: {
    type: "collage_5",
    gridCols: 3,
    gridRows: 2,
    cells: [
      [1, 1, 2, 2],
      [1, 2, 2, 3],
      [1, 3, 2, 4],
      [2, 1, 3, 2],
      [2, 2, 3, 4],
    ],
    photoCount: 5,
  },
  portrait_hero: {
    type: "portrait_hero",
    gridCols: 4,
    gridRows: 1,
    cells: [
      [1, 1, 2, 2],
      [1, 2, 2, 4],
      [1, 4, 2, 5],
    ],
    photoCount: 3,
  },
  cinematic_strip: {
    type: "cinematic_strip",
    gridCols: 4,
    gridRows: 1,
    cells: [
      [1, 1, 2, 2],
      [1, 2, 2, 3],
      [1, 3, 2, 4],
      [1, 4, 2, 5],
    ],
    photoCount: 4,
  },
};

/* ─── AI Analysis Result ─── */

export interface PhotoAnalysis {
  url: string;
  photoId?: string;
  qualityScore: number; // 0-100
  sharpness: number;
  composition: number;
  moment: WeddingMoment;
  isDuplicate: boolean;
  duplicateGroupId?: string;
  isBestInGroup: boolean;
  faces: number;
  emotion: string;
  description: string;
}

export interface AIAlbumGenerationResult {
  spreads: GeneratedSpread[];
  totalPhotosUsed: number;
  totalPhotosSkipped: number;
  generationTimeMs: number;
}

export interface GeneratedSpread {
  spreadIndex: number;
  layout: SpreadLayout;
  photos: PhotoAnalysis[];
  moment: WeddingMoment;
  bgColor: string;
}
