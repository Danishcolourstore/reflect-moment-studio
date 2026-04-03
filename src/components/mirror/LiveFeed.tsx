import type { ImageRecord } from "@/types/mirror";
import { StatusBadge } from "./StatusBadge";

type LiveFeedProps = {
  images: ImageRecord[];
  selectedId: string | null;
  selectedBatch: string[];
  onSelect: (id: string) => void;
  onBatchToggle: (id: string) => void;
};

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export function LiveFeed({ images, selectedId, selectedBatch, onSelect, onBatchToggle }: LiveFeedProps) {
  return (
    <aside className="panel p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Live Feed</h2>
          <p className="mt-1 text-xs text-slate-500">Incoming frames from FTP and direct upload</p>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">
          realtime
        </span>
      </div>

      <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
        {images.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
            Waiting for incoming FTP images...
          </div>
        ) : (
          images.map((image) => {
            const selected = image.id === selectedId;
            const batched = selectedBatch.includes(image.id);
            return (
              <div
                key={image.id}
                className={`rounded-xl border p-3 transition ${
                  selected ? "border-blue-400/60 bg-blue-500/10" : "border-white/10 bg-black/20 hover:border-white/20"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect(image.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-xs font-medium text-slate-100">{image.fileName}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {image.shootCategory} · {formatTime(image.createdAt)}
                    </p>
                  </button>
                  <StatusBadge status={image.status} />
                </div>
                <button
                  type="button"
                  onClick={() => onBatchToggle(image.id)}
                  className={`rounded-md border px-2 py-1 text-[11px] ${
                    batched
                      ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-200"
                      : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20"
                  }`}
                >
                  {batched ? "Selected" : "Select"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
