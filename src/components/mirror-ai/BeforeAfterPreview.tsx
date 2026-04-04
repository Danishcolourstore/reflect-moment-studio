import { useState } from "react";

interface BeforeAfterPreviewProps {
  beforeUrl?: string;
  afterUrl?: string;
  alt: string;
}

export const BeforeAfterPreview = ({ beforeUrl, afterUrl, alt }: BeforeAfterPreviewProps) => {
  const [showAfter, setShowAfter] = useState(true);
  const active = showAfter ? afterUrl || beforeUrl : beforeUrl || afterUrl;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
      <div className="flex items-center justify-between border-b border-white/10 p-3">
        <div className="text-xs uppercase tracking-[0.22em] text-zinc-400">Before / After</div>
        <button
          type="button"
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-200 hover:bg-white/10"
          onClick={() => setShowAfter((value) => !value)}
        >
          {showAfter ? "Viewing: After" : "Viewing: Before"}
        </button>
      </div>

      <div className="aspect-[3/2] w-full">
        {active ? (
          <img src={active} alt={alt} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">No image preview yet</div>
        )}
      </div>
    </div>
  );
};
