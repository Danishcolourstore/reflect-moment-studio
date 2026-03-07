export interface GridLayout {
  id: string;
  name: string;
  category: 'basic' | 'instagram' | 'creative';
  cols: number;
  rows: number;
  /** Each cell defines its grid area: [rowStart, colStart, rowEnd, colEnd] */
  cells: [number, number, number, number][];
  /** Total grid columns for CSS grid */
  gridCols: number;
  /** Total grid rows for CSS grid */
  gridRows: number;
}

export interface GridCellData {
  id: string;
  imageUrl: string | null;
  file: File | null;
  offsetX: number;
  offsetY: number;
  scale: number;
}

export type ExportSize = {
  label: string;
  width: number;
  height: number;
};

export const EXPORT_SIZES: ExportSize[] = [
  { label: '1080 × 1080', width: 1080, height: 1080 },
  { label: '1080 × 1350', width: 1080, height: 1350 },
  { label: '2048 × 2048', width: 2048, height: 2048 },
  { label: '4000 × 4000', width: 4000, height: 4000 },
];

// ─── Layout Definitions ────────────────────────────────────

const basic = (id: string, name: string, n: number): GridLayout => {
  const cells: [number, number, number, number][] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      cells.push([r + 1, c + 1, r + 2, c + 2]);
  return { id, name, category: 'basic', cols: n, rows: n, cells, gridCols: n, gridRows: n };
};

export const GRID_LAYOUTS: GridLayout[] = [
  // ── Basic ──
  basic('1x1', '1 × 1', 1),
  basic('2x2', '2 × 2', 2),
  basic('3x3', '3 × 3', 3),
  basic('4x4', '4 × 4', 4),

  // ── Instagram ──
  {
    id: 'carousel-1', name: 'Carousel 1', category: 'instagram',
    cols: 2, rows: 2, gridCols: 2, gridRows: 2,
    cells: [[1,1,2,2],[1,2,2,3],[2,1,3,2],[2,2,3,3]],
  },
  {
    id: 'carousel-2', name: 'Carousel 2', category: 'instagram',
    cols: 3, rows: 1, gridCols: 3, gridRows: 1,
    cells: [[1,1,2,2],[1,2,2,3],[1,3,2,4]],
  },
  {
    id: 'carousel-3', name: 'Carousel 3', category: 'instagram',
    cols: 2, rows: 3, gridCols: 2, gridRows: 3,
    cells: [[1,1,2,2],[1,2,2,3],[2,1,3,2],[2,2,3,3],[3,1,4,2],[3,2,4,3]],
  },
  {
    id: 'carousel-4', name: 'Carousel 4', category: 'instagram',
    cols: 1, rows: 3, gridCols: 1, gridRows: 3,
    cells: [[1,1,2,2],[2,1,3,2],[3,1,4,2]],
  },

  // ── Creative ──
  {
    id: 'diptych', name: 'Diptych', category: 'creative',
    cols: 2, rows: 1, gridCols: 2, gridRows: 1,
    cells: [[1,1,2,2],[1,2,2,3]],
  },
  {
    id: 'triptych', name: 'Triptych', category: 'creative',
    cols: 3, rows: 1, gridCols: 3, gridRows: 1,
    cells: [[1,1,2,2],[1,2,2,3],[1,3,2,4]],
  },
  {
    id: 'hero-2', name: 'Hero + 2', category: 'creative',
    cols: 2, rows: 2, gridCols: 2, gridRows: 3,
    cells: [[1,1,3,3],[3,1,4,2],[3,2,4,3]],
  },
  {
    id: 'hero-3', name: 'Hero + 3', category: 'creative',
    cols: 3, rows: 2, gridCols: 3, gridRows: 3,
    cells: [[1,1,3,4],[3,1,4,2],[3,2,4,3],[3,3,4,4]],
  },
  {
    id: 'hero-4', name: 'Hero + 4', category: 'creative',
    cols: 2, rows: 3, gridCols: 2, gridRows: 4,
    cells: [[1,1,3,3],[3,1,4,2],[3,2,4,3],[4,1,5,2],[4,2,5,3]],
  },
  {
    id: 'editorial-collage', name: 'Editorial Collage', category: 'creative',
    cols: 3, rows: 3, gridCols: 3, gridRows: 3,
    cells: [[1,1,2,3],[1,3,3,4],[2,1,3,2],[2,2,3,3],[3,1,4,2],[3,2,4,4]],
  },
  {
    id: 'story-collage', name: 'Story Collage', category: 'creative',
    cols: 2, rows: 4, gridCols: 2, gridRows: 4,
    cells: [[1,1,3,2],[1,2,2,3],[2,2,3,3],[3,1,5,2],[3,2,4,3],[4,2,5,3]],
  },
  {
    id: 'vertical-strips', name: 'Vertical Strips', category: 'creative',
    cols: 4, rows: 1, gridCols: 4, gridRows: 1,
    cells: [[1,1,2,2],[1,2,2,3],[1,3,2,4],[1,4,2,5]],
  },
  {
    id: 'magazine', name: 'Magazine', category: 'creative',
    cols: 3, rows: 2, gridCols: 3, gridRows: 2,
    cells: [[1,1,3,2],[1,2,2,4],[2,2,3,3],[2,3,3,4]],
  },

  // ══════════════════════════════════════════════
  // ── NEW BASIC LAYOUTS ────────────────────────
  // ══════════════════════════════════════════════

  {
    id: '1x2', name: '1 × 2', category: 'basic',
    cols: 1, rows: 2, gridCols: 1, gridRows: 2,
    cells: [[1,1,2,2],[2,1,3,2]],
  },
  {
    id: '1x3', name: '1 × 3', category: 'basic',
    cols: 1, rows: 3, gridCols: 1, gridRows: 3,
    cells: [[1,1,2,2],[2,1,3,2],[3,1,4,2]],
  },
  {
    id: '1x4', name: '1 × 4', category: 'basic',
    cols: 1, rows: 4, gridCols: 1, gridRows: 4,
    cells: [[1,1,2,2],[2,1,3,2],[3,1,4,2],[4,1,5,2]],
  },
  {
    id: '2x3', name: '2 × 3', category: 'basic',
    cols: 2, rows: 3, gridCols: 2, gridRows: 3,
    cells: [[1,1,2,2],[1,2,2,3],[2,1,3,2],[2,2,3,3],[3,1,4,2],[3,2,4,3]],
  },
  {
    id: '2x4', name: '2 × 4', category: 'basic',
    cols: 2, rows: 4, gridCols: 2, gridRows: 4,
    cells: [[1,1,2,2],[1,2,2,3],[2,1,3,2],[2,2,3,3],[3,1,4,2],[3,2,4,3],[4,1,5,2],[4,2,5,3]],
  },
  {
    id: '3x2', name: '3 × 2', category: 'basic',
    cols: 3, rows: 2, gridCols: 3, gridRows: 2,
    cells: [[1,1,2,2],[1,2,2,3],[1,3,2,4],[2,1,3,2],[2,2,3,3],[2,3,3,4]],
  },
  {
    id: '3x4', name: '3 × 4', category: 'basic',
    cols: 3, rows: 4, gridCols: 3, gridRows: 4,
    cells: [
      [1,1,2,2],[1,2,2,3],[1,3,2,4],
      [2,1,3,2],[2,2,3,3],[2,3,3,4],
      [3,1,4,2],[3,2,4,3],[3,3,4,4],
      [4,1,5,2],[4,2,5,3],[4,3,5,4],
    ],
  },
  {
    id: '4x3', name: '4 × 3', category: 'basic',
    cols: 4, rows: 3, gridCols: 4, gridRows: 3,
    cells: [
      [1,1,2,2],[1,2,2,3],[1,3,2,4],[1,4,2,5],
      [2,1,3,2],[2,2,3,3],[2,3,3,4],[2,4,3,5],
      [3,1,4,2],[3,2,4,3],[3,3,4,4],[3,4,4,5],
    ],
  },
  {
    id: '5x5', name: '5 × 5', category: 'basic',
    cols: 5, rows: 5, gridCols: 5, gridRows: 5,
    cells: [
      [1,1,2,2],[1,2,2,3],[1,3,2,4],[1,4,2,5],[1,5,2,6],
      [2,1,3,2],[2,2,3,3],[2,3,3,4],[2,4,3,5],[2,5,3,6],
      [3,1,4,2],[3,2,4,3],[3,3,4,4],[3,4,4,5],[3,5,4,6],
      [4,1,5,2],[4,2,5,3],[4,3,5,4],[4,4,5,5],[4,5,5,6],
      [5,1,6,2],[5,2,6,3],[5,3,6,4],[5,4,6,5],[5,5,6,6],
    ],
  },
  {
    id: 'panorama-strip', name: 'Panorama Strip', category: 'basic',
    cols: 5, rows: 1, gridCols: 5, gridRows: 1,
    cells: [[1,1,2,2],[1,2,2,3],[1,3,2,4],[1,4,2,5],[1,5,2,6]],
  },

  // ══════════════════════════════════════════════
  // ── NEW INSTAGRAM LAYOUTS ────────────────────
  // ══════════════════════════════════════════════

  {
    id: 'carousel-5', name: 'Carousel 5', category: 'instagram',
    cols: 3, rows: 2, gridCols: 3, gridRows: 2,
    cells: [[1,1,2,3],[1,3,2,4],[2,1,3,2],[2,2,3,3],[2,3,3,4]],
  },
  {
    id: 'carousel-6', name: 'Carousel 6', category: 'instagram',
    cols: 3, rows: 2, gridCols: 3, gridRows: 2,
    cells: [[1,1,2,2],[1,2,2,3],[1,3,2,4],[2,1,3,2],[2,2,3,3],[2,3,3,4]],
  },
  {
    id: 'carousel-7', name: 'Carousel 7', category: 'instagram',
    cols: 3, rows: 3, gridCols: 3, gridRows: 3,
    cells: [[1,1,2,3],[1,3,2,4],[2,1,3,2],[2,2,3,3],[2,3,3,4],[3,1,4,2],[3,2,4,4]],
  },
  {
    id: 'carousel-8', name: 'Carousel 8', category: 'instagram',
    cols: 3, rows: 3, gridCols: 3, gridRows: 3,
    cells: [[1,1,2,2],[1,2,2,3],[1,3,2,4],[2,1,3,2],[2,2,3,4],[3,1,4,3],[3,3,4,4]],
  },
  {
    id: 'carousel-9', name: 'Carousel 9', category: 'instagram',
    cols: 3, rows: 3, gridCols: 3, gridRows: 3,
    cells: [[1,1,2,2],[1,2,2,3],[1,3,2,4],[2,1,3,2],[2,2,3,3],[2,3,3,4],[3,1,4,2],[3,2,4,3],[3,3,4,4]],
  },
  {
    id: 'carousel-10', name: 'Carousel 10', category: 'instagram',
    cols: 4, rows: 3, gridCols: 4, gridRows: 3,
    cells: [[1,1,2,2],[1,2,2,3],[1,3,2,5],[2,1,3,3],[2,3,3,4],[2,4,3,5],[3,1,4,2],[3,2,4,3],[3,3,4,4],[3,4,4,5]],
  },
  {
    id: 'side-swipe', name: 'Side Swipe', category: 'instagram',
    cols: 4, rows: 1, gridCols: 4, gridRows: 1,
    cells: [[1,1,2,2],[1,2,2,3],[1,3,2,4],[1,4,2,5]],
  },
  {
    id: 'vertical-swipe', name: 'Vertical Swipe', category: 'instagram',
    cols: 1, rows: 4, gridCols: 1, gridRows: 4,
    cells: [[1,1,2,2],[2,1,3,2],[3,1,4,2],[4,1,5,2]],
  },
  {
    id: 'split-carousel', name: 'Split Carousel', category: 'instagram',
    cols: 2, rows: 1, gridCols: 2, gridRows: 1,
    cells: [[1,1,2,2],[1,2,2,3]],
  },
  {
    id: 'puzzle-feed', name: 'Puzzle Feed', category: 'instagram',
    cols: 3, rows: 3, gridCols: 3, gridRows: 3,
    cells: [[1,1,2,2],[1,2,2,3],[1,3,2,4],[2,1,3,2],[2,2,3,3],[2,3,3,4],[3,1,4,2],[3,2,4,3],[3,3,4,4]],
  },
  {
    id: 'panorama-carousel', name: 'Panorama', category: 'instagram',
    cols: 3, rows: 1, gridCols: 3, gridRows: 1,
    cells: [[1,1,2,2],[1,2,2,3],[1,3,2,4]],
  },
  {
    id: 'before-after', name: 'Before / After', category: 'instagram',
    cols: 2, rows: 1, gridCols: 2, gridRows: 1,
    cells: [[1,1,2,2],[1,2,2,3]],
  },

  // ══════════════════════════════════════════════
  // ── NEW CREATIVE LAYOUTS ─────────────────────
  // ══════════════════════════════════════════════

  {
    id: 'hero-5', name: 'Hero + 5', category: 'creative',
    cols: 3, rows: 3, gridCols: 3, gridRows: 4,
    cells: [[1,1,3,4],[3,1,4,2],[3,2,4,3],[3,3,4,4],[4,1,5,2],[4,2,5,4]],
  },
  {
    id: 'hero-6', name: 'Hero + 6', category: 'creative',
    cols: 3, rows: 3, gridCols: 3, gridRows: 4,
    cells: [[1,1,3,4],[3,1,4,2],[3,2,4,3],[3,3,4,4],[4,1,5,2],[4,2,5,3],[4,3,5,4]],
  },
  {
    id: 'hero-7', name: 'Hero + 7', category: 'creative',
    cols: 4, rows: 3, gridCols: 4, gridRows: 4,
    cells: [[1,1,3,5],[3,1,4,2],[3,2,4,3],[3,3,4,4],[3,4,4,5],[4,1,5,3],[4,3,5,4],[4,4,5,5]],
  },
  {
    id: 'big-center-4', name: 'Big Center + 4', category: 'creative',
    cols: 3, rows: 3, gridCols: 3, gridRows: 3,
    cells: [[1,1,2,2],[1,2,3,3],[1,3,2,4],[2,1,3,2],[2,3,3,4]],
  },
  {
    id: 'big-center-6', name: 'Big Center + 6', category: 'creative',
    cols: 3, rows: 4, gridCols: 3, gridRows: 4,
    cells: [[1,1,2,2],[1,2,3,3],[1,3,2,4],[2,1,3,2],[2,3,3,4],[3,1,4,2],[3,3,4,4],[3,2,5,3]],
  },
  {
    id: 'asymmetric-collage', name: 'Asymmetric Collage', category: 'creative',
    cols: 3, rows: 3, gridCols: 4, gridRows: 3,
    cells: [[1,1,2,3],[1,3,2,5],[2,1,3,2],[2,2,4,4],[2,4,3,5],[3,1,4,2],[3,4,4,5]],
  },
  {
    id: 'diagonal-collage', name: 'Diagonal Collage', category: 'creative',
    cols: 3, rows: 3, gridCols: 3, gridRows: 3,
    cells: [[1,1,2,3],[1,3,3,4],[2,1,3,2],[3,1,4,3],[2,2,3,3],[3,3,4,4]],
  },
  {
    id: 'masonry-grid', name: 'Masonry Grid', category: 'creative',
    cols: 3, rows: 4, gridCols: 3, gridRows: 4,
    cells: [[1,1,3,2],[1,2,2,3],[1,3,2,4],[2,2,4,3],[2,3,3,4],[3,1,4,2],[3,3,5,4],[4,1,5,3]],
  },
  {
    id: 'vertical-story', name: 'Vertical Story', category: 'creative',
    cols: 2, rows: 5, gridCols: 2, gridRows: 5,
    cells: [[1,1,2,3],[2,1,3,2],[2,2,3,3],[3,1,4,3],[4,1,5,2],[4,2,5,3],[5,1,6,3]],
  },
  {
    id: 'film-strip', name: 'Film Strip', category: 'creative',
    cols: 5, rows: 1, gridCols: 5, gridRows: 1,
    cells: [[1,1,2,2],[1,2,2,3],[1,3,2,4],[1,4,2,5],[1,5,2,6]],
  },
  {
    id: 'magazine-editorial', name: 'Magazine Editorial', category: 'creative',
    cols: 4, rows: 3, gridCols: 4, gridRows: 3,
    cells: [[1,1,2,3],[1,3,3,5],[2,1,3,2],[2,2,3,3],[3,1,4,2],[3,2,4,5]],
  },
  {
    id: 'timeline', name: 'Timeline', category: 'creative',
    cols: 2, rows: 4, gridCols: 2, gridRows: 4,
    cells: [[1,1,2,2],[1,2,3,3],[2,1,3,2],[3,1,4,3],[4,1,5,2],[4,2,5,3]],
  },
  {
    id: 'photo-stack', name: 'Photo Stack', category: 'creative',
    cols: 2, rows: 3, gridCols: 2, gridRows: 3,
    cells: [[1,1,2,3],[2,1,3,2],[2,2,3,3],[3,1,4,3]],
  },
  {
    id: 'gallery-collage', name: 'Gallery Collage', category: 'creative',
    cols: 4, rows: 3, gridCols: 4, gridRows: 3,
    cells: [[1,1,2,2],[1,2,2,4],[1,4,3,5],[2,1,3,2],[2,2,3,4],[3,1,4,3],[3,3,4,5]],
  },
];

export function createCellsForLayout(layout: GridLayout): GridCellData[] {
  return layout.cells.map((_, i) => ({
    id: `cell-${i}`,
    imageUrl: null,
    file: null,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  }));
}
