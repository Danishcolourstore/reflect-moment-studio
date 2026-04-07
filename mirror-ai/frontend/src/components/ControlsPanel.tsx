import { SlidersHorizontal, WandSparkles } from "lucide-react";
import type { Category, Controls, MirrorImage, Preset } from "../types";

type ControlsPanelProps = {
  controls: Controls | null;
  presets: Preset[];
  categories: Category[];
  selectedCategory: string;
  batchCategoryId: string;
  selectedIds: Set<string>;
  images: MirrorImage[];
  onCategoryChange: (categoryId: string) => void;
  onPresetChange: (presetId: string) => void;
  onRetouchChange: (value: number) => void;
  onBatchCategoryChange: (categoryId: string) => void;
  onToggleSelect: (imageId: string, selected: boolean) => void;
  onBatchMoveCategory: () => void;
  onBatchApply: () => void;
};

export function ControlsPanel({
  controls,
  presets,
  categories,
  selectedCategory,
  batchCategoryId,
  selectedIds,
  images,
  onCategoryChange,
  onPresetChange,
  onRetouchChange,
  onBatchCategoryChange,
  onToggleSelect,
  onBatchMoveCategory,
  onBatchApply,
}: ControlsPanelProps) {
  return (
    <section className="glass-panel h-full rounded-2xl border border-white/10">
      <header className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-semibold tracking-wide text-zinc-200">Control System</h2>
      </header>

      <div className="space-y-5 p-5">
        <div className="space-y-2">
          <label htmlFor="category" className="text-xs uppercase tracking-wide text-zinc-400">
            Shoot Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-indigo-300/45"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="preset" className="text-xs uppercase tracking-wide text-zinc-400">
            Active Preset
          </label>
          <select
            id="preset"
            value={controls?.activePresetId ?? ""}
            onChange={(event) => onPresetChange(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-indigo-300/45"
          >
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
            <label htmlFor="retouch">Retouch Intensity</label>
            <span>{Math.round((controls?.retouchIntensity ?? 0) * 100)}%</span>
          </div>
          <input
            id="retouch"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={controls?.retouchIntensity ?? 0}
            onChange={(event) => onRetouchChange(Number(event.target.value))}
            className="w-full accent-indigo-300"
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wide text-zinc-400">Batch Apply</h3>
            <span className="text-xs text-zinc-500">{selectedIds.size} selected</span>
          </div>
          <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {images.length === 0 ? (
              <p className="text-xs text-zinc-500">No images in current filter.</p>
            ) : (
              images.map((image) => (
                <label
                  key={image.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5 text-xs text-zinc-300 hover:border-white/20"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(image.id)}
                    onChange={(event) => onToggleSelect(image.id, event.target.checked)}
                    className="accent-indigo-300"
                  />
                  <span className="line-clamp-1">{image.originalName}</span>
                </label>
              ))
            )}
          </div>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={onBatchApply}
              disabled={selectedIds.size === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-300/35 bg-indigo-500/20 px-3 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <WandSparkles className="h-4 w-4" />
              Batch Apply
            </button>
            <div className="flex gap-2">
              <select
                value={batchCategoryId}
                onChange={(event) => onBatchCategoryChange(event.target.value)}
                disabled={categories.length === 0}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-100 outline-none transition focus:border-indigo-300/45"
              >
                {categories.length === 0 ? (
                  <option value="">No categories</option>
                ) : (
                  categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={onBatchMoveCategory}
                disabled={selectedIds.size === 0 || categories.length === 0}
                className="rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
