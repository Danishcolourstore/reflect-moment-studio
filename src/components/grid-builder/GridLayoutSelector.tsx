}import { useState, useMemo } from "react";
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

/* ---------- Layout Preview ---------- */

function LayoutPreview({ layout }: { layout: GridLayout }) {
  const hasFrame = !!layout.frame;

  return (
    <div className="w-full aspect-square overflow-hidden rounded-lg bg-muted/20 relative">
      {hasFrame ? (
        <div
          className="w-full h-full flex items-center justify-center relative"
          style={{
            padding: `${layout.frame!.padding[0]}% ${layout.frame!.padding[1]}% ${layout.frame!.padding[2]}% ${layout.frame!.padding[3]}%`,
            background:
              layout.frame!.background === "#ffffff"
                ? "hsl(var(--muted) / 0.3)"
                : layout.frame!.background,
          }}
        >
          <div
            className="w-full h-full bg-primary/20"
            style={{
              borderRadius: layout.frame!.imageRadius
                ? `${Math.min(layout.frame!.imageRadius, 6)}px`
                : undefined,
              boxShadow: layout.frame!.shadow
                ? "0 2px 8px rgba(0,0,0,0.15)"
                : undefined,
              border: layout.frame!.borderWidth
                ? `${Math.max(
                    1,
                    layout.frame!.borderWidth
                  )}px solid hsl(var(--border))`
                : undefined,
            }}
          />
        </div>
      ) : (
        <div
          className="w-full h-full"
          style={{
            display: "grid",
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
      )}
    </div>
  );
}

/* ---------- Cell Count Badge ---------- */

function CellCount({ layout }: { layout: GridLayout }) {
  const count = layout.cells.length;

  return (
    <span className="text-[8px] tracking-wider text-muted-foreground/40 tabular-nums">
      {count} {count === 1 ? "cell" : "cells"}
    </span>
  );
}

/* ---------- Main Selector ---------- */

export default function GridLayoutSelector({ onSelect }: Props) {
  const [cat, setCat] = useState<
    "single" | "basic" | "instagram" | "creative"
  >("single");

  const { data: dbTemplates, isLoading } = useGridTemplates();

  const layouts = useMemo(() => {
    if (dbTemplates && dbTemplates.length > 0) {
      return dbTemplates;
    }
    return GRID_LAYOUTS;
  }, [dbTemplates]);

  const filtered = layouts.filter((l) => l.category === cat);

  return (
    <div className="flex flex-col gap-6">
      {/* Category Tabs */}

      <div className="flex gap-1 bg-muted/30 rounded-full p-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={cn(
              "flex-1 text-[10px] tracking-wider uppercase font-medium py-2 rounded-full transition-all duration-200",
              cat === c.key
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground/50 hover:text-foreground"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Loading State */}

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No layouts in this category
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((layout) => (
            <button
              key={layout.id}
              onClick={() => onSelect(layout)}
              className={cn(
                "group flex flex-col items-center gap-2 p-3 rounded-xl border bg-card transition-all duration-200 active:scale-95",
                "border-border/60 hover:border-primary/50 hover:shadow-[0_0_20px_-6px_hsl(var(--primary)/0.25)]"
              )}
            >
              <LayoutPreview layout={layout} />

              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] tracking-wider uppercase text-muted-foreground/70 font-medium group-hover:text-foreground transition-colors">
                  {layout.name}
                </span>

                <CellCount layout={layout} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
