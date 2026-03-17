import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, ChevronLeft, RefreshCw, Edit3 } from "lucide-react";
import type { DesignPreset, AIAlbumGenerationResult } from "../ai-album-types";
import AIAlbumPreviewGrid from "../AIAlbumPreviewGrid";
import { useDeviceDetect } from "@/hooks/use-device-detect";
import { cn } from "@/lib/utils";

interface Props {
  result: AIAlbumGenerationResult;
  preset: DesignPreset;
  albumId: string | null;
  onRegenerate: () => void;
  onEditInEditor: () => void;
  onBack: () => void;
}

export default function AIAlbumPreviewStep({
  result, preset, albumId, onRegenerate, onEditInEditor, onBack,
}: Props) {
  const device = useDeviceDetect();
  const isMobile = device.isPhone;

  return (
    <div className={cn(
      "mx-auto space-y-3 sm:space-y-4",
      isMobile ? "px-4 py-3 max-w-full" : "px-3 sm:px-4 py-4 sm:py-6 max-w-5xl"
    )}>
      {/* Header row */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="h-10 w-10 rounded-full flex items-center justify-center bg-muted/50 active:scale-95 transition-transform shrink-0"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className={cn("font-serif font-bold text-foreground", isMobile ? "text-lg" : "text-lg sm:text-xl")}>
            Album Preview
          </h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Review before editing or exporting
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <Card className="p-3">
        <div className={cn("flex gap-2", isMobile ? "flex-col" : "flex-col sm:flex-row sm:items-center sm:gap-3")}>
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap flex-1">
            <span className="font-bold text-foreground">{result.spreads.length} Spreads</span>
            <span className="text-muted-foreground">{result.totalPhotosUsed} photos</span>
            {result.totalPhotosSkipped > 0 && (
              <span className="text-muted-foreground/60">{result.totalPhotosSkipped} skipped</span>
            )}
            <Badge variant="secondary" className="text-[9px]">{preset.name}</Badge>
          </div>
          <Button
            variant="outline" size="sm" onClick={onRegenerate}
            className="gap-1 h-9 text-xs min-w-[44px]"
          >
            <RefreshCw className="h-3 w-3" /> Regenerate
          </Button>
        </div>
      </Card>

      {/* Spread previews */}
      <ScrollArea className={cn(isMobile ? "h-[50vh]" : "h-[45vh] sm:h-[50vh]")}>
        <AIAlbumPreviewGrid spreads={result.spreads} preset={preset} />
      </ScrollArea>

      {/* Bottom actions — full width stacked on mobile */}
      <div className={cn(
        "flex gap-2 pt-1",
        isMobile
          ? "flex-col sticky bottom-0 z-10 -mx-4 px-4 pb-safe pt-3 bg-card/95 backdrop-blur-xl border-t border-border/50"
          : "flex-col sm:flex-row sm:gap-3"
      )}>
        <Button
          size="lg"
          onClick={onEditInEditor}
          className={cn("gap-2 shadow-lg", isMobile ? "w-full h-12 text-base rounded-xl" : "flex-1 sm:flex-none h-11 sm:h-12")}
        >
          Open Album Editor <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onEditInEditor}
          className={cn("gap-2", isMobile ? "w-full h-11 text-sm rounded-xl" : "flex-1 sm:flex-none h-11 sm:h-12")}
        >
          <Edit3 className="h-4 w-4" /> Edit Pages
        </Button>
      </div>
    </div>
  );
}
