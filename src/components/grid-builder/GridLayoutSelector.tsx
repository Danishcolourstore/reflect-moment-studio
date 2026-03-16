import { useState, useMemo } from "react";
import { useGridTemplates } from "@/hooks/use-grid-templates";
import { GRID_LAYOUTS, type GridLayout } from "./types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  onSelect: (layout: GridLayout) => void;
}

const CATEGORIES = [
  { key: "single", label: "Single", emoji: "◻" },
  { key: "basic", label: "Grid", emoji: "⊞" },
  { key: "instagram", label: "Carousel", emoji: "◈" },
  { key: "creative", label: "Creative", emoji: "✦" },
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

  const layouts = useMemo(() => {
    if (dbTemplates && dbTemplates.length > 0) return dbTemplates;
    return GRID_LAYOUTS;
  }, [dbTemplates]);

  const filtered = layouts.filter((l) => l.category === cat);

  return (
    <div className="flex flex-col gap-5">
      {/* Category tabs */}
      <div className="flex gap-1 bg-secondary/40 rounded-xl p-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 text-[10px] tracking-[0.12em] uppercase font-medium py-2.5 rounded-[10px] transition-all duration-300",
              cat === c.key
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-[11px]">{c.emoji}</span>
            <span className="hidden xs:inline">{c.label}</span>
          </button>
        ))}
      </div>

      {/* Layout count */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-wider uppercase text-muted-foreground/60">
          {filtered.length} layouts
        </p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {filtered.map((layout) => (
            <button
              key={layout.id}
              onClick={() => onSelect(layout)}
              className="group p-2.5 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 active:scale-95"
            >
              <LayoutPreview layout={layout} />
              <p className="text-[9px] mt-2 text-muted-foreground/70 uppercase tracking-wider font-medium group-hover:text-foreground transition-colors truncate">
                {layout.name}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
