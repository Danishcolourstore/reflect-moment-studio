import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { GeneratedSpread, DesignPreset } from "./ai-album-types";
import { MOMENT_LABELS } from "./ai-album-types";

interface Props {
  spreads: GeneratedSpread[];
  preset: DesignPreset;
  className?: string;
}

export default function AIAlbumPreviewGrid({ spreads, preset, className }: Props) {
  const previewSpreads = useMemo(() => spreads.slice(0, 60), [spreads]);

  return (
    <div className={cn("space-y-4", className)}>
      {previewSpreads.map((spread, i) => (
        <div key={i} className="space-y-1">
          {/* Moment label on section change */}
          {(i === 0 || spread.moment !== spreads[i - 1]?.moment) && (
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium pt-2">
              {MOMENT_LABELS[spread.moment] || spread.moment}
            </p>
          )}

          {/* Spread preview */}
          <div
            className="relative rounded overflow-hidden shadow-sm border border-border/50"
            style={{
              backgroundColor: spread.bgColor,
              aspectRatio: "3 / 1",
            }}
          >
            <div
              className="absolute inset-0 grid gap-[1px]"
              style={{
                gridTemplateColumns: `repeat(${spread.layout.gridCols}, 1fr)`,
                gridTemplateRows: `repeat(${spread.layout.gridRows}, 1fr)`,
                padding: `${Math.max(1, preset.spacing / 6)}px`,
                gap: `${Math.max(1, preset.spacing / 6)}px`,
              }}
            >
              {spread.layout.cells.map((cell, ci) => {
                const photo = spread.photos[ci];
                const url = photo?.url;
                return (
                  <div
                    key={ci}
                    className="overflow-hidden"
                    style={{
                      gridRow: `${cell[0]} / ${cell[2]}`,
                      gridColumn: `${cell[1]} / ${cell[3]}`,
                      borderRadius: `${preset.borderRadius / 3}px`,
                    }}
                  >
                    {url ? (
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted/60" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Spread number */}
            <div className="absolute bottom-1 right-1.5 bg-black/50 text-white text-[8px] px-1.5 py-0.5 rounded-sm font-mono">
              {i + 1}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
