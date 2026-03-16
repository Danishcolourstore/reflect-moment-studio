import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, ChevronLeft, RefreshCw, Edit3, Download } from "lucide-react";
import type { DesignPreset, AIAlbumGenerationResult } from "../ai-album-types";
import AIAlbumPreviewGrid from "../AIAlbumPreviewGrid";

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
  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6 max-w-5xl mx-auto space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground">Album Preview</h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Review your album before editing or exporting
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap flex-1">
            <span className="font-bold text-foreground">{result.spreads.length} Spreads</span>
            <span className="text-muted-foreground">{result.totalPhotosUsed} photos</span>
            {result.totalPhotosSkipped > 0 && (
              <span className="text-muted-foreground/60">{result.totalPhotosSkipped} skipped</span>
            )}
            <Badge variant="secondary" className="text-[9px]">{preset.name}</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-1 h-8 text-[11px] sm:text-xs flex-1 sm:flex-none">
              <RefreshCw className="h-3 w-3" /> Regenerate
            </Button>
          </div>
        </div>
      </Card>

      {/* Spread previews */}
      <ScrollArea className="h-[45vh] sm:h-[50vh]">
        <AIAlbumPreviewGrid spreads={result.spreads} preset={preset} />
      </ScrollArea>

      {/* Bottom actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1">
        <Button
          size="lg"
          variant="outline"
          onClick={onEditInEditor}
          className="gap-2 flex-1 sm:flex-none h-11 sm:h-12"
        >
          <Edit3 className="h-4 w-4" /> Edit Pages
        </Button>
        <Button
          size="lg"
          onClick={onEditInEditor}
          className="gap-2 flex-1 sm:flex-none h-11 sm:h-12 shadow-lg"
        >
          Open Album Editor <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
