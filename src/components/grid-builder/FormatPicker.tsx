import { Check } from 'lucide-react';
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
  selected: FormatPreset | null;
  onSelect: (preset: FormatPreset) => void;
}

function SquarePreview({ selected }: { selected?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'grid aspect-square w-20 grid-cols-2 grid-rows-2 gap-px overflow-hidden border transition-colors duration-200',
          selected ? 'border-grid-gold/50 bg-grid-gold/20' : 'border-[#2a2a2a] bg-[#2e2e2e]',
        )}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'transition-colors duration-200',
              selected ? 'bg-[#1a1a1a]' : 'bg-[#1a1a1a]',
            )}
          />
        ))}
      </div>
      <span className="mt-1.5 font-sans text-[9px] text-[#555555]">1080 × 1080</span>
    </div>
  );
}

function PortraitPreview({ selected }: { selected?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'grid w-[60px] grid-cols-2 grid-rows-2 gap-px overflow-hidden border transition-colors duration-200',
          selected ? 'border-grid-gold/50 bg-grid-gold/20' : 'border-[#2a2a2a] bg-[#2e2e2e]',
        )}
        style={{ aspectRatio: '4 / 5' }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#1a1a1a]" />
        ))}
      </div>
      <span className="mt-1.5 font-sans text-[9px] text-[#555555]">1080 × 1350</span>
    </div>
  );
}

function CarouselPreview({ selected }: { selected?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'aspect-square w-[26px] border transition-colors duration-200',
              selected ? 'border-grid-gold/50 bg-[#1a1a1a]' : 'border-[#2a2a2a] bg-[#1a1a1a]',
            )}
          />
        ))}
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              'text-[5px] leading-none transition-colors duration-200',
              i === 0 ? 'text-grid-gold' : 'text-[#444444]',
            )}
          >
            ●
          </span>
        ))}
      </div>
      <span className="mt-1 font-sans text-[9px] text-[#555555]">1080 × 1080 × N</span>
    </div>
  );
}

function StoryPreview({ selected }: { selected?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'w-[38px] border transition-colors duration-200',
          selected ? 'border-grid-gold/50 bg-[#1a1a1a]' : 'border-[#2a2a2a] bg-[#1a1a1a]',
        )}
        style={{ aspectRatio: '9 / 16' }}
      />
      <span className="mt-1.5 font-sans text-[9px] text-[#555555]">1080 × 1920</span>
    </div>
  );
}

function FormatPreview({ preset, selected }: { preset: FormatPreset; selected?: boolean }) {
  switch (preset.id) {
    case 'square':
      return <SquarePreview selected={selected} />;
    case 'portrait':
      return <PortraitPreview selected={selected} />;
    case 'carousel':
      return <CarouselPreview selected={selected} />;
    case 'story':
      return <StoryPreview selected={selected} />;
    default:
      return null;
  }
}

export default function FormatPicker({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {FORMAT_PRESETS.map((preset) => {
        const isSelected = selected?.id === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset)}
            className={cn(
              'group relative flex flex-col items-center gap-3 border p-5 transition-all duration-200',
              'bg-[#0a0a0a]',
              isSelected
                ? 'border-grid-gold'
                : 'border-[#222222] hover:border-[#444444] hover:bg-[#0f0f0f]',
            )}
          >
            {/* Selection indicator */}
            <div
              className={cn(
                'absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-200',
                isSelected
                  ? 'border-grid-gold bg-grid-gold'
                  : 'border-[#333333] bg-transparent opacity-0 group-hover:opacity-100',
              )}
            >
              {isSelected && <Check className="h-3 w-3 text-black" strokeWidth={2.5} />}
            </div>

            <FormatPreview preset={preset} selected={isSelected} />

            <span
              className={cn(
                'font-sans text-[11px] uppercase tracking-[0.12em] transition-colors duration-200',
                isSelected ? 'text-grid-gold' : 'text-[#888888] group-hover:text-[#aaaaaa]',
              )}
            >
              {preset.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
