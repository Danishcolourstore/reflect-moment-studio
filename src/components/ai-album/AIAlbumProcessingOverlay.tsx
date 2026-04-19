import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles } from "lucide-react";

interface Props {
  progress: number;
  label: string;
}

export default function AIAlbumProcessingOverlay({ progress, label }: Props) {
  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-xs sm:max-w-sm text-center space-y-5 px-4">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto">
          <div className="absolute inset-0 rounded-2xl bg-primary/10 skeleton-block" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          </div>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-serif font-bold text-foreground">
            Building Your Album
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</p>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-2 sm:h-2.5" />
          <p className="text-[10px] sm:text-xs text-muted-foreground/60 font-mono">{progress}%</p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>AI is analyzing & arranging…</span>
        </div>
      </div>
    </div>
  );
}
