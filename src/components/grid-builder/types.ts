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
