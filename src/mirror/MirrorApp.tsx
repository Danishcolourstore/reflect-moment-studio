import { useState } from "react";
import { CheckCircle2, Clock3, ImageIcon, Layers, SlidersHorizontal, Sparkles, Wand2 } from "lucide-react";
import { useMirrorRealtime } from "./useMirrorRealtime";
import type { ImageRecord, Preset, ShootCategory } from "./types";
import { mirrorApi } from "./api";
import { cn, formatRelativeTime, resolveAssetUrl } from "./utils";

const categories: ShootCategory[] = ["wedding", "portrait", "fashion", "commercial", "event"];

const statusStyles: Record<ImageRecord["status"], string> = {
  queued: "bg-zinc-700/80 text-zinc-100",
  processing: "bg-amber-500/20 text-amber-200 border border-amber-400/30",
  done: "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30",
  error: "bg-rose-500/20 text-rose-200 border border-rose-400/30",
};

const statusIcon = (status: ImageRecord["status"]) => {
  if (status === "done") return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === "processing") return <Clock3 className="h-3.5 w-3.5 animate-pulse" />;
  if (status === "queued") return <Layers className="h-3.5 w-3.5" />;
  return <ImageIcon className="h-3.5 w-3.5" />;
};

function PresetSelector({
  presets,
  selectedPresetId,
  onSelect,
}: {
  presets: Preset[];
  selectedPresetId: string;
  onSelect: (presetId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {presets.map((preset) => (
        <button
          key={preset.id}
          className={cn(
            "rounded-lg border px-3 py-2 text-left transition",
            selectedPresetId === preset.id
              ? "border-indigo-400/60 bg-indigo-500/15"
              : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
          )}
          onClick={() => onSelect(preset.id)}
        >
          <div className="text-sm font-medium text-zinc-100">{preset.name}</div>
          <div className="text-xs text-zinc-400">{preset.description}</div>
        </button>
      ))}
    </div>
  );
}

function ImageCard({
  image,
  selected,
  onSelect,
  showAfter,
  onReprocess,
}: {
  image: ImageRecord;
  selected: boolean;
  onSelect: (id: string) => void;
  showAfter: boolean;
  onReprocess: (id: string) => void;
}) {
  const previewSrc =
    showAfter && image.previewPath ? resolveAssetUrl(image.previewPath) : resolveAssetUrl(image.originalPath);

  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80">
      <div className="relative aspect-[4/3] bg-zinc-950">
        {previewSrc ? (
          <img src={previewSrc} alt={image.fileName} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
        <button
          className={cn(
            "absolute left-3 top-3 h-5 w-5 rounded border",
            selected ? "border-indigo-300 bg-indigo-400" : "border-white/40 bg-black/40",
          )}
          onClick={() => onSelect(image.id)}
          aria-label="Select image"
        />
      </div>
      <div className="space-y-2 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-sm font-medium text-zinc-100">{image.fileName}</div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              statusStyles[image.status],
            )}
          >
            {statusIcon(image.status)}
            {image.status}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{image.category}</span>
          <span>{formatRelativeTime(image.updatedAt)}</span>
        </div>
        <button
          className="w-full rounded-md border border-white/15 bg-white/[0.04] px-2 py-1.5 text-xs text-zinc-200 transition hover:bg-white/[0.08]"
          onClick={() => onReprocess(image.id)}
        >
          Reprocess
        </button>
      </div>
    </article>
  );
}

export function MirrorApp() {
  const { snapshot, setSnapshot, connected, loading, error } = useMirrorRealtime();
  const [showAfter, setShowAfter] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const selectedPreset = snapshot.presets.find((preset) => preset.id === snapshot.settings.activePresetId);
  const selectImage = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handlePresetChange = async (presetId: string) => {
    setBusy(true);
    try {
      const settings = await mirrorApi.updateSettings({ activePresetId: presetId });
      setSnapshot((current) => ({ ...current, settings }));
    } finally {
      setBusy(false);
    }
  };

  const handleCategoryChange = async (category: ShootCategory) => {
    setBusy(true);
    try {
      const settings = await mirrorApi.updateSettings({ activeCategory: category });
      setSnapshot((current) => ({ ...current, settings }));
    } finally {
      setBusy(false);
    }
  };

  const handleRetouchChange = async (value: number) => {
    setBusy(true);
    try {
      const settings = await mirrorApi.updateSettings({ retouchIntensity: value });
      setSnapshot((current) => ({ ...current, settings }));
    } finally {
      setBusy(false);
    }
  };

  const handleReprocess = async (imageId: string) => {
    await mirrorApi.reprocessImage(imageId, {
      presetId: snapshot.settings.activePresetId,
      retouchIntensity: snapshot.settings.retouchIntensity,
    });
  };

  const handleBatchApply = async () => {
    if (!selectedIds.length) return;
    setBusy(true);
    try {
      await mirrorApi.reprocessBatch({
        imageIds: selectedIds,
        presetId: snapshot.settings.activePresetId,
        retouchIntensity: snapshot.settings.retouchIntensity,
      });
      setSelectedIds([]);
    } finally {
      setBusy(false);
    }
  };

  const doneCount = snapshot.images.filter((image) => image.status === "done").length;
  const processingCount = snapshot.images.filter((image) => image.status === "processing").length;
  const queuedCount = snapshot.images.filter((image) => image.status === "queued").length;

  return (
    <main className="min-h-screen bg-[#07080c] text-zinc-100">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[330px_1fr] lg:px-6">
        <aside className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/70 p-4 backdrop-blur">
          <header className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.3em] text-zinc-400">Mirror AI</div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px]",
                  connected ? "bg-emerald-500/20 text-emerald-200" : "bg-zinc-700 text-zinc-200",
                )}
              >
                {connected ? "Live" : "Offline"}
              </span>
            </div>
            <h1 className="font-sans text-2xl font-semibold tracking-tight text-white">Real-time photo studio</h1>
            <p className="text-xs text-zinc-400">
              FTP ingest, AI processing, instant previews, and batch control in one premium cockpit.
            </p>
          </header>

          <section className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <div className="text-lg font-semibold text-white">{snapshot.images.length}</div>
              <div className="text-zinc-400">Total</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <div className="text-lg font-semibold text-amber-200">{processingCount + queuedCount}</div>
              <div className="text-zinc-400">Active</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <div className="text-lg font-semibold text-emerald-200">{doneCount}</div>
              <div className="text-zinc-400">Done</div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
              <Sparkles className="h-3.5 w-3.5" />
              Preset selector
            </div>
            <PresetSelector
              presets={snapshot.presets}
              selectedPresetId={snapshot.settings.activePresetId}
              onSelect={handlePresetChange}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Control system
            </div>

            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Retouch intensity</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={snapshot.settings.retouchIntensity}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setSnapshot((current) => ({
                    ...current,
                    settings: { ...current.settings, retouchIntensity: value },
                  }));
                }}
                onMouseUp={(event) => handleRetouchChange(Number((event.target as HTMLInputElement).value))}
                onTouchEnd={(event) => handleRetouchChange(Number((event.target as HTMLInputElement).value))}
                className="w-full accent-indigo-400"
              />
              <div className="text-xs text-zinc-300">{Math.round(snapshot.settings.retouchIntensity * 100)}%</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Shoot category</label>
              <select
                value={snapshot.settings.activeCategory}
                onChange={(event) => handleCategoryChange(event.target.value as ShootCategory)}
                className="w-full rounded-md border border-white/15 bg-zinc-950 px-2 py-2 text-sm outline-none"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleBatchApply}
              disabled={!selectedIds.length || busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Wand2 className="h-4 w-4" />
              Batch apply to {selectedIds.length || 0} selected
            </button>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-zinc-400">
            <div>Current preset: {selectedPreset?.name ?? "—"}</div>
            <div>Queue mode: no-refresh realtime WebSocket</div>
            <div>API status: {error ? "degraded" : "healthy"}</div>
          </section>
        </aside>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-zinc-900/70 px-4 py-3 backdrop-blur">
            <div>
              <h2 className="font-sans text-xl font-semibold text-white">Live Feed</h2>
              <p className="text-xs text-zinc-400">Incoming captures with instant before/after review</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs transition",
                  !showAfter ? "bg-zinc-100 text-zinc-900" : "bg-white/[0.05] text-zinc-200",
                )}
                onClick={() => setShowAfter(false)}
              >
                Before
              </button>
              <button
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs transition",
                  showAfter ? "bg-zinc-100 text-zinc-900" : "bg-white/[0.05] text-zinc-200",
                )}
                onClick={() => setShowAfter(true)}
              >
                After
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-6 text-center text-zinc-400">
              Loading mirror feed...
            </div>
          ) : snapshot.images.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 bg-zinc-900/60 p-8 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06]">
                <ImageIcon className="h-5 w-5 text-zinc-300" />
              </div>
              <p className="text-sm text-zinc-300">No uploads yet</p>
              <p className="text-xs text-zinc-500">Drop images into FTP to start real-time processing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {snapshot.images.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  selected={selectedIds.includes(image.id)}
                  onSelect={selectImage}
                  showAfter={showAfter}
                  onReprocess={handleReprocess}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
