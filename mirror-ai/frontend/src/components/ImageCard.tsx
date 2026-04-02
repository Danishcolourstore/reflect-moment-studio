import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { ImageItem } from "../types/domain";
import { StatusBadge } from "./StatusBadge";

interface ImageCardProps {
  image: ImageItem;
  selected: boolean;
  onToggleSelect: (imageId: string) => void;
  onReprocess: (imageId: string) => void;
}

export function ImageCard({ image, selected, onToggleSelect, onReprocess }: ImageCardProps) {
  const [showAfter, setShowAfter] = useState(true);

  const bestAfter = useMemo(() => image.previewUrl ?? image.processedUrl ?? image.originalUrl, [image]);
  const displayUrl = showAfter ? bestAfter : image.originalUrl;

  return (
    <article className="rounded-2xl border border-luxe-700 bg-luxe-850/80 p-3 shadow-glow">
      <div className="mb-2 flex items-center justify-between gap-2">
        <StatusBadge status={image.status} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAfter((value) => !value)}
            className="rounded-lg border border-luxe-600 px-2 py-1 text-xs text-luxe-300 hover:bg-luxe-700"
          >
            {showAfter ? "After" : "Before"}
          </button>
          <button
            onClick={() => onReprocess(image.id)}
            className="rounded-lg border border-accent-400/60 p-1 text-accent-300 hover:bg-accent-500/10"
            title="Reprocess"
          >
            <RefreshCw size={14} />
          </button>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(image.id)}
            className="h-4 w-4 rounded border-luxe-500 bg-luxe-700"
            title="Select for batch"
          />
        </div>
      </div>

      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-luxe-900">
        <img src={displayUrl} alt={image.filename} className="h-full w-full object-cover" loading="lazy" />
      </div>

      <div className="mt-3 space-y-1 text-xs text-luxe-300">
        <p className="truncate font-medium text-luxe-100">{image.filename}</p>
        <p>
          Category: <span className="text-luxe-200">{image.category}</span>
        </p>
        <p>
          Preset: <span className="text-luxe-200">{image.presetId}</span>
        </p>
        <p>
          Retouch: <span className="text-luxe-200">{Math.round(image.retouchIntensity)}%</span>
        </p>
      </div>
    </article>
  );
}
