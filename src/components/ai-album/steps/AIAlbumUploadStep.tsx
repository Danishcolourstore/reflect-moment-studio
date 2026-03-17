import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Upload, X, ImageIcon, Sparkles, ArrowRight, Camera, FolderOpen } from "lucide-react";
import { INDIAN_ALBUM_SIZES, type IndianAlbumSize } from "../ai-album-types";
import { useDeviceDetect } from "@/hooks/use-device-detect";

interface Props {
  files: File[];
  thumbnailUrls: Map<string, string>;
  onFilesAdded: (files: FileList | null) => void;
  onRemoveFile: (idx: number) => void;
  onClearAll: () => void;
  estimatedSpreads: number;
  autoSize: IndianAlbumSize;
  onContinue: () => void;
}

export default function AIAlbumUploadStep({
  files, thumbnailUrls, onFilesAdded, onRemoveFile, onClearAll,
  estimatedSpreads, autoSize, onContinue,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const device = useDeviceDetect();
  const canContinue = files.length >= 5;
  const sizeSpec = INDIAN_ALBUM_SIZES[autoSize];
  const isMobile = device.isPhone;

  return (
    <div className={cn(
      "flex flex-col items-center mx-auto",
      isMobile ? "px-4 py-4 max-w-full" : "px-3 sm:px-4 py-6 sm:py-10 max-w-3xl"
    )}>
      {/* Header */}
      <div className="text-center mb-5 sm:mb-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium mb-3">
          <Sparkles className="h-3.5 w-3.5" /> AI Album Builder
        </div>
        <h1 className={cn(
          "font-serif font-bold text-foreground",
          isMobile ? "text-xl" : "text-2xl md:text-3xl"
        )}>
          Import Your Photos
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Upload wedding photos. AI handles sizing, layout & storytelling.
        </p>
      </div>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef} type="file"
        accept="image/jpeg,image/png,image/webp,image/heic" multiple className="hidden"
        onChange={(e) => { onFilesAdded(e.target.files); if (e.target) e.target.value = ""; }}
      />
      <input
        ref={cameraInputRef} type="file"
        accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { onFilesAdded(e.target.files); if (e.target) e.target.value = ""; }}
      />

      {/* Upload zone */}
      {files.length === 0 ? (
        <div className="w-full space-y-3">
          {/* Main upload tap area */}
          <div
            className={cn(
              "w-full border-2 border-dashed rounded-2xl cursor-pointer transition-all",
              "flex flex-col items-center justify-center text-center",
              isMobile ? "p-8" : "p-10 sm:p-16",
              isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/40 active:bg-muted/30"
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); onFilesAdded(e.dataTransfer.files); }}
          >
            <div className={cn(
              "rounded-2xl bg-primary/10 flex items-center justify-center mb-4",
              isMobile ? "w-14 h-14" : "w-16 h-16 sm:w-20 sm:h-20"
            )}>
              <FolderOpen className={cn("text-primary", isMobile ? "h-7 w-7" : "h-7 w-7 sm:h-9 sm:w-9")} />
            </div>
            <p className={cn("font-semibold text-foreground", isMobile ? "text-base" : "text-base sm:text-lg")}>
              {isMobile ? "Tap to select photos" : "Drop wedding photos here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isMobile ? "From gallery or files" : "or tap to browse"}
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-3">JPG, PNG, WEBP • Min 5 photos • Best with 100–500</p>
          </div>

          {/* Camera button on mobile */}
          {isMobile && (
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/50 border border-border/50 active:scale-[0.98] transition-transform"
            >
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">Take a photo</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Add more bar */}
          <div
            className="w-full border-2 border-dashed rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 p-3 border-border hover:border-primary/40 active:bg-muted/30"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); onFilesAdded(e.dataTransfer.files); }}
          >
            <Upload className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Add more photos</span>
          </div>
        </>
      )}

      {/* Photo grid */}
      {files.length > 0 && (
        <div className="w-full mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{files.length} photos</span>
              {!canContinue && <Badge variant="destructive" className="text-[10px]">Need 5+</Badge>}
            </div>
            <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs text-destructive h-8 min-w-[44px]">
              Clear all
            </Button>
          </div>

          <ScrollArea className={cn(isMobile ? "h-36" : "h-32 sm:h-40")}>
            <div className={cn(
              "grid gap-1.5",
              isMobile ? "grid-cols-4" : "grid-cols-5 xs:grid-cols-6 sm:grid-cols-8 md:grid-cols-10"
            )}>
              {files.slice(0, 120).map((f, i) => {
                const key = f.name + f.size;
                const url = thumbnailUrls.get(key);
                return (
                  <div key={key} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    {url && <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveFile(i); }}
                      className={cn(
                        "absolute top-0.5 right-0.5 rounded-full flex items-center justify-center transition-all",
                        isMobile
                          ? "h-6 w-6 bg-black/50 backdrop-blur-sm"
                          : "h-5 w-5 bg-black/0 group-hover:bg-black/50 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                );
              })}
              {files.length > 120 && (
                <div className="aspect-square rounded-lg bg-muted/60 flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground font-medium">+{files.length - 120}</span>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Auto-calculated info */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground bg-muted/30 rounded-xl px-3 py-2.5">
            <span>~{estimatedSpreads} spreads</span>
            <span className="text-border">•</span>
            <span>Auto: {autoSize}" ({sizeSpec.aspectLabel})</span>
            <span className="text-border">•</span>
            <span>{(files.reduce((s, f) => s + f.size, 0) / (1024 * 1024)).toFixed(0)} MB</span>
          </div>
        </div>
      )}

      {/* Continue button */}
      {canContinue && (
        <Button
          size="lg" onClick={onContinue}
          className={cn(
            "mt-5 gap-2 shadow-lg",
            isMobile ? "w-full h-12 text-base rounded-xl" : "w-full sm:w-auto px-8 h-12 text-base"
          )}
        >
          Choose Design <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
