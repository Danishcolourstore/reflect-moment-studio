import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Upload, X, ImageIcon, Sparkles, ArrowRight, Camera } from "lucide-react";
import { INDIAN_ALBUM_SIZES, type IndianAlbumSize } from "../ai-album-types";

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
  const [isDragging, setIsDragging] = useState(false);
  const canContinue = files.length >= 5;
  const sizeSpec = INDIAN_ALBUM_SIZES[autoSize];

  return (
    <div className="flex flex-col items-center px-3 sm:px-4 py-6 sm:py-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium mb-3">
          <Sparkles className="h-3.5 w-3.5" /> AI Album Builder
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-foreground">
          Import Your Photos
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Just upload your wedding photos. AI will handle everything — sizing, layout, arrangement, storytelling.
        </p>
      </div>

      {/* Upload zone */}
      <input
        ref={fileInputRef} type="file"
        accept="image/jpeg,image/png,image/webp,image/heic" multiple className="hidden"
        onChange={(e) => { onFilesAdded(e.target.files); if (e.target) e.target.value = ""; }}
      />

      <div
        className={cn(
          "w-full border-2 border-dashed rounded-2xl cursor-pointer transition-all",
          "flex flex-col items-center justify-center text-center",
          files.length === 0 ? "p-10 sm:p-16" : "p-5 sm:p-8",
          isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/40 hover:bg-muted/20"
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); onFilesAdded(e.dataTransfer.files); }}
      >
        {files.length === 0 ? (
          <>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Camera className="h-7 w-7 sm:h-9 sm:w-9 text-primary" />
            </div>
            <p className="text-base sm:text-lg font-semibold text-foreground">Drop wedding photos here</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">or tap to browse</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground/60 mt-3">JPG, PNG, WEBP • Min 5 photos • Best with 100–500</p>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Add more photos</span>
          </div>
        )}
      </div>

      {/* Photo grid */}
      {files.length > 0 && (
        <div className="w-full mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{files.length} photos</span>
              {!canContinue && <Badge variant="destructive" className="text-[10px]">Need 5+</Badge>}
            </div>
            <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs text-destructive h-7">
              Clear all
            </Button>
          </div>

          <ScrollArea className="h-32 sm:h-40">
            <div className="grid grid-cols-5 xs:grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1">
              {files.slice(0, 120).map((f, i) => {
                const key = f.name + f.size;
                const url = thumbnailUrls.get(key);
                return (
                  <div key={key} className="relative group aspect-square rounded-md overflow-hidden bg-muted">
                    {url && <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveFile(i); }}
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/40 active:bg-black/40 transition-colors flex items-center justify-center"
                    >
                      <X className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                );
              })}
              {files.length > 120 && (
                <div className="aspect-square rounded-md bg-muted/60 flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground font-medium">+{files.length - 120}</span>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Auto-calculated info */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
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
        <Button size="lg" onClick={onContinue} className="mt-6 gap-2 w-full sm:w-auto px-8 h-12 text-base shadow-lg">
          Choose Design <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
