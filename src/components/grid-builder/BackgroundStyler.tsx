/**
 * Background style controls — solid, gradient, and presets.
 */

import { cn } from '@/lib/utils';

export interface BackgroundStyle {
  type: 'solid' | 'gradient' | 'grain';
  color: string;
  gradientTo?: string;
  gradientAngle?: number;
}

export const DEFAULT_BG: BackgroundStyle = { type: 'solid', color: '#ffffff' };

export const BG_PRESETS: { label: string; style: BackgroundStyle }[] = [
  { label: 'White', style: { type: 'solid', color: '#ffffff' } },
  { label: 'Cream', style: { type: 'solid', color: '#FAF6F0' } },
  { label: 'Beige', style: { type: 'solid', color: '#F5F0E8' } },
  { label: 'Black', style: { type: 'solid', color: '#0a0a0a' } },
  { label: 'Gold Tint', style: { type: 'solid', color: '#F8F3E6' } },
  { label: 'Warm Grad', style: { type: 'gradient', color: '#F5F0E8', gradientTo: '#E8DDD0', gradientAngle: 180 } },
  { label: 'Dark Grad', style: { type: 'gradient', color: '#1a1a1a', gradientTo: '#0a0a0a', gradientAngle: 180 } },
  { label: 'Gold Grad', style: { type: 'gradient', color: '#F8F3E6', gradientTo: '#D4AF37', gradientAngle: 135 } },
  { label: 'Grain', style: { type: 'grain', color: '#F5F0E8' } },
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

export default function BackgroundStyler({ value, onChange }: Props) {
  return (
    <div className="bg-card border-t border-border/60">
      <div className="px-4 py-4 flex flex-col gap-4">
        <label className="text-[9px] tracking-[0.14em] uppercase text-muted-foreground/60 font-medium">Background</label>

        {/* Preset swatches */}
        <div className="flex gap-2.5 flex-wrap">
          {BG_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onChange(p.style)}
              className={cn(
                'h-8 w-8 rounded-full border-2 transition-all duration-200 active:scale-90 relative overflow-hidden',
                value.color === p.style.color && value.type === p.style.type
                  ? 'border-foreground scale-110 shadow-sm' : 'border-border/60 hover:border-foreground/30'
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
