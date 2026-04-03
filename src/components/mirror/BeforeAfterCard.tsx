import { useState } from "react";
import type { ImageRecord } from "@/types/mirror";
import { StatusBadge } from "./StatusBadge";

type Props = {
  image: ImageRecord | null;
};

export function BeforeAfterCard({ image }: Props) {
  const [showAfter, setShowAfter] = useState(true);

  if (!image) {
    return (
      <section className="panel p-5">
        <h3 className="text-lg font-semibold text-slate-100">Before / After</h3>
        <p className="mt-3 text-sm text-slate-400">Select an image from the feed to preview edits.</p>
      </section>
    );
  }

  const hasAfter = Boolean(image.previewUrl);
  const source = showAfter && hasAfter ? image.previewUrl! : image.originalUrl;
  const label = showAfter && hasAfter ? "After" : "Before";

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-slate-100">Before / After</h3>
          <p className="truncate text-xs text-slate-400">{image.fileName}</p>
        </div>
        <StatusBadge status={image.status} />
      </div>

      <div className="mb-3 inline-flex rounded-lg border border-white/10 bg-slate-900/70 p-1">
        <button
          type="button"
          onClick={() => setShowAfter(false)}
          className={`rounded-md px-3 py-1.5 text-xs transition ${!showAfter ? "bg-slate-700 text-white" : "text-slate-300"}`}
        >
          Before
        </button>
        <button
          type="button"
          onClick={() => setShowAfter(true)}
          className={`rounded-md px-3 py-1.5 text-xs transition ${showAfter ? "bg-slate-700 text-white" : "text-slate-300"}`}
        >
          After
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
        <img src={source} alt={`${image.fileName} ${label}`} className="h-[420px] w-full object-contain bg-slate-950" />
      </div>
      <p className="mt-2 text-xs text-slate-400">{label} · {image.shootCategory}</p>
    </section>
  );
}
