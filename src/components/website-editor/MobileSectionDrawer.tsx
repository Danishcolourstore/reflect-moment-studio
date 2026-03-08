import { useState } from 'react';
import { GripVertical, Eye, EyeOff, ChevronRight, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

interface SectionMeta {
  id: string;
  label: string;
  icon: string;
}

interface MobileSectionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: SectionMeta[];
  sectionOrder: string[];
  sectionVisibility: Record<string, boolean>;
  onReorder: (order: string[]) => void;
  onToggleVisibility: (id: string) => void;
  onEditSection: (id: string) => void;
}

export function MobileSectionDrawer({
  open, onOpenChange, sections, sectionOrder, sectionVisibility,
  onReorder, onToggleVisibility, onEditSection,
}: MobileSectionDrawerProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const moveSection = (from: number, to: number) => {
    const newOrder = [...sectionOrder];
    const [moved] = newOrder.splice(from, 1);
    newOrder.splice(to, 0, moved);
    onReorder(newOrder);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-sm font-semibold">Manage Sections</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto space-y-1">
          <p className="text-[9px] text-muted-foreground/50 mb-3">
            Tap to edit · Use arrows to reorder · Toggle visibility
          </p>
          {sectionOrder.map((sectionId, idx) => {
            const sec = sections.find(s => s.id === sectionId);
            if (!sec) return null;
            const isOn = sectionVisibility[sectionId] !== false;

            return (
              <div
                key={sectionId}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                  !isOn ? 'opacity-40 border-border/50' : 'border-border'
                } bg-card`}
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => idx > 0 && moveSection(idx, idx - 1)}
                    disabled={idx === 0}
                    className="text-muted-foreground/40 hover:text-foreground disabled:opacity-20 p-0.5"
                  >
                    <GripVertical className="h-3 w-3 rotate-180" />
                  </button>
                  <button
                    onClick={() => idx < sectionOrder.length - 1 && moveSection(idx, idx + 1)}
                    disabled={idx === sectionOrder.length - 1}
                    className="text-muted-foreground/40 hover:text-foreground disabled:opacity-20 p-0.5"
                  >
                    <GripVertical className="h-3 w-3" />
                  </button>
                </div>

                <span className="text-base shrink-0">{sec.icon}</span>

                <button
                  onClick={() => { onEditSection(sectionId); onOpenChange(false); }}
                  className="flex-1 text-left text-sm text-foreground font-medium active:text-primary transition-colors"
                >
                  {sec.label}
                </button>

                <button
                  onClick={() => onToggleVisibility(sectionId)}
                  className="shrink-0 p-2 rounded-lg hover:bg-muted active:bg-muted transition-colors"
                >
                  {isOn ? <Eye className="h-4 w-4 text-muted-foreground/50" /> : <EyeOff className="h-4 w-4 text-muted-foreground/30" />}
                </button>

                <ChevronRight className="h-4 w-4 text-muted-foreground/20 shrink-0" />
              </div>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
