/**
 * Logo upload and controls toolbar.
 */

import { Upload } from 'lucide-react';
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
    <div className="flex flex-col gap-0 bg-card border-t border-border">
      <div className="px-4 py-3 flex flex-col gap-3">
        <label className="text-[9px] tracking-wider uppercase text-muted-foreground">Logo / Watermark</label>

        {!logo ? (
          <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border hover:border-foreground/20 bg-background cursor-pointer transition-all active:scale-95">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Upload Logo</span>
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img src={logo.imageUrl} alt="Logo" className="h-10 w-10 object-contain rounded border border-border" />
              <label className="text-xs text-muted-foreground cursor-pointer underline">
                Replace
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </label>
            </div>

            {/* Size */}
            <div className="flex items-center gap-3">
              <label className="text-[9px] tracking-wider uppercase text-muted-foreground w-12 shrink-0">Size</label>
              <input type="range" min={20} max={200} step={2} value={logo.width}
                onChange={(e) => onUpdateLogo({ width: parseFloat(e.target.value) })}
                className="flex-1 h-1 accent-foreground" />
              <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{logo.width}px</span>
            </div>

            {/* Opacity */}
            <div className="flex items-center gap-3">
              <label className="text-[9px] tracking-wider uppercase text-muted-foreground w-12 shrink-0">Opacity</label>
              <input type="range" min={0.1} max={1} step={0.05} value={logo.opacity}
                onChange={(e) => onUpdateLogo({ opacity: parseFloat(e.target.value) })}
                className="flex-1 h-1 accent-foreground" />
              <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{(logo.opacity * 100).toFixed(0)}%</span>
            </div>

            {/* Quick position presets */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] tracking-wider uppercase text-muted-foreground">Position</label>
              <div className="flex gap-2">
                {[
                  { label: 'Bottom Right', x: 85, y: 90 },
                  { label: 'Bottom Center', x: 50, y: 90 },
                  { label: 'Center', x: 50, y: 50 },
                  { label: 'Top Left', x: 15, y: 10 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => onUpdateLogo({ x: p.x, y: p.y })}
                    className="flex-1 py-1.5 rounded-lg text-[8px] tracking-wider uppercase bg-muted/50 text-muted-foreground hover:text-foreground transition-all active:scale-95"
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
