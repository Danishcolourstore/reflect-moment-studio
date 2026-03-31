import type { Preset, PresetKey } from "../types";

interface Props {
  presets: Preset[];
  value: PresetKey;
  onChange: (next: PresetKey) => void;
}

export function PresetSelector({ presets, value, onChange }: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {presets.map((preset) => {
        const active = value === preset.key;
        return (
          <button
            key={preset.key}
            type="button"
            onClick={() => onChange(preset.key)}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              active
                ? "border-accent-500 bg-accent-500/15 text-white"
                : "border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            <p className="font-semibold">{preset.name}</p>
            <p className="mt-1 text-xs text-zinc-400">{preset.description}</p>
          </button>
        );
      })}
    </div>
  );
}
