import { SlidersHorizontal, Wand2 } from "lucide-react";
import type { QueueStats, RuntimeSettings, ShootCategory } from "@/types/mirror";

interface Props {
  settings: RuntimeSettings;
  queue: QueueStats;
  categories: ShootCategory[];
  selectedBatchCount: number;
  onRetouchChange: (value: number) => Promise<void>;
  onCategoryChange: (category: ShootCategory) => Promise<void>;
  onBatchApply: () => Promise<void>;
}

export function ControlPanel({
  settings,
  queue,
  categories,
  selectedBatchCount,
  onRetouchChange,
  onCategoryChange,
  onBatchApply,
}: Props) {
  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <SlidersHorizontal className="h-5 w-5 text-violet-300" />
        Control System
      </h2>

      <div className="mt-4 space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Retouch intensity</p>
            <span className="text-xs text-violet-200">{Math.round(settings.retouchIntensity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(settings.retouchIntensity * 100)}
            onChange={(event) => {
              void onRetouchChange(Number(event.target.value) / 100);
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-violet-400"
          />
          <p className="mt-2 text-xs text-slate-400">
            Natural retouch only. Designed to preserve skin texture and avoid over-smoothing.
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Shoot category</p>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => {
              const active = settings.category === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    void onCategoryChange(category);
                  }}
                  className={`rounded-lg border px-3 py-2 text-left text-xs capitalize transition ${
                    active
                      ? "border-violet-400/70 bg-violet-500/20 text-violet-100"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Queue health</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-200">
            <p>Waiting: {queue.waiting}</p>
            <p>Active: {queue.active}</p>
            <p>Done: {queue.completed}</p>
            <p>Failed: {queue.failed}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            void onBatchApply();
          }}
          disabled={selectedBatchCount === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-400/50 bg-violet-500/20 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Wand2 className="h-4 w-4" />
          Batch apply ({selectedBatchCount})
        </button>
      </div>
    </section>
}
