import { useMemo } from 'react';
import type { ImageRecord, PresetDefinition, ShootCategory } from '../types/mirror';
import { CategoryFilter } from '../components/CategoryFilter';
import { ImageCard } from '../components/ImageCard';

interface Props {
  images: ImageRecord[];
  presets: PresetDefinition[];
  selectedImageIds: string[];
  category: ShootCategory | 'all';
  onSelectCategory: (category: ShootCategory | 'all') => void;
  onToggleSelection: (imageId: string, checked: boolean) => void;
  onApplyImageControl: (imageId: string, presetId: string, retouchIntensity: number) => Promise<void>;
}

export const LiveFeedPage = ({
  images,
  presets,
  selectedImageIds,
  category,
  onSelectCategory,
  onToggleSelection,
  onApplyImageControl,
}: Props) => {
  const filtered = useMemo(() => {
    if (category === 'all') return images;
    return images.filter((image) => image.category === category);
  }, [category, images]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#11141d] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Live Feed</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-100">Incoming captures</h2>
        </div>

        <CategoryFilter active={category} onSelect={onSelectCategory} />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/20 bg-black/20 p-12 text-center">
          <p className="text-sm text-slate-400">No images yet. Upload to FTP `/uploads/incoming` to start realtime processing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              selected={selectedImageIds.includes(image.id)}
              onSelect={onToggleSelection}
              presets={presets}
              onApply={onApplyImageControl}
            />
          ))}
        </div>
      )}
    </section>
  );
};
