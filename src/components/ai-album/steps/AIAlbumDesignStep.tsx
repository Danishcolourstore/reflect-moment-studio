import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, Wand2 } from "lucide-react";
import type { DesignPreset } from "../ai-album-types";
import CustomAlbumSizeSelector, { type CustomSizeState, sizeToSpec } from "../CustomAlbumSizeSelector";
import { useDeviceDetect } from "@/hooks/use-device-detect";

interface Props {
  presets: DesignPreset[];
  selectedPreset: DesignPreset;
  onSelectPreset: (p: DesignPreset) => void;
  photoCount: number;
  estimatedSpreads: number;
  sizeState: CustomSizeState;
  onSizeChange: (s: CustomSizeState) => void;
  onBack: () => void;
  onGenerate: () => void;
}

export default function AIAlbumDesignStep({
  presets, selectedPreset, onSelectPreset, photoCount, estimatedSpreads, sizeState, onSizeChange, onBack, onGenerate,
}: Props) {
  const spec = sizeToSpec(sizeState);
  const device = useDeviceDetect();
  const isMobile = device.isPhone;

  return (
    <div className={cn(
      "mx-auto",
      isMobile ? "px-4 py-3 max-w-full" : "px-3 sm:px-4 py-4 sm:py-6 max-w-5xl"
    )}>
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="h-10 w-10 rounded-full flex items-center justify-center bg-muted/50 active:scale-95 transition-transform shrink-0"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className={cn("font-serif font-bold text-foreground", isMobile ? "text-lg" : "text-lg sm:text-xl")}>
            Design Your Album
          </h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            {photoCount} photos • ~{estimatedSpreads} spreads
          </p>
        </div>
      </div>

      {/* Album Size Selector */}
      <div className="bg-card/50 border border-border/40 rounded-2xl p-4 mb-4">
        <CustomAlbumSizeSelector value={sizeState} onChange={onSizeChange} />
      </div>

      <Separator className="my-4" />

      {/* Style heading */}
      <h3 className="text-sm font-serif font-semibold text-foreground mb-3">Choose Your Style</h3>

      {/* Preset grid — 2 columns on mobile for better touch targets */}
      <div className={cn(
        "grid gap-2.5",
        isMobile ? "grid-cols-2" : "grid-cols-1 xs:grid-cols-2 md:grid-cols-3 sm:gap-3"
      )}>
        {presets.map((preset) => {
          const isSelected = selectedPreset.id === preset.id;
          return (
            <Card
              key={preset.id}
              className={cn(
                "overflow-hidden cursor-pointer transition-all active:scale-[0.97]",
                isSelected ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
              )}
              onClick={() => onSelectPreset(preset)}
            >
              <div className={cn("relative", isMobile ? "h-12" : "h-14 sm:h-16")} style={{ backgroundColor: preset.bgColor }}>
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 px-3">
                  <div className="w-6 h-9 rounded-[2px] border" style={{ borderColor: preset.textColor + '40', backgroundColor: preset.textColor + '15' }} />
                  <div className="flex flex-col gap-[2px]">
                    <div className="w-5 h-4 rounded-[1px]" style={{ backgroundColor: preset.accentColor + '90' }} />
                    <div className="w-5 h-4 rounded-[1px]" style={{ backgroundColor: preset.textColor + '30' }} />
                  </div>
                  <div className="w-6 h-9 rounded-[2px] border" style={{ borderColor: preset.textColor + '40', backgroundColor: preset.accentColor + '15' }} />
                </div>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 bg-primary rounded-full p-0.5 shadow-sm">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>

              <div className="p-2.5">
                <h3 className="text-xs font-bold text-foreground leading-tight">{preset.name}</h3>
                {!isMobile && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{preset.description}</p>
                )}
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  <Badge variant="outline" className="text-[8px] px-1 py-0 capitalize">{preset.style}</Badge>
                  <Badge variant="outline" className="text-[8px] px-1 py-0 capitalize">{preset.photoArrangement.replace("-", " ")}</Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Separator className="my-4 sm:my-6" />

      {/* Summary + Generate — sticky on mobile */}
      <div className={cn(
        "flex flex-col gap-3 bg-muted/30 rounded-2xl p-4",
        isMobile && "sticky bottom-0 z-10 -mx-4 rounded-none border-t border-border/50 bg-card/95 backdrop-blur-xl px-4 pb-safe"
      )}>
        <div className={cn(isMobile ? "text-center" : "text-center sm:text-left")}>
          <p className="text-sm font-semibold text-foreground">{selectedPreset.name}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
            {photoCount} photos → ~{estimatedSpreads} spreads • {sizeState.heightIn}×{sizeState.widthIn}″ {spec.aspectLabel}
            {sizeState.printMode && " • Print mode"}
          </p>
        </div>
        <Button
          size="lg" onClick={onGenerate}
          className={cn(
            "gap-2 shadow-lg",
            isMobile ? "w-full h-12 text-base rounded-xl" : "w-full sm:w-auto px-8 h-12 text-base sm:self-end"
          )}
        >
          <Wand2 className="h-5 w-5" /> Generate Album
        </Button>
      </div>
    </div>
  );
}
