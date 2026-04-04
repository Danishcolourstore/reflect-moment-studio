import { useEffect, useState } from "react";
import { Loader2, SlidersHorizontal, Wand2 } from "lucide-react";
import {
  MIRROR_PRESET_IDS,
  type MirrorControls,
  type MirrorPresetDefinition,
  type MirrorPresetId,
} from "@/lib/mirror-ai/types";

interface ControlPanelProps {
  presets: MirrorPresetDefinition[];
  controls?: MirrorControls;
  pending: boolean;
  onSave: (input: {
    defaultPreset?: MirrorPresetId;
    defaultRetouchIntensity?: number;
    defaultCategory?: string;
  }) => Promise<unknown>;
}

export const ControlPanel = ({ presets, controls, pending, onSave }: ControlPanelProps) => {
  const [preset, setPreset] = useState<MirrorPresetId>("editorial");
  const [retouch, setRetouch] = useState(35);
  const [category, setCategory] = useState("portrait");

  useEffect(() => {
    if (controls) {
      setPreset(controls.defaultPreset);
      setRetouch(controls.defaultRetouchIntensity);
      setCategory(controls.defaultCategory);
    }
  }, [controls]);

  useEffect(() => {
    if (!controls && presets.length > 0) {
      setPreset((presets[0]?.id as MirrorPresetId) || "editorial");
    }
  }, [controls, presets]);

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 md:p-5">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-zinc-300" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Live Controls</h2>
      </div>

      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-zinc-400">Default preset</span>
          <select
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-zinc-100 outline-none ring-0 focus:border-white/20"
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
            Retouch intensity <strong className="font-semibold text-zinc-200">{retouch}%</strong>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={retouch}
            onChange={(event) => setRetouch(Number(event.target.value))}
            className="w-full accent-zinc-200"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-zinc-400">Shoot category</span>
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-white/20"
            placeholder="portrait, wedding, sport, editorials..."
          />
        </label>

        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-medium text-zinc-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          onClick={() =>
            onSave({
              defaultPreset: preset,
              defaultRetouchIntensity: retouch,
              defaultCategory: category.trim() || undefined,
            })
          }
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          Save live defaults
        </button>
      </div>
    </section>
  );
};
