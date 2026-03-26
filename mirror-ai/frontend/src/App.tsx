import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { ControlCenterPage } from './pages/ControlCenterPage';
import { LiveFeedPage } from './pages/LiveFeedPage';
import { TopBar } from './components/TopBar';
import { useRealtime } from './hooks/useRealtime';
import type { ControlDefaults, ImageRecord, PresetDefinition, RealtimeEvent, ShootCategory } from './types/mirror';
import { api } from './utils/api';

const upsertImage = (images: ImageRecord[], incoming: ImageRecord): ImageRecord[] => {
  const index = images.findIndex((item) => item.id === incoming.id);
  if (index === -1) {
    return [incoming, ...images];
  }

  const next = [...images];
  next[index] = incoming;
  return next.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

const applyRealtimeEvent = (images: ImageRecord[], event: RealtimeEvent): ImageRecord[] => {
  if (
    event.type === 'image:new' ||
    event.type === 'image:processing' ||
    event.type === 'image:done' ||
    event.type === 'image:error'
  ) {
    return upsertImage(images, event.payload as ImageRecord);
  }

  return images;
};

function App() {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [presets, setPresets] = useState<PresetDefinition[]>([]);
  const [defaults, setDefaults] = useState<ControlDefaults>({
    presetId: 'mirror-natural',
    retouchIntensity: 25,
  });
  const [category, setCategory] = useState<ShootCategory | 'all'>('all');
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [wsState, setWsState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [error, setError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    try {
      setError(null);
      const [imageData, presetData, defaultData] = await Promise.all([
        api.getImages(),
        api.getPresets(),
        api.getDefaults(),
      ]);

      setImages(imageData);
      setPresets(presetData);
      setDefaults(defaultData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load Mirror AI data');
    }
  }, []);

  useEffect(() => {
    loadInitial().catch(() => undefined);
  }, [loadInitial]);

  const handleRealtime = useCallback((event: RealtimeEvent) => {
    setImages((prev) => applyRealtimeEvent(prev, event));

    if (event.type === 'control:updated') {
      const payload = event.payload as Partial<ControlDefaults>;
      if (typeof payload.presetId === 'string' || typeof payload.retouchIntensity === 'number') {
        setDefaults((prev) => ({
          presetId: payload.presetId ?? prev.presetId,
          retouchIntensity: payload.retouchIntensity ?? prev.retouchIntensity,
        }));
      }
    }
  }, []);

  useRealtime(handleRealtime, setWsState);

  const handleToggleSelection = (imageId: string, checked: boolean) => {
    setSelectedImageIds((prev) => {
      if (checked) {
        if (prev.includes(imageId)) return prev;
        return [...prev, imageId];
      }

      return prev.filter((id) => id !== imageId);
    });
  };

  const applyImageControl = async (imageId: string, presetId: string, retouchIntensity: number) => {
    const updated = await api.updateImageControl(imageId, { presetId, retouchIntensity });
    setImages((prev) => upsertImage(prev, updated));
  };

  const updateDefaults = async (payload: Partial<ControlDefaults>) => {
    const updated = await api.updateDefaults(payload);
    setDefaults(updated);
  };

  const batchApply = async (payload: { ids: string[]; presetId?: string; retouchIntensity?: number }) => {
    const updated = await api.batchApply(payload);
    setImages((prev) => {
      let next = [...prev];
      for (const image of updated) {
        next = upsertImage(next, image);
      }
      return next;
    });
  };

  const selectedCount = selectedImageIds.length;
  const doneCount = useMemo(() => images.filter((item) => item.status === 'done').length, [images]);

  return (
    <div className="min-h-screen bg-[#090b11] text-slate-200">
      <TopBar wsState={wsState} />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-8">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#11141d] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Total images</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{images.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#11141d] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Processed</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{doneCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#11141d] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Selected</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{selectedCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#11141d] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Default retouch</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{defaults.retouchIntensity}</p>
          </div>
        </section>

        <nav className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#11141d] p-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive ? 'bg-indigo-400 text-black' : 'text-slate-300 hover:bg-white/10'
              }`
            }
          >
            Live Feed
          </NavLink>
          <NavLink
            to="/control"
            className={({ isActive }) =>
              `rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive ? 'bg-fuchsia-400 text-black' : 'text-slate-300 hover:bg-white/10'
              }`
            }
          >
            Control Center
          </NavLink>
        </nav>

        {error && (
          <div className="rounded-2xl border border-rose-300/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div>
        )}

        <Routes>
          <Route
            path="/"
            element={
              <LiveFeedPage
                images={images}
                presets={presets}
                selectedImageIds={selectedImageIds}
                category={category}
                onSelectCategory={setCategory}
                onToggleSelection={handleToggleSelection}
                onApplyImageControl={applyImageControl}
              />
            }
          />
          <Route
            path="/control"
            element={
              <ControlCenterPage
                defaults={defaults}
                presets={presets}
                images={images}
                selectedImageIds={selectedImageIds}
                onUpdateDefaults={updateDefaults}
                onBatchApply={batchApply}
              />
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
