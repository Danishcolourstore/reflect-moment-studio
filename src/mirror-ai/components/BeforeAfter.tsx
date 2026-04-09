import { useMemo, useState } from "react";
import type { MirrorImage } from "../types";
import { absoluteAssetUrl } from "../utils";

interface BeforeAfterProps {
  image?: MirrorImage;
}

export function BeforeAfter({ image }: BeforeAfterProps) {
  const [showAfter, setShowAfter] = useState(true);

  const displayUrl = useMemo(() => {
    if (!image) {
      return null;
    }
    if (!showAfter) {
      return absoluteAssetUrl(image.originalUrl);
    }
    return absoluteAssetUrl(image.previewUrl ?? image.processedUrl ?? image.originalUrl);
  }, [image, showAfter]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-zinc-200">Before / After</h3>
        <div className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900 p-1">
          <button
            className={`rounded-md px-3 py-1 text-xs ${!showAfter ? "bg-zinc-100 text-zinc-900" : "text-zinc-300"}`}
            onClick={() => setShowAfter(false)}
            type="button"
          >
            Before
          </button>
          <button
            className={`rounded-md px-3 py-1 text-xs ${showAfter ? "bg-zinc-100 text-zinc-900" : "text-zinc-300"}`}
            onClick={() => setShowAfter(true)}
            type="button"
          >
            After
          </button>
        </div>
      </div>

      <div className="aspect-[4/3] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        {displayUrl ? (
          <img alt={image?.filename ?? "Mirror image"} className="h-full w-full object-cover" src={displayUrl} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">Select an image from Live Feed</div>
        )}
      </div>
    </div>
  );
}
