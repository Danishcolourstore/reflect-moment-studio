import clsx from 'clsx';
import type { PresetDefinition } from '../types/mirror';

interface Props {
  presets: PresetDefinition[];
  value: string;
  onChange: (presetId: string) => void;
}

export const PresetSelector = ({ presets, value, onChange }: Props) => {
  return (
    <div className="grid gap-2">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onChange(preset.id)}
          className={clsx(
            'rounded-2xl border p-3 text-left transition',
            value === preset.id
              ? 'border-indigo-300/50 bg-indigo-400/20'
              : 'border-white/10 bg-white/5 hover:bg-white/10',
          )}
        >
          <p className="text-sm font-semibold text-slate-100">{preset.name}</p>
          <p className="mt-1 text-xs text-slate-400">{preset.description}</p>
        </button>
      ))}
    </div>
  );
};
