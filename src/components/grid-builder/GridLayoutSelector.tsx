import { useState, useMemo } from "react";
import { useGridTemplates } from "@/hooks/use-grid-templates";
import { useDeviceDetect } from "@/hooks/use-device-detect";
import { GRID_LAYOUTS, type GridLayout } from "./types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Square, Grid3X3, LayoutGrid, Sparkles } from "lucide-react";

interface Props {
  onSelect: (layout: GridLayout) => void;
}

const CATEGORIES = [
  { key: "single", label: "Single", Icon: Square },
  { key: "basic", label: "Grid", Icon: Grid3X3 },
  { key: "instagram", label: "Carousel", Icon: LayoutGrid },
  { key: "creative", label: "Creative", Icon: Sparkles },
] as const;

function LayoutPreview({ layout }: { layout: GridLayout }) {
  const ratio = layout.canvasRatio ?? 1;
  return (
    <div
      className="w-full overflow-hidden rounded-lg bg-secondary/30"
      style={{ aspectRatio: `${ratio}` }}
    >
      <div
        className="w-full h-full grid p-[3px]"
        style={{
          gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
          gap: "2px",
        }}
      >
        {layout.cells.map((cell, i) => (
          <div
            key={i}
            className="bg-primary/12 rounded-[3px] transition-colors group-hover:bg-primary/25"
            style={{
              gridRow: `${cell[0]} / ${cell[2]}`,
              gridColumn: `${cell[1]} / ${cell[3]}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function GridLayoutSelector({ onSelect }: Props) {
  const [cat, setCat] = useState<"single" | "basic" | "instagram" | "creative">("single");
  const { data: dbTemplates, isLoading } = useGridTemplates();
  const device = useDeviceDetect();
  const isMobile = device.isPhone;

  const layouts = useMemo(() => {
    if (dbTemplates && dbTemplates.length > 0) return dbTemplates;
    return GRID_LAYOUTS;
  }, [dbTemplates]);

  const filtered = layouts.filter((l) => l.category === cat);

  return (
    <div className="flex flex-col gap-4">
      {/* Category tabs — larger on mobile for tap targets */}
      <div className={cn(
        "flex bg-secondary/40 rounded-xl",
        isMobile ? "gap-0.5 p-1" : "gap-1 p-1"
      )}>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 font-medium rounded-[10px] transition-all duration-300",
              isMobile
                ? "text-[11px] tracking-[0.08em] uppercase py-3 min-h-[44px]"
                : "text-[10px] tracking-[0.12em] uppercase py-2.5",
              cat === c.key
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground active:bg-muted/40 hover:text-foreground"
            )}
          >
            <c.Icon size={isMobile ? 14 : 12} strokeWidth={1.5} />
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Layout count */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-wider uppercase text-muted-foreground/60">
          {filtered.length} layouts
        </p>
      </div>

      {/* Grid — 2 cols on phone, 3 on tablet, 4 on desktop */}
      {isLoading ? (
        <div className={cn(
          "grid gap-3",
          isMobile ? "grid-cols-2" : "grid-cols-3 sm:grid-cols-4"
        )}>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : (
        <div className={cn(
          "grid gap-3",
          isMobile ? "grid-cols-2" : "grid-cols-3 sm:grid-cols-4"
        )}>
          {filtered.map((layout) => (
            <button
              key={layout.id}
              onClick={() => onSelect(layout)}
              className={cn(
                "group rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 active:scale-95",
                isMobile ? "p-3" : "p-2.5"
              )}
            >
              <LayoutPreview layout={layout} />
              <p className={cn(
                "mt-2 text-muted-foreground/70 uppercase tracking-wider font-medium group-hover:text-foreground transition-colors truncate",
                isMobile ? "text-[10px]" : "text-[9px]"
              )}>
                {layout.name}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
