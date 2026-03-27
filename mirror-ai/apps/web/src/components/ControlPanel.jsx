import { clamp } from "../lib/utils";

export function ControlPanel({
  control,
  presets,
  categories,
  selectedIds,
  onControlChange,
  onBatchApply,
  busy,
}) {
  const selectedCount = selectedIds.length;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Control System</h2>
          <p className="mt-1 text-sm text-zinc-400">Live preset, retouch intensity, and batch reprocessing.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-zinc-400">Preset</span>
          <select
            value={control?.presetId ?? ""}
            onChange={(event) => onControlChange({ presetId: event.target.value })}
            className="rounded-xl border border-white/15 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-sky-500/60"
            disabled={busy}
          >
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-zinc-400">Shoot Category</span>
          <select
            value={control?.category ?? ""}
            onChange={(event) => onControlChange({ category: event.target.value })}
            className="rounded-xl border border-white/15 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-sky-500/60"
            disabled={busy}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
            Retouch
            <span className="text-zinc-200">{Math.round((control?.retouchIntensity ?? 0) * 100)}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={clamp(control?.retouchIntensity ?? 0, 0, 1)}
            onChange={(event) => onControlChange({ retouchIntensity: Number(event.target.value) })}
            className="accent-sky-400"
            disabled={busy}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBatchApply}
          disabled={busy || selectedCount === 0}
          className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-sky-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Apply to Selected ({selectedCount})
        </button>
        <p className="text-sm text-zinc-400">Select images in the live feed to batch reprocess with current controls.</p>
      </div>
    </section>
  );
}
