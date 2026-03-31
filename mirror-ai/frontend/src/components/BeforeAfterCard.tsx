import { useMemo, useState } from "react";
import type { ImageRecord } from "../types";

interface Props {
  image: ImageRecord;
}

export function BeforeAfterCard({ image }: Props) {
  const [showAfter, setShowAfter] = useState(true);

  const before = useMemo(() => image.originalUrl, [image.originalUrl]);
  const after = useMemo(() => image.previewUrl ?? image.processedUrl, [image.previewUrl, image.processedUrl]);

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <p className="truncate text-sm font-medium text-zinc-200">{image.filename}</p>
        <button
          type="button"
          onClick={() => setShowAfter((x) => !x)}
          className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-500"
        >
          {showAfter ? "Showing: After" : "Showing: Before"}
        </button>
      </div>
      <div className="aspect-[4/3] bg-zinc-950">
        {showAfter ? (
          after ? (
            <img src={after} alt="processed" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">Processing preview...</div>
          )
        ) : before ? (
          <img src={before} alt="original" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">Original unavailable</div>
        )}
      </div>
    </div>
  );
}
