import { useMemo, useState } from 'react';
import type { ImageRecord, PresetDefinition } from '../types/mirror';
import { api } from '../utils/api';
import { StatusBadge } from './StatusBadge';
import { PresetSelector } from './PresetSelector';

interface Props {
  image: ImageRecord;
  selected: boolean;
  onSelect: (imageId: string, checked: boolean) => void;
  presets: PresetDefinition[];
  onApply: (imageId: string, presetId: string, retouchIntensity: number) => Promise<void>;
}

export const ImageCard = ({ image, selected, onSelect, presets, onApply }: Props) => {
  const [showAfter, setShowAfter] = useState(false);
  const [editing, setEditing] = useState(false);
  const [presetId, setPresetId] = useState(image.presetId);
  const [retouch, setRetouch] = useState(image.retouchIntensity);

  const displayUrl = useMemo(() => {
    if (showAfter && image.status === 'done') {
      return api.imageUrl(image.id, 'preview');
    }

    return api.imageUrl(image.id, 'original');
  }, [image.id, image.status, showAfter]);

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#11141d] shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
      <div className="relative h-56 w-full overflow-hidden bg-black/40">
        <img
          src={displayUrl}
          alt={image.filename}
          className="h-full w-full object-cover"
          loading="lazy"
        />

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <StatusBadge status={image.status} />
        </div>

        <label className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs text-slate-200 backdrop-blur">
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => onSelect(image.id, event.target.checked)}
            className="h-4 w-4 rounded border-white/30 bg-transparent"
          />
          Batch
        </label>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-1 text-sm font-semibold text-slate-100">{image.filename}</h3>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">{image.category}</p>
          </div>

          <button
            type="button"
            onClick={() => setShowAfter((value) => !value)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 transition hover:bg-white/10"
          >
            {showAfter ? 'Before' : 'After'}
          </button>
        </div>

        {image.analysis && (
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-slate-300">
            <div className="rounded-xl border border-white/10 bg-black/30 p-2">
              <p className="text-slate-400">Exposure</p>
              <p className="font-semibold">{Math.round(image.analysis.exposureScore * 100)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-2">
              <p className="text-slate-400">Skin</p>
              <p className="font-semibold">{Math.round(image.analysis.skinToneScore * 100)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-2">
              <p className="text-slate-400">Light</p>
              <p className="font-semibold">{image.analysis.lightingLabel}</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-200 transition hover:bg-white/10"
        >
          {editing ? 'Close controls' : 'Adjust image'}
        </button>

        {editing && (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-3">
            <PresetSelector presets={presets} value={presetId} onChange={setPresetId} />

            <label className="block text-xs text-slate-300">
              Retouch intensity: <span className="font-semibold">{retouch}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={retouch}
                onChange={(event) => setRetouch(Number(event.target.value))}
                className="mt-2 w-full accent-indigo-400"
              />
            </label>

            <button
              type="button"
              onClick={() => onApply(image.id, presetId, retouch)}
              className="w-full rounded-xl bg-indigo-400/90 py-2 text-sm font-semibold text-black transition hover:bg-indigo-300"
            >
              Reprocess
            </button>
          </div>
        )}
      </div>
    </article>
  );
};
