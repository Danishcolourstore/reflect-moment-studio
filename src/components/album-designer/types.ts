export type AlbumSize = '12x12' | '10x10' | '8x12' | 'A4';
export type CoverType = 'hardcover' | 'softcover' | 'layflat';
export type AlbumStatus = 'draft' | 'review' | 'approved' | 'print';

export interface AlbumDimensions {
  label: string;
  widthIn: number;
  heightIn: number;
  widthPx: number;
  heightPx: number;
  bleedMm: number;
  safeMarginMm: number;
}

export const ALBUM_SIZES: Record<AlbumSize, AlbumDimensions> = {
  '12x12': { label: '12 × 12 inches', widthIn: 12, heightIn: 12, widthPx: 3600, heightPx: 3600, bleedMm: 3, safeMarginMm: 5 },
  '10x10': { label: '10 × 10 inches', widthIn: 10, heightIn: 10, widthPx: 3000, heightPx: 3000, bleedMm: 3, safeMarginMm: 5 },
  '8x12':  { label: '8 × 12 inches',  widthIn: 8,  heightIn: 12, widthPx: 2400, heightPx: 3600, bleedMm: 3, safeMarginMm: 5 },
  'A4':    { label: 'A4 (8.3 × 11.7)', widthIn: 8.3, heightIn: 11.7, widthPx: 2490, heightPx: 3510, bleedMm: 3, safeMarginMm: 5 },
};

export const LEAF_PRESETS = [
  { leaves: 30, label: '30 Leaf = 60 Pages' },
  { leaves: 50, label: '50 Leaf = 100 Pages' },
  { leaves: 100, label: '100 Leaf = 200 Pages' },
];

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
  created_at: string;
  updated_at: string;
}
