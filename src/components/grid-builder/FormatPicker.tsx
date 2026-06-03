import { cn } from '@/lib/utils';
import type { CanvasFormat } from './types';
import { CANVAS_FORMATS } from './types';

export type FormatPresetId = 'square' | 'portrait' | 'carousel' | 'story';

export interface FormatPreset {
  id: FormatPresetId;
  name: string;
  dimensions: string;
  format: CanvasFormat;
  isCarousel?: boolean;
}

export const FORMAT_PRESETS: FormatPreset[] = [
  {
    id: 'square',
    name: 'Square',
    dimensions: '1080 × 1080',
    format: CANVAS_FORMATS[0],
  },
  {
    id: 'portrait',
    name: 'Portrait',
    dimensions: '1080 × 1350',
    format: CANVAS_FORMATS[1],
  },
  {
    id: 'carousel',
    name: 'Carousel',
    dimensions: '1080 × 1080 × N',
    format: CANVAS_FORMATS[0],
    isCarousel: true,
  },
  {
    id: 'story',
    name: 'Story',
    dimensions: '1080 × 1920',
    format: CANVAS_FORMATS[2],
  },
];

interface Props {
  selected: FormatPreset;
  onSelect: (preset: FormatPreset) => void;
}

function GridPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn('grid grid-cols-2 grid-rows-2 gap-px bg-grid-border-muted', className)}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-grid-elevated" />
      ))}
    </div>
  );
}

function CarouselPreview() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-7 aspect-square bg-grid-elevated border border-grid-border-muted"
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn('text-[8px]', i === 0 ? 'text-grid-gold' : 'text-grid-border-muted')}
          >
            ●
          </span>
        ))}
      </div>
    </div>
  );
}

function FormatPreview({ preset }: { preset: FormatPreset }) {
  switch (preset.id) {
    case 'square':
      return <GridPreview className="w-20 aspect-square border border-grid-border-muted" />;
    case 'portrait':
      return <GridPreview className="w-16 aspect-[4/5] border border-grid-border-muted" />;
    case 'carousel':
      return <CarouselPreview />;
    case 'story':
      return (
        <div className="w-10 aspect-[9/16] bg-grid-elevated border border-grid-border-muted" />
      );
    default:
      return null;
  }
}

export default function FormatPicker({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {FORMAT_PRESETS.map((preset) => {
        const isSelected = selected.id === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset)}
            className={cn(
              'flex flex-col items-center gap-3 border p-5 transition-colors',
              'bg-[#0a0a0a] hover:border-[#444444]',
              isSelected ? 'border-grid-gold' : 'border-grid-border',
            )}
          >
            <FormatPreview preset={preset} />
            <div className="flex flex-col items-center gap-1 mt-2">
              <span className="font-sans text-[11px] uppercase tracking-[0.12em] text-[#888888]">
                {preset.name}
              </span>
              <span className="font-sans text-[9px] text-grid-hint">{preset.dimensions}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
