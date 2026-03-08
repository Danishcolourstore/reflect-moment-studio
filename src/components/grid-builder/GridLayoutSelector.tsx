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

/** Visual wireframe thumbnail for each layout */
function LayoutPreview({ layout }: { layout: GridLayout }) {
  const hasFrame = !!layout.frame;
  const ratio = layout.canvasRatio || 1;

  // Determine a descriptive icon/badge
  const badge = hasFrame
    ? layout.frame!.padding[2] > 12
      ? '📷' // Polaroid-style (big bottom padding)
      : layout.frame!.shadow
        ? '✦'  // floating/shadow
        : layout.frame!.borderWidth
          ? '▣'  // editorial border
          : '◻'  // white frame
    : null;

  return (
    <div
      className="w-full overflow-hidden rounded-lg bg-muted/20 relative"
      style={{ aspectRatio: ratio }}
    >
      {hasFrame ? (
        <div
          className="w-full h-full flex items-center justify-center relative"
          style={{
            padding: `${layout.frame!.padding[0]}% ${layout.frame!.padding[1]}% ${layout.frame!.padding[2]}% ${layout.frame!.padding[3]}%`,
            background: layout.frame!.background === '#ffffff' ? 'hsl(var(--muted) / 0.3)' : layout.frame!.background,
          }}
        >
          <div
            className="w-full h-full bg-primary/20"
            style={{
              borderRadius: layout.frame!.imageRadius ? `${Math.min(layout.frame!.imageRadius, 6)}px` : undefined,
              boxShadow: layout.frame!.shadow ? '0 2px 8px rgba(0,0,0,0.15)' : undefined,
              border: layout.frame!.borderWidth ? `${Math.max(1, layout.frame!.borderWidth)}px solid hsl(var(--border))` : undefined,
            }}
          />
          {/* Caption area indicator for editorial frames */}
          {(layout.frame!.padding[2] > 15 || layout.frame!.padding[0] > 15) && (
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-[2px]"
              style={layout.frame!.padding[2] > 15 ? { bottom: '6%' } : { top: '6%' }}>
              <div className="h-[2px] w-6 bg-muted-foreground/20 rounded-full" />
              <div className="h-[2px] w-4 bg-muted-foreground/15 rounded-full" />
            </div>
          )}
        </div>
      ) : (
        <div
          className="w-full h-full"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
            gap: '2px',
            padding: '2px',
          }}
        >
          {layout.cells.map((cell, i) => (
            <div
              key={i}
              className="bg-primary/15 rounded-[2px]"
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

/** Cell count badge */
function CellCount({ layout }: { layout: GridLayout }) {
  const count = layout.cells.length;
  return (
    <span className="text-[8px] tracking-wider text-muted-foreground/40 tabular-nums">
      {count} {count === 1 ? 'cell' : 'cells'}
    </span>
  );
}

export default function GridLayoutSelector({ onSelect }: Props) {
  const [cat, setCat] = useState<'single' | 'basic' | 'instagram' | 'creative'>('single');
  const filtered = GRID_LAYOUTS.filter((l) => l.category === cat);

  return (
    <div className="flex flex-col gap-6">
      {/* Category tabs */}
      <div className="flex gap-1 bg-muted/30 rounded-full p-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={cn(
              'flex-1 text-[10px] tracking-wider uppercase font-medium py-2 rounded-full transition-all duration-200',
              cat === c.key
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground/50 hover:text-foreground'
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
            className={cn(
              'group flex flex-col items-center gap-2 p-3 rounded-xl border bg-card transition-all duration-200 active:scale-95',
              'border-border/60 hover:border-primary/50 hover:shadow-[0_0_20px_-6px_hsl(var(--primary)/0.25)]'
            )}
          >
            <LayoutPreview layout={layout} />
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] tracking-wider uppercase text-muted-foreground/70 font-medium group-hover:text-foreground transition-colors">
                {layout.name}
              </span>
              <CellCount layout={layout} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
