import { StatusBadge } from "./StatusBadge";
import { prettyDate } from "../lib/utils";

function analysisLine(analysis) {
  if (!analysis) {
    return "Awaiting analysis";
  }
  return `Exp ${Math.round(analysis.exposure * 100)}% • Skin ${Math.round(analysis.skinToneBalance * 100)}% • Light ${Math.round(analysis.lighting * 100)}%`;
}

export function ImageCard({
  image,
  selected,
  onSelect,
  onReprocess,
  showAfter,
  actionBusy,
}) {
  const source = showAfter ? image?.urls?.preview || image?.urls?.processedFull : image?.urls?.original;

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-zinc-950/40 transition ${
        selected ? "border-sky-500/70 ring-1 ring-sky-500/60" : "border-white/10"
      }`}
    >
      <div className="relative aspect-[4/3] bg-zinc-900/80">
        {source ? (
          <img src={source} alt={image.originalName} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">No preview yet</div>
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge status={image.status} />
        </div>
      </div>
      <div className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-100">{image.originalName}</p>
            <p className="mt-1 text-xs text-zinc-400">{analysisLine(image.analysis)}</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
            <input type="checkbox" checked={selected} onChange={() => onSelect(image.id)} />
            Batch
          </label>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{image.category || "uncategorized"}</span>
          <span>{prettyDate(image.updatedAt)}</span>
        </div>

        <button
          type="button"
          onClick={() => onReprocess(image.id)}
          disabled={actionBusy}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 transition hover:border-sky-500/50 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reprocess
        </button>
      </div>
    </article>
  );
}
