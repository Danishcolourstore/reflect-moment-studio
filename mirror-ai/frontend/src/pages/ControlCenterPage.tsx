import type { ControlDefaults, ImageRecord, PresetDefinition } from '../types/mirror';
import { ControlPanel } from '../components/ControlPanel';

interface Props {
  defaults: ControlDefaults;
  presets: PresetDefinition[];
  images: ImageRecord[];
  selectedImageIds: string[];
  onUpdateDefaults: (payload: Partial<ControlDefaults>) => Promise<void>;
  onBatchApply: (payload: { ids: string[]; presetId?: string; retouchIntensity?: number }) => Promise<void>;
}

export const ControlCenterPage = ({
  defaults,
  presets,
  images,
  selectedImageIds,
  onUpdateDefaults,
  onBatchApply,
}: Props) => {
  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-[#11141d] p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Control System</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-100">Preset engine + retouch intensity</h2>
      </div>

      <ControlPanel
        defaults={defaults}
        presets={presets}
        selectedImageIds={selectedImageIds}
        images={images}
        onUpdateDefaults={onUpdateDefaults}
        onBatchApply={onBatchApply}
      />
    </section>
  );
};
