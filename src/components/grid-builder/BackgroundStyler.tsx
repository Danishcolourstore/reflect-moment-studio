/**
 * Background style controls — solid, gradient, texture presets.
 */

import { cn } from '@/lib/utils';

export interface BackgroundStyle {
  type: 'solid' | 'gradient' | 'grain';
  color: string;
  gradientTo?: string;
  gradientAngle?: number;
}

export const DEFAULT_BG: BackgroundStyle = { type: 'solid', color: '#ffffff' };

export const BG_PRESETS: { label: string; style: BackgroundStyle; group: 'solid' | 'gradient' | 'texture' }[] = [
  // Solids — Wedding palette
  { label: 'White', group: 'solid', style: { type: 'solid', color: '#ffffff' } },
  { label: 'Cream', group: 'solid', style: { type: 'solid', color: '#FAF6F0' } },
  { label: 'Beige', group: 'solid', style: { type: 'solid', color: '#F5F0E8' } },
  { label: 'Blush', group: 'solid', style: { type: 'solid', color: '#F8E8E0' } },
  { label: 'Gold Tint', group: 'solid', style: { type: 'solid', color: '#F8F3E6' } },
  { label: 'Sage', group: 'solid', style: { type: 'solid', color: '#E8EDE6' } },
  { label: 'Charcoal', group: 'solid', style: { type: 'solid', color: '#2B2A28' } },
  { label: 'Black', group: 'solid', style: { type: 'solid', color: '#0a0a0a' } },

  // Gradients
  { label: 'Warm Cream', group: 'gradient', style: { type: 'gradient', color: '#F5F0E8', gradientTo: '#E8DDD0', gradientAngle: 180 } },
  { label: 'Soft Blush', group: 'gradient', style: { type: 'gradient', color: '#F8E8E0', gradientTo: '#F0D8D0', gradientAngle: 135 } },
  { label: 'Dramatic Black', group: 'gradient', style: { type: 'gradient', color: '#1a1a1a', gradientTo: '#0a0a0a', gradientAngle: 180 } },
  { label: 'Golden Hour', group: 'gradient', style: { type: 'gradient', color: '#F8F3E6', gradientTo: '#D4AF37', gradientAngle: 135 } },
  { label: 'Dusty Rose', group: 'gradient', style: { type: 'gradient', color: '#E8D0D0', gradientTo: '#D0B8B8', gradientAngle: 180 } },
  { label: 'Moody', group: 'gradient', style: { type: 'gradient', color: '#2B2A28', gradientTo: '#1A1918', gradientAngle: 180 } },

  // Textures
  { label: 'Grain', group: 'texture', style: { type: 'grain', color: '#F5F0E8' } },
  { label: 'Dark Grain', group: 'texture', style: { type: 'grain', color: '#1a1a1a' } },
  { label: 'Linen', group: 'texture', style: { type: 'grain', color: '#FAF6F0' } },
];

export function bgToCss(bg: BackgroundStyle): string {
  if (bg.type === 'gradient' && bg.gradientTo) {
    return `linear-gradient(${bg.gradientAngle || 180}deg, ${bg.color}, ${bg.gradientTo})`;
  }
  return bg.color;
}

interface Props {
  value: BackgroundStyle;
  onChange: (bg: BackgroundStyle) => void;
}

type BgTab = 'solid' | 'gradient' | 'texture';

export default function BackgroundStyler({ value, onChange }: Props) {
  const groups: { key: BgTab; label: string }[] = [
    { key: 'solid', label: 'Solid' },
    { key: 'gradient', label: 'Gradient' },
    { key: 'texture', label: 'Texture' },
  ];

  const currentTab: BgTab = value.type === 'grain' ? 'texture' : value.type === 'gradient' ? 'gradient' : 'solid';

  return (
    <div className="bg-card border-t border-border/60">
      <div className="px-4 py-4 flex flex-col gap-4">
        <label className="text-[9px] tracking-[0.14em] uppercase text-muted-foreground/60 font-medium">Background</label>

        {/* Group tabs */}
        <div className="flex gap-1 bg-muted/30 rounded-full p-0.5">
          {groups.map((g) => (
            <button
              key={g.key}
              onClick={() => {
                const firstInGroup = BG_PRESETS.find(p => p.group === g.key);
                if (firstInGroup) onChange(firstInGroup.style);
              }}
              className={cn(
                'flex-1 text-[9px] tracking-wider uppercase font-medium py-1.5 rounded-full transition-all duration-200',
                currentTab === g.key
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground/50 hover:text-foreground'
              )}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Swatches for current group */}
        <div className="flex gap-2.5 flex-wrap">
          {BG_PRESETS.filter(p => p.group === currentTab).map((p) => (
            <button
              key={p.label}
              onClick={() => onChange(p.style)}
              className={cn(
                'h-9 w-9 rounded-full border-2 transition-all duration-200 active:scale-90 relative overflow-hidden',
                value.color === p.style.color && value.type === p.style.type
                  ? 'border-primary scale-110 shadow-sm' : 'border-border/60 hover:border-foreground/30'
              )}
              title={p.label}
            >
              <div className="absolute inset-0" style={{ background: bgToCss(p.style) }} />
              {p.style.type === 'grain' && (
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Label row */}
        <div className="flex flex-wrap gap-1">
          {BG_PRESETS.filter(p => p.group === currentTab).map((p) => (
            <span key={p.label} className="text-[7px] tracking-wider uppercase text-muted-foreground/40 w-9 text-center truncate">
              {p.label}
            </span>
          ))}
        </div>

        {/* Custom color */}
        <div className="flex items-center gap-3">
          <label className="text-[9px] tracking-[0.14em] uppercase text-muted-foreground/60 font-medium">Custom</label>
          <label className="h-8 w-8 rounded-full border-2 border-dashed border-border/60 flex items-center justify-center cursor-pointer relative overflow-hidden hover:border-foreground/30 transition-colors duration-200">
            <span className="text-[8px] text-muted-foreground/40">+</span>
            <input
              type="color"
              value={value.color}
              onChange={(e) => onChange({ type: 'solid', color: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
