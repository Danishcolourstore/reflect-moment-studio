import { useState } from 'react';
import { GRID_LAYOUTS, type GridLayout } from './types';
import { cn } from '@/lib/utils';

interface Props {
  onSelect: (layout: GridLayout) => void;
}

const CATEGORIES = [
  { key: 'single', label: 'Single' },
  { key: 'basic', label: 'Basic' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'creative', label: 'Creative' },
] as const;

function LayoutPreview({ layout }: { layout: GridLayout }) {
  const hasFrame = !!layout.frame;
  const ratio = layout.canvasRatio || 1;

  return (
    <div
      className="w-full overflow-hidden rounded-lg"
      style={{
        aspectRatio: ratio,
        backgroundColor: hasFrame ? layout.frame!.background : undefined,
      }}
    >
      {hasFrame ? (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            padding: `${layout.frame!.padding[0]}% ${layout.frame!.padding[1]}% ${layout.frame!.padding[2]}% ${layout.frame!.padding[3]}%`,
          }}
        >
          <div
            className="w-full h-full bg-primary/20"
            style={{
              borderRadius: layout.frame!.imageRadius ? `${Math.min(layout.frame!.imageRadius, 6)}px` : undefined,
              boxShadow: layout.frame!.shadow ? '0 2px 8px rgba(0,0,0,0.12)' : undefined,
              border: layout.frame!.borderWidth ? `${Math.max(1, layout.frame!.borderWidth)}px solid ${layout.frame!.borderColor}` : undefined,
            }}
          />
        </div>
      ) : (
        <div
          className="w-full h-full"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
            gap: '2px',
          }}
        >
          {layout.cells.map((cell, i) => (
            <div
              key={i}
              className="bg-primary/20 rounded-[3px]"
              style={{
                gridRow: `${cell[0]} / ${cell[2]}`,
                gridColumn: `${cell[1]} / ${cell[3]}`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GridLayoutSelector({ onSelect }: Props) {
  const [cat, setCat] = useState<'single' | 'basic' | 'instagram' | 'creative'>('single');
  const filtered = GRID_LAYOUTS.filter((l) => l.category === cat);

  return (
    <div className="flex flex-col gap-5">
      {/* Category tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-full p-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={cn(
              'flex-1 text-[10px] tracking-wider uppercase font-medium py-2 rounded-full transition-all',
              cat === c.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Layout grid */}
      <div className="grid grid-cols-3 gap-3">
        {filtered.map((layout) => (
          <button
            key={layout.id}
            onClick={() => onSelect(layout)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all active:scale-95"
          >
            <LayoutPreview layout={layout} />
            <span className="text-[10px] tracking-wider uppercase text-muted-foreground font-medium">
              {layout.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
