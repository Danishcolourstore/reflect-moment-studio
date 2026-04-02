import { useState } from "react";
import type { Preset } from "../types/domain";

interface BatchPanelProps {
  selectedCount: number;
  presets: Preset[];
  onApply: (payload: { presetId?: string; category?: string; retouchIntensity?: number }) => Promise<void>;
  disabled?: boolean;
}

export function BatchPanel({ selectedCount, presets, onApply, disabled }: BatchPanelProps) {
  const [presetId, setPresetId] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [retouchIntensity, setRetouchIntensity] = useState<number>(35);

  return (
    <section className="rounded-2xl border border-luxe-700 bg-luxe-850/75 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-luxe-200">Batch Apply Edits</h2>
      <p className="mt-1 text-xs text-luxe-400">Selected: {selectedCount}</p>

      <div className="mt-3 space-y-3">
        <label className="block text-xs text-luxe-300">
          Preset (optional)
          <select
            value={presetId}
            disabled={disabled}
            onChange={(event) => setPresetId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-luxe-600 bg-luxe-900 px-3 py-2 text-sm text-luxe-100"
          >
            <option value="">Keep existing</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-luxe-300">
          Category (optional)
          <input
            type="text"
            value={category}
            disabled={disabled}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="e.g. wedding"
            className="mt-1 w-full rounded-lg border border-luxe-600 bg-luxe-900 px-3 py-2 text-sm text-luxe-100"
          />
        </label>

        <label className="block text-xs text-luxe-300">
          Retouch ({Math.round(retouchIntensity)}%)
          <input
            type="range"
            min={0}
            max={100}
            value={retouchIntensity}
            disabled={disabled}
            onChange={(event) => setRetouchIntensity(Number(event.target.value))}
            className="mt-2 w-full"
          />
        </label>

        <button
          onClick={() => void onApply({ presetId: presetId || undefined, category: category || undefined, retouchIntensity })}
          disabled={disabled || selectedCount === 0}
          className="w-full rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-luxe-950 transition hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Apply to Selected
        </button>
      </div>
    </section>
  );
}
