import { useState, useMemo } from "react";
import { useGridTemplates } from "@/hooks/use-grid-templates";
import { GRID_LAYOUTS, type GridLayout } from "./types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  onSelect: (layout: GridLayout) => void;
}

const CATEGORIES = [
  { key: "single", label: "Single" },
  { key: "basic", label: "Basic" },
  { key: "instagram", label: "Instagram" },
  { key: "creative", label: "Creative" },
] as const;

function LayoutPreview({ layout }: { layout: GridLayout }) {
  return (
    <div className="w-full aspect-square overflow-hidden rounded-lg bg-muted/20">
      <div
        className="w-full h-full grid"
        style={{
          gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
          gap: "2px",
          padding: "2px",
        }}
      >
        {layout.cells.map((cell, i) => (
          <div
            key={i}
            className="bg-primary/15 rounded-[2px]"
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
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 bg-muted/30 rounded-full p-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={cn(
              "flex-1 text-[10px] tracking-wider uppercase font-medium py-2 rounded-full transition-all",
              cat === c.key ? "bg-foreground text-background" : "text-muted-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((layout) => (
            <button
              key={layout.id}
              onClick={() => onSelect(layout)}
              className="p-3 rounded-xl border hover:border-primary transition"
            >
              <LayoutPreview layout={layout} />
              <p className="text-[10px] mt-2 text-muted-foreground uppercase">{layout.name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
