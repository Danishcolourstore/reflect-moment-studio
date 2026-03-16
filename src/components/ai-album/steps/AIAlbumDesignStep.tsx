import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, Sparkles, Wand2 } from "lucide-react";
import type { DesignPreset, IndianAlbumSize } from "../ai-album-types";
import { INDIAN_ALBUM_SIZES } from "../ai-album-types";

interface Props {
  presets: DesignPreset[];
  selectedPreset: DesignPreset;
  onSelectPreset: (p: DesignPreset) => void;
  photoCount: number;
  estimatedSpreads: number;
  autoSize: IndianAlbumSize;
  onBack: () => void;
  onGenerate: () => void;
}

export default function AIAlbumDesignStep({
  presets, selectedPreset, onSelectPreset, photoCount, estimatedSpreads, autoSize, onBack, onGenerate,
}: Props) {
  const sizeSpec = INDIAN_ALBUM_SIZES[autoSize];

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6 max-w-5xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground">Choose Your Style</h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            {photoCount} photos • ~{estimatedSpreads} spreads • {autoSize}" {sizeSpec.aspectLabel}
          </p>
        </div>
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
        {presets.map((preset) => {
          const isSelected = selectedPreset.id === preset.id;
          return (
            <Card
              key={preset.id}
              className={cn(
                "overflow-hidden cursor-pointer transition-all group",
                isSelected ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md hover:ring-1 hover:ring-border"
              )}
              onClick={() => onSelectPreset(preset)}
            >
              {/* Color preview bar */}
              <div className="h-14 sm:h-16 relative" style={{ backgroundColor: preset.bgColor }}>
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 px-3">
                  {/* Mini layout mockup */}
                  <div className="w-7 h-10 sm:w-8 sm:h-11 rounded-[2px] border" style={{ borderColor: preset.textColor + '40', backgroundColor: preset.textColor + '15' }} />
                  <div className="flex flex-col gap-[2px]">
                    <div className="w-5 h-[18px] sm:w-6 sm:h-5 rounded-[1px]" style={{ backgroundColor: preset.accentColor + '90' }} />
                    <div className="w-5 h-[18px] sm:w-6 sm:h-5 rounded-[1px]" style={{ backgroundColor: preset.textColor + '30' }} />
                  </div>
                  <div className="w-7 h-10 sm:w-8 sm:h-11 rounded-[2px] border" style={{ borderColor: preset.textColor + '40', backgroundColor: preset.accentColor + '15' }} />
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-primary rounded-full p-0.5 shadow-sm">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>

              <div className="p-2.5 sm:p-3">
                <h3 className="text-xs sm:text-sm font-bold text-foreground leading-tight">{preset.name}</h3>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{preset.description}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-[8px] sm:text-[9px] px-1 py-0 capitalize">{preset.style}</Badge>
                  <Badge variant="outline" className="text-[8px] sm:text-[9px] px-1 py-0 capitalize">{preset.photoArrangement.replace("-", " ")}</Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Separator className="my-5 sm:my-6" />

      {/* Summary + Generate button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30 rounded-xl p-4 sm:p-5">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold text-foreground">
            {selectedPreset.name}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
            {photoCount} photos → ~{estimatedSpreads} spreads • {autoSize}" album • AI storytelling flow
          </p>
        </div>
        <Button size="lg" onClick={onGenerate} className="gap-2 w-full sm:w-auto px-8 h-12 text-base shadow-lg">
          <Wand2 className="h-5 w-5" /> Generate Album
        </Button>
      </div>
    </div>
  );
}
