import { useEffect, useMemo, useState } from "react";
import { Camera, Images, Sparkles, UploadCloud } from "lucide-react";
import { api } from "@/lib/mirror-api";
import type { ImageRecord, ProcessingPreset, RuntimeSettings, ShootCategory } from "@/types/mirror";
import { useMirrorRealtime } from "@/hooks/useMirrorRealtime";
import { KpiCard } from "@/components/mirror/KpiCard";
import { LiveFeed } from "@/components/mirror/LiveFeed";
import { BeforeAfterCard } from "@/components/mirror/BeforeAfterCard";
import { PresetSelector } from "@/components/mirror/PresetSelector";
import { ControlPanel } from "@/components/mirror/ControlPanel";

const categories: ShootCategory[] = [
  "wedding",
  "portrait",
  "fashion",
  "event",
  "editorial",
  "product",
  "lifestyle",
];

const kpi = (images: ImageRecord[]) => {
  const queued = images.filter((item) => item.status === "queued").length;
  const processing = images.filter((item) => item.status === "processing").length;
  const completed = images.filter((item) => item.status === "done").length;
  const failed = images.filter((item) => item.status === "failed").length;

  return {
    queued,
    processing,
    completed,
    failed,
  };
};

export default function MirrorApp() {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [presets, setPresets] = useState<ProcessingPreset[]>([]);
  const [settings, setSettings] = useState<RuntimeSettings>({
    activePresetId: "editorial-clean",
    retouchIntensity: 0.16,
    category: "wedding",
  });
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string[]>([]);
  const [queue, setQueue] = useState({ waiting: 0, active: 0, completed: 0, failed: 0 });
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("connecting");

  useEffect(() => {
    const bootstrap = async () => {
      const data = await api.dashboard();
      setImages(data.images);
      setPresets(data.presets);
      setSettings(data.settings);
      setQueue(data.queue);
      if (data.images[0]) {
        setSelectedImageId(data.images[0].id);
      }
    };
    bootstrap().catch(() => null);
  }, []);

  const realtime = useMirrorRealtime({
    onImageCreated: (image) => {
      setImages((prev) => [image, ...prev.filter((item) => item.id !== image.id)]);
      if (!selectedImageId) {
        setSelectedImageId(image.id);
      }
    },
    onImageUpdated: (image) => {
      setImages((prev) => prev.map((item) => (item.id === image.id ? image : item)));
    },
    onControlUpdated: (payload) => {
      if (payload && typeof payload === "object" && "activePresetId" in payload) {
        setSettings(payload as RuntimeSettings);
      }
    },
    onQueueStats: (stats) => setQueue(stats),
  });

  useEffect(() => {
    setConnectionState(realtime.connectionState);
  }, [realtime.connectionState]);

  const selectedImage = useMemo(
    () => images.find((item) => item.id === selectedImageId) || null,
    [images, selectedImageId],
  );

  const metrics = useMemo(() => kpi(images), [images]);

  const onPresetChange = async (presetId: string) => {
    const next = await api.updateControl({ activePresetId: presetId });
    setSettings(next.settings);
  };

  const onRetouchChange = async (value: number) => {
    const next = await api.updateControl({ retouchIntensity: value });
    setSettings(next.settings);
  };

  const onCategoryChange = async (category: ShootCategory) => {
    const next = await api.updateControl({ category });
    setSettings(next.settings);
  };

  const onBatchApply = async () => {
    if (selectedBatch.length === 0) {
      return;
    }
    await api.batchApply({
      imageIds: selectedBatch,
      activePresetId: settings.activePresetId,
      retouchIntensity: settings.retouchIntensity,
      category: settings.category,
    });
    setSelectedBatch([]);
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white">
      <div className="mx-auto max-w-[1440px] p-4 md:p-6 lg:p-8">
        <header className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/50">Mirror AI</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Real-time Photography Assistant</h1>
              <p className="mt-2 text-sm text-white/60">
                Camera → FTP ingest → AI processing → instant delivery.
              </p>
            </div>
            <div
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
                connectionState === "connected"
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : connectionState === "connecting"
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                    : "border-rose-400/30 bg-rose-400/10 text-rose-300"
              }`}
            >
              <UploadCloud className="h-4 w-4" />
              {connectionState === "connected" ? "Realtime connected" : connectionState}
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard icon={Camera} label="Queued" value={metrics.queued} />
          <KpiCard icon={Sparkles} label="Processing" value={metrics.processing} />
          <KpiCard icon={Images} label="Delivered" value={metrics.completed} />
          <KpiCard icon={UploadCloud} label="Failed" value={metrics.failed} accent="text-rose-300" />
          <KpiCard icon={UploadCloud} label="Queue Wait" value={queue.waiting} accent="text-cyan-300" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <div className="space-y-6">
            <LiveFeed
              images={images}
              selectedId={selectedImageId}
              selectedBatch={selectedBatch}
              onSelect={setSelectedImageId}
              onBatchToggle={(id) =>
                setSelectedBatch((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
              }
            />
            <BeforeAfterCard image={selectedImage} />
          </div>
          <div className="space-y-6">
            <PresetSelector
              presets={presets}
              activePresetId={settings.activePresetId}
              onSelect={onPresetChange}
            />
            <ControlPanel
              settings={settings}
              categories={categories}
              queue={queue}
              selectedBatchCount={selectedBatch.length}
              onRetouchChange={onRetouchChange}
              onCategoryChange={onCategoryChange}
              onBatchApply={onBatchApply}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
