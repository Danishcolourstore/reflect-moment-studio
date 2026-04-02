import type { ControlState, Preset } from "../types/domain";

const categories = ["portrait", "wedding", "event", "studio", "commercial", "fashion"];

interface ControlPanelProps {
  control: ControlState;
  presets: Preset[];
  onChange: (next: Partial<ControlState>) => Promise<void>;
  disabled?: boolean;
}

export function ControlPanel({ control, presets, onChange, disabled }: ControlPanelProps) {
  return (
    <section className="rounded-2xl border border-luxe-700 bg-luxe-850/75 p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-luxe-200">Live Control System</h2>
        <p className="mt-1 text-xs text-luxe-400">Adjust preset logic and retouch intensity in realtime.</p>
      </div>

      <div className="space-y-3">
        <label className="block text-xs text-luxe-300">
          Preset
          <select
            value={control.presetId}
            disabled={disabled}
            onChange={(event) => void onChange({ presetId: event.target.value })}
            className="mt-1 w-full rounded-lg border border-luxe-600 bg-luxe-900 px-3 py-2 text-sm text-luxe-100"
          >
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-luxe-300">
          Shoot Category
          <select
            value={control.category}
            disabled={disabled}
            onChange={(event) => void onChange({ category: event.target.value })}
            className="mt-1 w-full rounded-lg border border-luxe-600 bg-luxe-900 px-3 py-2 text-sm text-luxe-100"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-luxe-300">
          Retouch Intensity ({Math.round(control.retouchIntensity)}%)
          <input
            type="range"
            min={0}
            max={100}
            value={control.retouchIntensity}
            disabled={disabled}
            onChange={(event) => void onChange({ retouchIntensity: Number(event.target.value) })}
            className="mt-2 w-full"
          />
        </label>
      </div>
    </section>
  );
}
