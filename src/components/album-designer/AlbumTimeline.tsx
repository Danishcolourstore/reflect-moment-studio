import { useRef, useEffect } from "react";
import { Plus, Trash2, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface PageSlot {
  id: string;
  pageNumber: number;
  spreadIndex: number;
}

interface Props {
  pages: PageSlot[];
  currentPageId: string | null;
  currentSpreadIndex: number;
  spreadView: boolean;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDuplicatePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
}

export default function AlbumTimeline({
  pages,
  currentPageId,
  currentSpreadIndex,
  spreadView,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const slots = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 160, behavior: "smooth" });
  };

  useEffect(() => {
    if (!scrollRef.current || !currentPageId) return;
    const el = scrollRef.current.querySelector(
      `[data-page="${currentPageId}"]`
    ) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentPageId]);

  return (
    <div className="border-t border-border bg-card/95 backdrop-blur flex items-center shrink-0 relative"
      style={{ height: "72px" }}
    >
      {/* Left scroll arrow — hidden on touch devices where swipe works */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 ml-1 hidden sm:flex"
        onClick={() => scroll(-1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto flex items-center gap-1.5 px-2 scrollbar-none"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {slots.map((page) => {
          const isCover = page.pageNumber === 0;
          const isActive = page.id === currentPageId;
          const isSpreadActive =
            spreadView && !isCover && page.spreadIndex === currentSpreadIndex;
          const label = isCover ? "Cover" : `P${page.pageNumber}`;

          return (
            <DropdownMenu key={page.id}>
              <DropdownMenuTrigger asChild>
                <button
                  data-page={page.id}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectPage(page.id);
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  className={cn(
                    "shrink-0 rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer",
                    // Slightly smaller on mobile, normal on desktop
                    "w-12 h-14 sm:w-14 sm:h-16",
                    isActive
                      ? "border-primary bg-primary/10 shadow-sm"
                      : isSpreadActive
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-muted/20 hover:border-border hover:bg-muted/40"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center text-[10px] font-medium",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-muted/50 text-muted-foreground"
                    )}
                  >
                    {isCover ? "📖" : page.pageNumber}
                  </div>
                  <span className="text-[8px] text-muted-foreground leading-none">
                    {label}
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="center" side="top">
                <DropdownMenuItem onClick={() => onDuplicatePage(page.id)}>
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                {!isCover && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDeletePage(page.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}

        {/* Add page button */}
        <button
          onClick={onAddPage}
          className="shrink-0 w-12 h-14 sm:w-14 sm:h-16 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-0.5 hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
          <span className="text-[8px] text-muted-foreground">Add</span>
        </button>
      </div>

      {/* Right scroll arrow — hidden on touch devices */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 mr-1 hidden sm:flex"
        onClick={() => scroll(1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}