import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { ControlDefaults, ImageRecord, PresetDefinition } from '../types/mirror';
import { PresetSelector } from './PresetSelector';

interface Props {
  defaults: ControlDefaults;
  presets: PresetDefinition[];
  selectedImageIds: string[];
  images: ImageRecord[];
  onUpdateDefaults: (payload: Partial<ControlDefaults>) => Promise<void>;
  onBatchApply: (payload: { ids: string[]; presetId?: string; retouchIntensity?: number }) => Promise<void>;
}

export const ControlPanel = ({
  defaults,
  presets,
  selectedImageIds,
  images,
  onUpdateDefaults,
  onBatchApply,
}: Props) => {
  const [defaultPreset, setDefaultPreset] = useState(defaults.presetId);
  const [defaultRetouch, setDefaultRetouch] = useState(defaults.retouchIntensity);
  const [batchPreset, setBatchPreset] = useState(defaults.presetId);
  const [batchRetouch, setBatchRetouch] = useState(defaults.retouchIntensity);

  const selectedCount = selectedImageIds.length;
  const doneCount = useMemo(() => images.filter((item) => item.status === 'done').length, [images]);

  const submitDefaults = async (event: FormEvent) => {
    event.preventDefault();
    await onUpdateDefaults({
      presetId: defaultPreset,
      retouchIntensity: defaultRetouch,
    });
  };

  const submitBatch = async (event: FormEvent) => {
    event.preventDefault();
    if (selectedImageIds.length === 0) return;

    await onBatchApply({
      ids: selectedImageIds,
      presetId: batchPreset,
      retouchIntensity: batchRetouch,
    });
  };

  return (
    <aside className="space-y-5 rounded-3xl border border-white/10 bg-[#11141d] p-5 shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
      <section>
        <p className="text-xs uppercase tracking-[0.15em] text-slate-400">System status</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
            <p className="text-2xl font-semibold text-slate-100">{images.length}</p>
            <p className="text-xs text-slate-400">Incoming</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
            <p className="text-2xl font-semibold text-slate-100">{doneCount}</p>
            <p className="text-xs text-slate-400">Processed</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Live Defaults</h2>
        <p className="mt-1 text-xs text-slate-400">Applied automatically to incoming FTP frames.</p>

        <form className="mt-4 space-y-3" onSubmit={submitDefaults}>
          <PresetSelector presets={presets} value={defaultPreset} onChange={setDefaultPreset} />

          <label className="block text-xs text-slate-300">
            Retouch intensity: <span className="font-semibold">{defaultRetouch}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={defaultRetouch}
              onChange={(event) => setDefaultRetouch(Number(event.target.value))}
              className="mt-2 w-full accent-indigo-400"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-400/90 py-2 text-sm font-semibold text-black transition hover:bg-indigo-300"
          >
            Update defaults
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Batch apply</h2>
        <p className="mt-1 text-xs text-slate-400">
          Selected images: <span className="font-semibold text-slate-200">{selectedCount}</span>
        </p>

        <form className="mt-4 space-y-3" onSubmit={submitBatch}>
          <PresetSelector presets={presets} value={batchPreset} onChange={setBatchPreset} />

          <label className="block text-xs text-slate-300">
            Retouch intensity: <span className="font-semibold">{batchRetouch}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={batchRetouch}
              onChange={(event) => setBatchRetouch(Number(event.target.value))}
              className="mt-2 w-full accent-indigo-400"
            />
          </label>

          <button
            type="submit"
            disabled={selectedImageIds.length === 0}
            className="w-full rounded-xl bg-fuchsia-400/90 py-2 text-sm font-semibold text-black transition hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply to selected
          </button>
        </form>
      </section>
    </aside>
  );
};
