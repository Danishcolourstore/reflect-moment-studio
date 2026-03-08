/**
 * Logo upload and controls toolbar — polished UI.
 */

import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LogoLayer } from './LogoOverlay';
import { createLogoLayer } from './LogoOverlay';

interface Props {
  logo: LogoLayer | null;
  onAddLogo: (logo: LogoLayer) => void;
  onUpdateLogo: (patch: Partial<LogoLayer>) => void;
}

export default function LogoToolbar({ logo, onAddLogo, onUpdateLogo }: Props) {
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAddLogo(createLogoLayer(file));
  };

  return (
    <div className="bg-card border-t border-border/60">
      <div className="px-4 py-4 flex flex-col gap-4">
        <label className="text-[9px] tracking-[0.14em] uppercase text-muted-foreground/60 font-medium">Logo / Watermark</label>

        {!logo ? (
          <label className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl border border-dashed border-border/60 hover:border-foreground/20 bg-background cursor-pointer transition-all duration-200 active:scale-[0.98]">
            <Upload className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground/60">Upload Logo</span>
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img src={logo.imageUrl} alt="Logo" className="h-10 w-10 object-contain rounded-lg border border-border/60" />
              <label className="text-xs text-muted-foreground/60 cursor-pointer hover:text-foreground transition-colors duration-200 underline underline-offset-2">
                Replace
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </label>
            </div>

            {/* Size */}
            <div className="flex items-center gap-3">
              <label className="text-[9px] tracking-[0.14em] uppercase text-muted-foreground/60 font-medium w-12 shrink-0">Size</label>
              <input type="range" min={20} max={200} step={2} value={logo.width}
                onChange={(e) => onUpdateLogo({ width: parseFloat(e.target.value) })}
                className="flex-1 h-1 accent-foreground" />
              <span className="text-[10px] text-muted-foreground/60 w-12 text-right tabular-nums">{logo.width}px</span>
            </div>

            {/* Opacity */}
            <div className="flex items-center gap-3">
              <label className="text-[9px] tracking-[0.14em] uppercase text-muted-foreground/60 font-medium w-12 shrink-0">Opacity</label>
              <input type="range" min={0.1} max={1} step={0.05} value={logo.opacity}
                onChange={(e) => onUpdateLogo({ opacity: parseFloat(e.target.value) })}
                className="flex-1 h-1 accent-foreground" />
              <span className="text-[10px] text-muted-foreground/60 w-12 text-right tabular-nums">{(logo.opacity * 100).toFixed(0)}%</span>
            </div>

            {/* Quick position presets */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] tracking-[0.14em] uppercase text-muted-foreground/60 font-medium">Position</label>
              <div className="flex gap-1.5">
                {[
                  { label: 'Bottom R', x: 85, y: 90 },
                  { label: 'Bottom C', x: 50, y: 90 },
                  { label: 'Center', x: 50, y: 50 },
                  { label: 'Top L', x: 15, y: 10 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => onUpdateLogo({ x: p.x, y: p.y })}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg text-[8px] tracking-wider uppercase font-medium transition-all duration-200 active:scale-95',
                      logo.x === p.x && logo.y === p.y
                        ? 'bg-foreground text-background'
                        : 'bg-muted/30 text-muted-foreground/50 hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
