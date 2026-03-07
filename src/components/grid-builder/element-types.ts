/**
 * Design element types for shape overlays in Grid Builder.
 */

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'divider' | 'badge';

export interface DesignElement {
  id: string;
  type: ShapeType;
  x: number;       // % of container
  y: number;       // % of container
  width: number;   // px at 440px display
  height: number;  // px at 440px display
  rotation: number;
  color: string;
  opacity: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  filled: boolean;
}

let _elId = 0;

export function createDesignElement(type: ShapeType, overrides?: Partial<DesignElement>): DesignElement {
  _elId++;
  const base: DesignElement = {
    id: `el-${Date.now()}-${_elId}`,
    type,
    x: 50,
    y: 50,
    width: type === 'line' || type === 'divider' ? 120 : 80,
    height: type === 'line' ? 2 : type === 'divider' ? 1 : type === 'circle' ? 80 : 60,
    rotation: 0,
    color: '#ffffff',
    opacity: type === 'divider' ? 0.4 : 0.8,
    borderRadius: type === 'circle' ? 999 : type === 'badge' ? 20 : 0,
    borderWidth: type === 'badge' ? 1.5 : 0,
    borderColor: '#ffffff',
    filled: type !== 'badge',
  };
  return { ...base, ...overrides };
}

export const SHAPE_PRESETS: { type: ShapeType; label: string; icon: string }[] = [
  { type: 'rectangle', label: 'Rectangle', icon: '▬' },
  { type: 'circle', label: 'Circle', icon: '●' },
  { type: 'line', label: 'Line', icon: '—' },
  { type: 'divider', label: 'Divider', icon: '┄' },
  { type: 'badge', label: 'Badge', icon: '◻' },
];
