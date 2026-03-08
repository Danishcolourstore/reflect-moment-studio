import { useRef } from 'react';
import { Plus, Trash2, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface PageSlot {
  id: string;
  pageNumber: number;
  spreadIndex: number;
}

interface Props {
  pages: PageSlot[];
  currentPageId: string | null;
  spreadView: boolean;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDuplicatePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
}

export default function AlbumTimeline({
  pages, currentPageId, spreadView, onSelectPage, onAddPage, onDuplicatePage, onDeletePage,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  // Group pages into spread pairs for display
  const slots = pages.sort((a, b) => a.pageNumber - b.pageNumber);

  return (
    <div className="h-24 border-t border-border bg-card/95 backdrop-blur-xl flex items-center shrink-0 relative">
      {/* Scroll left */}
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 ml-1" onClick={() => scroll(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Scrollable area */}
      <div ref={scrollRef} className="flex-1 overflow-x-auto flex items-center gap-2 px-2 scrollbar-thin">
        {slots.map((page) => {
          const isCover = page.pageNumber === 0;
          const isActive = page.id === currentPageId;
          const label = isCover ? 'Cover' : `Page ${page.pageNumber}`;

          return (
            <DropdownMenu key={page.id}>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => { e.preventDefault(); onSelectPage(page.id); }}
                  onContextMenu={(e) => e.preventDefault()}
                  className={cn(
                    'shrink-0 w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all hover:border-primary/50 cursor-pointer group relative',
                    isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/30'
                  )}
                >
                  <div className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center">
                    <span className="text-[9px] text-muted-foreground font-medium">{isCover ? '📖' : page.pageNumber}</span>
                  </div>
                  <span className="text-[8px] text-muted-foreground leading-none truncate max-w-full px-1">{label}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top">
                <DropdownMenuItem onClick={() => onDuplicatePage(page.id)}>
                  <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                </DropdownMenuItem>
                {!isCover && (
                  <DropdownMenuItem className="text-destructive" onClick={() => onDeletePage(page.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}

        {/* Add page button */}
        <button
          onClick={onAddPage}
          className="shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
          <span className="text-[8px] text-muted-foreground">Add Page</span>
        </button>
      </div>

      {/* Scroll right */}
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mr-1" onClick={() => scroll(1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
