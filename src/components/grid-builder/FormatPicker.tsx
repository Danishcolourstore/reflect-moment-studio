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

const dimLabelStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 9,
  color: '#444444',
  marginTop: 6,
};

const previewShell: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
};

function SquarePreview() {
  return (
    <div className="flex flex-col items-center">
      <div
        style={{
          ...previewShell,
          width: 80,
          aspectRatio: '1 / 1',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 1,
          background: '#2e2e2e',
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: '#1a1a1a' }} />
        ))}
      </div>
      <span style={dimLabelStyle}>1080 × 1080</span>
    </div>
  );
}

function PortraitPreview() {
  return (
    <div className="flex flex-col items-center">
      <div
        style={{
          ...previewShell,
          width: 60,
          aspectRatio: '4 / 5',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 1,
          background: '#2e2e2e',
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: '#1a1a1a' }} />
        ))}
      </div>
      <span style={dimLabelStyle}>1080 × 1350</span>
    </div>
  );
}

function CarouselPreview() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center" style={{ gap: 3 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              ...previewShell,
              width: 26,
              aspectRatio: '1 / 1',
            }}
          />
        ))}
      </div>
      <div className="flex items-center" style={{ gap: 4, marginTop: 6 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              fontSize: 5,
              lineHeight: 1,
              color: i === 0 ? '#B8953F' : '#444444',
            }}
          >
            ●
          </span>
        ))}
      </div>
      <span style={dimLabelStyle}>1080 × 1080 × N</span>
    </div>
  );
}

function StoryPreview() {
  return (
    <div className="flex flex-col items-center">
      <div
        style={{
          ...previewShell,
          width: 38,
          aspectRatio: '9 / 16',
        }}
      />
      <span style={dimLabelStyle}>1080 × 1920</span>
    </div>
  );
}

function FormatPreview({ preset }: { preset: FormatPreset }) {
  switch (preset.id) {
    case 'square':
      return <SquarePreview />;
    case 'portrait':
      return <PortraitPreview />;
    case 'carousel':
      return <CarouselPreview />;
    case 'story':
      return <StoryPreview />;
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
              'flex flex-col items-center gap-3 border p-5 transition-colors',
              'bg-[#0a0a0a] hover:border-[#444444]',
            )}
            style={{
              border: isSelected ? '1px solid #B8953F' : '1px solid #222222',
            }}
          >
            <FormatPreview preset={preset} />
            <span className="font-sans text-[11px] uppercase tracking-[0.12em] text-[#888888]">
              {preset.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
