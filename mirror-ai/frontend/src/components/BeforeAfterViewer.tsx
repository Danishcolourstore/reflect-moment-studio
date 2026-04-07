import { Eye, Layers2 } from "lucide-react";
import type { MirrorImage } from "../types";

type BeforeAfterViewerProps = {
  image: MirrorImage | null;
  showAfter: boolean;
  onToggleAfter: (value: boolean) => void;
};

export function BeforeAfterViewer({ image, showAfter, onToggleAfter }: BeforeAfterViewerProps) {
  const source = showAfter ? image?.previewUrl ?? image?.originalUrl : image?.originalUrl;

  return (
    <section className="glass-panel flex h-full min-h-[420px] flex-col rounded-2xl border border-white/10">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <Layers2 className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold tracking-wide text-zinc-200">Before / After</h2>
        </div>
        <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1 text-xs">
          <button
            type="button"
            onClick={() => onToggleAfter(false)}
            className={`rounded-md px-3 py-1.5 ${
              !showAfter ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Before
          </button>
          <button
            type="button"
            onClick={() => onToggleAfter(true)}
            className={`rounded-md px-3 py-1.5 ${
              showAfter ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            After
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 items-center justify-center p-4">
        {!image || !source ? (
          <div className="flex h-full min-h-[280px] w-full items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-sm text-zinc-500">
            Select a frame to preview
          </div>
        ) : (
          <>
            <img
              src={source}
              alt={image.originalName}
              className="max-h-[62vh] w-full rounded-xl border border-white/10 object-contain"
            />
            <div className="pointer-events-none absolute bottom-7 left-7 rounded-lg border border-white/15 bg-black/45 px-3 py-1.5 text-xs text-zinc-200 backdrop-blur">
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                {showAfter ? "Processed Preview" : "Original"}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
