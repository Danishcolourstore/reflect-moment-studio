import { ArrowLeft } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

interface MobileEditorPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionLabel: string;
  sectionIcon: string;
  onBack: () => void;
  children: React.ReactNode;
}

export function MobileEditorPanel({
  open, onOpenChange, sectionLabel, sectionIcon, onBack, children,
}: MobileEditorPanelProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <DrawerTitle className="text-sm font-semibold flex items-center gap-2">
              <span>{sectionIcon}</span> {sectionLabel}
            </DrawerTitle>
          </div>
        </DrawerHeader>
        <div className="px-4 pb-8 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
