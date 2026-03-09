import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GridLayout, FrameConfig } from '@/components/grid-builder/types';

export const GRID_TEMPLATES_QUERY_KEY = ['grid_templates'];

interface DbGridTemplate {
  id: string;
  name: string;
  category: string;
  grid_type: string;
  columns: number;
  rows: number;
  spacing: number;
  padding: number;
  border_radius: number;
  background_color: string;
  layout_config: any;
  frame_style: string | null;
  is_active: boolean;
  sort_order: number;
}

/** Frame presets for single-image layouts */
const FRAME_PRESETS: Record<string, { frame?: FrameConfig; canvasRatio?: number }> = {
  'single-square': {},
  'single-4x5': { canvasRatio: 4 / 5 },
  'single-3x4': { canvasRatio: 3 / 4 },
  'single-16x9': { canvasRatio: 16 / 9 },
  'single-9x16': { canvasRatio: 9 / 16 },
  'frame-white': {
    frame: { padding: [6, 6, 6, 6], imageRadius: 0, background: '#ffffff', shadow: false, borderWidth: 0, borderColor: '' },
  },
  'frame-editorial': {
    frame: { padding: [10, 10, 10, 10], imageRadius: 0, background: '#ffffff', shadow: false, borderWidth: 1, borderColor: '#e0e0e0' },
  },
  'frame-polaroid': {
    frame: { padding: [5, 5, 18, 5], imageRadius: 0, background: '#ffffff', shadow: true, borderWidth: 0, borderColor: '' },
  },
  'frame-floating': {
    frame: { padding: [8, 8, 8, 8], imageRadius: 12, background: '#f5f5f5', shadow: true, borderWidth: 0, borderColor: '' },
  },
  'editorial-large-margin': {
    frame: { padding: [18, 18, 18, 18], imageRadius: 0, background: '#F3EFE9', shadow: false, borderWidth: 0, borderColor: '' },
  },
  'editorial-top': {
    frame: { padding: [6, 8, 28, 8], imageRadius: 0, background: '#ffffff', shadow: false, borderWidth: 0, borderColor: '' },
  },
  'editorial-bottom': {
    frame: { padding: [28, 8, 6, 8], imageRadius: 0, background: '#ffffff', shadow: false, borderWidth: 0, borderColor: '' },
  },
  'minimal-full': {},
  'minimal-shadow': {
    frame: { padding: [10, 10, 10, 10], imageRadius: 4, background: '#ffffff', shadow: true, borderWidth: 0, borderColor: '' },
  },
  'minimal-rounded': {
    frame: { padding: [4, 4, 4, 4], imageRadius: 20, background: '#ffffff', shadow: false, borderWidth: 0, borderColor: '' },
  },
};

/** Convert DB template to GridLayout format */
function toGridLayout(t: DbGridTemplate): GridLayout {
  const config = t.layout_config || {};
  const cells: [number, number, number, number][] = Array.isArray(config.cells)
    ? config.cells
    : Array.isArray(config)
      ? config
      : [];

  // Map category to GridLayout category type
  const categoryMap: Record<string, GridLayout['category']> = {
    basic: 'basic',
    instagram: 'instagram',
    creative: 'creative',
    single: 'single',
  };
  const category = categoryMap[t.category] || categoryMap[t.grid_type] || 'basic';

  // Get frame/canvas presets for single layouts
  const preset = FRAME_PRESETS[t.grid_type] || {};

  return {
    id: t.grid_type || t.id,
    name: t.name,
    category,
    cols: t.columns,
    rows: t.rows,
    cells: cells.length > 0 ? cells : [[1, 1, 2, 2]],
    gridCols: t.columns,
    gridRows: t.rows,
    frame: preset.frame,
    canvasRatio: preset.canvasRatio || config.canvasRatio,
  };
}

/** Fetch active grid templates from database */
async function fetchGridTemplates(): Promise<GridLayout[]> {
  const { data, error } = await supabase
    .from('grid_templates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data) {
    console.warn('Failed to fetch grid templates from DB, using fallback');
    return [];
  }

  return (data as DbGridTemplate[]).map(toGridLayout);
}

/**
 * Hook to fetch grid templates from the database.
 * Templates are managed by Super Admin and sync in real-time.
 */
export function useGridTemplates() {
  return useQuery({
    queryKey: GRID_TEMPLATES_QUERY_KEY,
    queryFn: fetchGridTemplates,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
