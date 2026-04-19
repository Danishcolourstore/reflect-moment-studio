import { useRef, useEffect, useState } from "react";
import { Plus, Trash2, Copy, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getOptimizedUrl } from "@/lib/image-utils";
import type { AlbumSize } from "./types";
import { SPREAD_SIZES } from "./types";

export interface SpreadSlot {
  id: string;
  spreadIndex: number;
  pageNumber: number;
}

interface Props {
  spreads: SpreadSlot[];
  currentSpreadId: string | null;
  onSelectSpread: (id: string) => void;
  onAddSpread: () => void;
  onDuplicateSpread: (id: string) => void;
  onDeleteSpread: (id: string) => void;
  onReorderSpread: (id: string, targetIndex: number) => Promise<void>;
  spreadThumbnails: Map<string, string>;
  albumSize: AlbumSize;
  /** Compact mode for phone screens */
  compact?: boolean;
}

export default function AlbumTimeline({
  spreads,
  currentSpreadId,
  onSelectSpread,
  onAddSpread,
  onDuplicateSpread,
  onDeleteSpread,
  onReorderSpread,
  spreadThumbnails,
  albumSize,
  compact,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sorted = [...spreads].sort((a, b) => a.spreadIndex - b.spreadIndex);
  const dim = SPREAD_SIZES[albumSize];

  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 180, behavior: "smooth" });
  };

  useEffect(() => {
    if (!scrollRef.current || !currentSpreadId) return;
    const el = scrollRef.current.querySelector(`[data-spread="${currentSpreadId}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentSpreadId]);

  const handleDragStart = (e: React.DragEvent, id: string, idx: number) => {
    if (idx === 0) { e.preventDefault(); return; }
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    if (!dragId || idx === 0) return;
    e.preventDefault();
    setDropIndex(idx);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (dragId && dropIndex !== null) await onReorderSpread(dragId, dropIndex);
    setDragId(null);
    setDropIndex(null);
  };

  return (
    <div
      className="border-t border-border bg-card/95 backdrop-blur flex items-center shrink-0"
      style={{ height: compact ? "56px" : "80px" }}
    >
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 ml-1 hidden sm:flex" onClick={() => scroll(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto flex items-center gap-2 px-2 scrollbar-none"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {sorted.map((spread, idx) => {
          const isCover = spread.spreadIndex === 0;
          const isActive = spread.id === currentSpreadId;
          const label = isCover ? "Cover" : `Spread ${spread.spreadIndex}`;
          const isDragging = dragId === spread.id;
          const showDropBefore = dropIndex === idx && dragId !== spread.id;
          const thumbUrl = spreadThumbnails.get(spread.id);
          // Panoramic thumbnail aspect
          const thumbAspect = dim.aspectRatio;

          return (
            <div key={spread.id} className="flex items-center">
              {showDropBefore && <div className="w-0.5 h-14 bg-primary rounded-full mx-0.5 shrink-0" />}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-spread={spread.id}
                    draggable={!isCover}
                    onDragStart={(e) => handleDragStart(e, spread.id, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={() => { setDragId(null); setDropIndex(null); }}
                    onClick={(e) => { e.preventDefault(); onSelectSpread(spread.id); }}
                    className={cn(
                      "shrink-0 rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 transition-all overflow-hidden",
                      !isCover && "cursor-grab active:cursor-grabbing",
                      isDragging && "opacity-40",
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-muted/20 hover:border-border hover:bg-muted/40"
                    )}
                    style={{ width: `${Math.max(56, 18 * thumbAspect)}px`, height: "56px" }}
                  >
                    {thumbUrl ? (
                      <img
                        src={getOptimizedUrl(thumbUrl, "thumbnail")}
                        alt=""
                        className="w-full h-10 rounded object-cover"
                      />
                    ) : (
                      <div className={cn(
                        "w-full h-10 rounded flex items-center justify-center text-[10px] font-medium",
                        isActive ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground"
                      )}>
                        {isCover ? <BookOpen size={14} strokeWidth={1.5} /> : spread.spreadIndex}
                      </div>
                    )}
                    <span className="text-[8px] text-muted-foreground leading-none truncate w-full text-center px-1">
                      {label}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" side="top">
                  <DropdownMenuItem onClick={() => onDuplicateSpread(spread.id)}>
                    <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                  </DropdownMenuItem>
                  {!isCover && (
                    <DropdownMenuItem className="text-destructive" onClick={() => onDeleteSpread(spread.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}

        <button
          onClick={onAddSpread}
          className="shrink-0 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-0.5 hover:border-primary/50 hover:bg-primary/5 transition-all"
          style={{ width: "56px", height: "56px" }}
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
          <span className="text-[8px] text-muted-foreground">Add</span>
        </button>
      </div>

      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 mr-1 hidden sm:flex" onClick={() => scroll(1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
