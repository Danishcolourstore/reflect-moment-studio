import { useState } from "react";
import { Layers, Loader2, Sparkles } from "lucide-react";
import {
  MIRROR_PRESET_IDS,
  type MirrorPresetDefinition,
  type MirrorPresetId,
} from "@/lib/mirror-ai/types";

interface BatchApplyPanelProps {
  presets: MirrorPresetDefinition[];
  selectedCount: number;
  pending: boolean;
  onApply: (input: {
    imageIds?: string[];
    preset?: MirrorPresetId;
    retouchIntensity?: number;
    category?: string;
  }) => Promise<unknown>;
  selectedImageIds: string[];
}

export const BatchApplyPanel = ({
  presets,
  selectedCount,
  pending,
  onApply,
  selectedImageIds,
}: BatchApplyPanelProps) => {
  const [preset, setPreset] = useState<MirrorPresetId>("editorial");
  const [retouchIntensity, setRetouchIntensity] = useState(35);
  const [category, setCategory] = useState("");

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 md:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Layers className="h-4 w-4 text-zinc-300" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">
          Batch Apply
        </h2>
      </div>

      <div className="mb-4 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-400">
        {selectedCount > 0
          ? `${selectedCount} image(s) selected`
          : "No selection: applies to latest 100 images"}
      </div>

      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-zinc-400">Preset</span>
          <select
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-white/20"
            value={preset}
            onChange={(event) => {
              const value = event.target.value as MirrorPresetId;
              if (MIRROR_PRESET_IDS.includes(value as (typeof MIRROR_PRESET_IDS)[number])) {
                setPreset(value);
              }
            }}
          >
            {presets.map((item) => (
              <option key={item.id} value={item.id} className="bg-zinc-900 text-zinc-100">
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-zinc-400">
            Retouch <strong className="font-semibold text-zinc-200">{retouchIntensity}%</strong>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={retouchIntensity}
            onChange={(event) => setRetouchIntensity(Number(event.target.value))}
            className="w-full accent-zinc-200"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-zinc-400">
            Category (optional)
          </span>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-white/20"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="wedding, portrait, nightlife..."
          />
        </label>

        <button
          type="button"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-medium text-zinc-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() =>
            onApply({
              imageIds: selectedImageIds.length > 0 ? selectedImageIds : undefined,
              preset,
              retouchIntensity,
              category: category.trim() || undefined,
            })
          }
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Queue batch processing
        </button>
      </div>
    </section>
  );
};
