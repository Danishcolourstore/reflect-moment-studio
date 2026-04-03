import type { ProcessingPreset } from "@/types/mirror";

type Props = {
  presets: ProcessingPreset[];
  activePresetId: string;
  onSelect: (presetId: string) => void | Promise<void>;
  activeDescription?: string;
};

export function PresetSelector({ presets, activePresetId, onSelect, activeDescription }: Props) {
  return (
    <section className="panel p-4">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Preset selector</h2>
        {activeDescription ? <p className="muted-text mt-1">{activeDescription}</p> : null}
      </div>
      <div className="space-y-2">
        {presets.map((preset) => {
          const active = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset.id)}
              className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                active
                  ? "border-cyan-300/50 bg-cyan-500/15"
                  : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{preset.name}</p>
                {active ? (
                  <span className="rounded-full border border-cyan-300/40 bg-cyan-400/20 px-2 py-0.5 text-xs text-cyan-100">
                    Active
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-300">{preset.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
