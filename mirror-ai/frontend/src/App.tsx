import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, Sparkles, Zap } from "lucide-react";
import { batchApply, getControl, getImages, getPresets, patchControl, reprocessImage } from "./api/client";
import { BatchPanel } from "./components/BatchPanel";
import { ControlPanel } from "./components/ControlPanel";
import { ImageCard } from "./components/ImageCard";
import { useMirrorSocket } from "./hooks/useMirrorSocket";
import type { ControlState, ImageItem, Preset } from "./types/domain";

function upsertImage(collection: ImageItem[], next: ImageItem): ImageItem[] {
  const index = collection.findIndex((item) => item.id === next.id);
  if (index === -1) {
    return [next, ...collection].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const copy = [...collection];
  copy[index] = next;
  return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const defaultControl: ControlState = {
  presetId: "",
  category: "portrait",
  retouchIntensity: 35,
};

export default function App() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [control, setControl] = useState<ControlState>(defaultControl);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshControl = useCallback(async () => {
    const nextControl = await getControl();
    setControl(nextControl);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const [nextImages, nextPresets, nextControl] = await Promise.all([getImages(), getPresets(), getControl()]);
        if (!mounted) {
          return;
        }
        setImages(nextImages);
        setPresets(nextPresets);
        setControl(nextControl);
        setError(null);
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load Mirror AI");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  useMirrorSocket({
    onImageUpsert: useCallback((image: ImageItem) => {
      setImages((current) => upsertImage(current, image));
    }, []),
    onControlUpdated: useCallback(() => {
      void refreshControl();
    }, [refreshControl]),
  });

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const liveStats = useMemo(() => {
    const processing = images.filter((image) => image.status === "processing").length;
    const queued = images.filter((image) => image.status === "queued").length;
    const done = images.filter((image) => image.status === "done").length;
    return { processing, queued, done, total: images.length };
  }, [images]);

  const onControlChange = useCallback(
    async (patch: Partial<ControlState>) => {
      try {
        setBusy(true);
        const next = await patchControl(patch);
        setControl(next);
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : "Control update failed");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const onToggleSelect = useCallback((imageId: string) => {
    setSelectedIds((current) => (current.includes(imageId) ? current.filter((id) => id !== imageId) : [...current, imageId]));
  }, []);

  const onReprocess = useCallback(async (imageId: string) => {
    try {
      await reprocessImage(imageId);
    } catch (reprocessError) {
      setError(reprocessError instanceof Error ? reprocessError.message : "Reprocess failed");
    }
  }, []);

  const onBatchApply = useCallback(
    async (payload: { presetId?: string; category?: string; retouchIntensity?: number }) => {
      if (!selectedIds.length) {
        return;
      }

      try {
        setBusy(true);
        await batchApply({
          imageIds: selectedIds,
          ...payload,
        });
        setSelectedIds([]);
      } catch (batchError) {
        setError(batchError instanceof Error ? batchError.message : "Batch apply failed");
      } finally {
        setBusy(false);
      }
    },
    [selectedIds],
  );

  return (
    <main className="min-h-screen bg-luxe-950 bg-luxury-gradient text-luxe-100">
      <div className="mx-auto max-w-[1500px] px-4 pb-10 pt-8 md:px-6">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-luxe-700 bg-luxe-900/70 p-6 shadow-glow backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent-400/60 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent-300">
              <Sparkles size={12} />
              Mirror AI
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-luxe-100 md:text-3xl">Realtime Photography Assistant</h1>
            <p className="mt-2 max-w-3xl text-sm text-luxe-300">
              Camera to FTP to AI processing to instant preview and full-resolution delivery. Built for premium, high-speed capture workflows.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <StatTile label="Live Feed" value={String(liveStats.total)} icon={<Camera size={14} />} />
            <StatTile label="Queued" value={String(liveStats.queued)} icon={<Zap size={14} />} />
            <StatTile label="Processing" value={String(liveStats.processing)} icon={<Sparkles size={14} />} />
            <StatTile label="Done" value={String(liveStats.done)} icon={<Sparkles size={14} />} />
          </div>
        </header>

        {error ? (
          <div className="mb-4 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[320px_320px_1fr]">
          <ControlPanel control={control} presets={presets} onChange={onControlChange} disabled={busy || loading} />
          <BatchPanel selectedCount={selectedIds.length} presets={presets} onApply={onBatchApply} disabled={busy || loading} />

          <section className="rounded-2xl border border-luxe-700 bg-luxe-900/70 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-luxe-200">Live Feed</h2>
                <p className="text-xs text-luxe-400">Realtime updates. Before / after toggle on each card.</p>
              </div>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center rounded-xl border border-luxe-700 bg-luxe-850 text-sm text-luxe-400">
                Loading Mirror AI...
              </div>
            ) : images.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-xl border border-luxe-700 bg-luxe-850 text-sm text-luxe-400">
                No images yet. Upload via FTP or API.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {images.map((image) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    selected={selectedSet.has(image.id)}
                    onToggleSelect={onToggleSelect}
                    onReprocess={onReprocess}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function StatTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-luxe-700 bg-luxe-850/80 px-3 py-2">
      <div className="mb-1 flex items-center gap-1 text-luxe-400">{icon}</div>
      <p className="text-base font-semibold text-luxe-100">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-luxe-400">{label}</p>
    </div>
  );
}
