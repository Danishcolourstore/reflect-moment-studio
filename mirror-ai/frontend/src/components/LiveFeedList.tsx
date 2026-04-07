import { Clock3, ImageIcon } from "lucide-react";
import type { MirrorImage } from "../types";
import { StatusBadge } from "./StatusBadge";

type LiveFeedListProps = {
  images: MirrorImage[];
  selectedImageId: string | null;
  onSelectImage: (imageId: string) => void;
};

const relativeTimestamp = (isoDate: string) => {
  const ms = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.max(1, Math.floor(ms / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export function LiveFeedList({ images, selectedImageId, onSelectImage }: LiveFeedListProps) {
  return (
    <section className="glass-panel h-full overflow-hidden rounded-2xl border border-white/10">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold tracking-wide text-zinc-200">Live Feed</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
          {images.length}
        </span>
      </header>

      <div className="h-[min(72vh,640px)] overflow-y-auto p-3">
        {images.length === 0 ? (
          <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-zinc-500">
            Waiting for incoming FTP images...
          </div>
        ) : (
          <ul className="space-y-2">
            {images.map((image) => {
              const isSelected = image.id === selectedImageId;
              return (
                <li key={image.id}>
                  <button
                    type="button"
                    onClick={() => onSelectImage(image.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      isSelected
                        ? "border-indigo-300/45 bg-indigo-500/15"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-medium text-zinc-100">{image.originalName}</p>
                      <StatusBadge status={image.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="uppercase tracking-wide">{image.categoryId}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {relativeTimestamp(image.createdAt)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
