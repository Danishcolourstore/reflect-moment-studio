import { useEffect, useMemo, useState } from "react";
import { Camera, CheckCircle2, ImagePlus, SlidersHorizontal, Sparkles, Zap } from "lucide-react";
import { mirrorApi } from "./api";
import { connectMirrorSocket } from "./socket";
import type { MirrorImage, MirrorSettings, PresetDefinition } from "./types";
import { absoluteAssetUrl, categoryLabel, formatRelativeTime, resolvePrimaryImageUrl } from "./utils";
import { StatusBadge } from "./components/StatusBadge";
import { SectionCard } from "./components/SectionCard";
import { BeforeAfter } from "./components/BeforeAfter";
import { ImageTile } from "./components/ImageTile";

const CATEGORIES = ["portrait", "wedding", "fashion", "event", "studio"];

function stats(images: MirrorImage[]) {
  return {
    total: images.length,
    queued: images.filter((img) => img.status === "queued").length,
    processing: images.filter((img) => img.status === "processing").length,
    done: images.filter((img) => img.status === "done").length,
  };
}

export default function MirrorAiApp() {
  const [images, setImages] = useState<MirrorImage[]>([]);
  const [presets, setPresets] = useState<PresetDefinition[]>([]);
  const [settings, setSettings] = useState<MirrorSettings>({
    defaultPreset: "",
    defaultRetouchIntensity: 35,
    defaultCategory: "portrait",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [simPath, setSimPath] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        const [imagesRes, presetsRes, settingsRes] = await Promise.all([
          mirrorApi.getImages(),
          mirrorApi.getPresets(),
          mirrorApi.getSettings(),
        ]);
        if (!alive) {
          return;
        }
        setImages(imagesRes.images);
        setPresets(presetsRes.presets);
        setSettings(settingsRes.settings);
        if (imagesRes.images.length > 0) {
          setActiveImageId(imagesRes.images[0].id);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    load().catch((error) => {
      console.error("Failed to load Mirror AI data", error);
      if (alive) {
        setLoading(false);
      }
    });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const socket = connectMirrorSocket({
      onImageQueued(incoming) {
        setImages((prev) => [incoming, ...prev.filter((img) => img.id !== incoming.id)]);
        setActiveImageId((current) => current ?? incoming.id);
      },
      onImageUpdated(incoming) {
        setImages((prev) => {
          const exists = prev.some((image) => image.id === incoming.id);
          if (!exists) {
            return [incoming, ...prev];
          }
          return prev.map((image) => (image.id === incoming.id ? incoming : image));
        });
      },
      onSettingsUpdated(incoming) {
        setSettings(incoming);
      },
    });

    return () => {
      socket.close();
    };
  }, []);

  const activeImage = useMemo(() => images.find((image) => image.id === activeImageId) ?? null, [images, activeImageId]);
  const currentStats = useMemo(() => stats(images), [images]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const updateDefaults = async (patch: Partial<MirrorSettings>) => {
    const optimistic = { ...settings, ...patch };
    setSettings(optimistic);
    try {
      const response = await mirrorApi.updateSettings(patch);
      setSettings(response.settings);
    } catch (error) {
      console.error("Failed to update defaults", error);
    }
  };

  const applyToCurrent = async (patch: { preset?: string; retouchIntensity?: number; category?: string }) => {
    if (!activeImage) {
      return;
    }
    setBusy(true);
    try {
      const response = await mirrorApi.updateImage(activeImage.id, { ...patch, reprocess: true });
      setImages((prev) => prev.map((img) => (img.id === response.image.id ? response.image : img)));
    } catch (error) {
      console.error("Failed to update active image", error);
    } finally {
      setBusy(false);
    }
  };

  const applyBatch = async () => {
    if (selectedIds.length === 0) {
      return;
    }
    setBusy(true);
    try {
      await mirrorApi.batchApply({
        imageIds: selectedIds,
        preset: settings.defaultPreset,
        retouchIntensity: settings.defaultRetouchIntensity,
        category: settings.defaultCategory,
      });
    } catch (error) {
      console.error("Failed to batch apply edits", error);
    } finally {
      setBusy(false);
    }
  };

  const reprocessActive = async () => {
    if (!activeImage) {
      return;
    }
    try {
      await mirrorApi.reprocess(activeImage.id);
    } catch (error) {
      console.error("Failed to reprocess active image", error);
    }
  };

  const simulateIngest = async () => {
    if (!simPath.trim()) {
      return;
    }
    setBusy(true);
    try {
      await mirrorApi.simulateUpload(simPath.trim());
      setSimPath("");
    } catch (error) {
      console.error("Failed to simulate upload", error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-zinc-800/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> Mirror AI
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Real-time Photography Assistant</h1>
            <p className="mt-2 text-sm text-zinc-400">Camera → FTP → AI pipeline → instant premium preview with live controls.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<ImagePlus className="h-4 w-4" />} label="Total" value={currentStats.total} />
            <StatCard icon={<Camera className="h-4 w-4" />} label="Queued" value={currentStats.queued} />
            <StatCard icon={<Zap className="h-4 w-4" />} label="Processing" value={currentStats.processing} />
            <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Done" value={currentStats.done} />
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <div className="space-y-6">
            <SectionCard title="Live Feed" subtitle="Incoming captures with instant status and smart controls">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <input
                  value={simPath}
                  onChange={(event) => setSimPath(event.target.value)}
                  placeholder="/absolute/path/to/image.jpg"
                  className="min-w-[260px] flex-1 rounded-xl border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                />
                <button
                  type="button"
                  onClick={simulateIngest}
                  disabled={busy}
                  className="rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Simulate Ingest
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-52 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60" />
                  ))}
                </div>
              ) : images.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-10 text-center text-sm text-zinc-400">
                  No images ingested yet. Upload through FTP to start real-time processing.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {images.map((image) => (
                    <ImageTile
                      key={image.id}
                      image={image}
                      selected={selectedIds.includes(image.id)}
                      onSelectToggle={toggleSelect}
                      onClick={setActiveImageId}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Control System" subtitle="Live preset, category, retouch tuning and batch apply">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">Default Preset</label>
                  <select
                    value={settings.defaultPreset}
                    onChange={(event) => updateDefaults({ defaultPreset: event.target.value })}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                  >
                    {presets.map((preset) => (
                      <option key={preset.key} value={preset.key}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">Shoot Category</label>
                  <select
                    value={settings.defaultCategory}
                    onChange={(event) => updateDefaults({ defaultCategory: event.target.value })}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {categoryLabel(category)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
                  <span>Default Retouch Intensity</span>
                  <span>{settings.defaultRetouchIntensity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.defaultRetouchIntensity}
                  onChange={(event) => updateDefaults({ defaultRetouchIntensity: Number(event.target.value) })}
                  className="w-full accent-zinc-300"
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    applyToCurrent({
                      preset: settings.defaultPreset,
                      retouchIntensity: settings.defaultRetouchIntensity,
                      category: settings.defaultCategory,
                    })
                  }
                  disabled={!activeImage || busy}
                  className="rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium transition hover:border-zinc-500 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Apply to Active
                </button>
                <button
                  type="button"
                  onClick={applyBatch}
                  disabled={selectedIds.length === 0 || busy}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Batch Apply ({selectedIds.length})
                </button>
                <button
                  type="button"
                  onClick={reprocessActive}
                  disabled={!activeImage || busy}
                  className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reprocess Active
                </button>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title="Before / After" subtitle="Instant compare without page refresh">
              <BeforeAfter image={activeImage} />
            </SectionCard>

            <SectionCard title="Active Frame" subtitle="Detailed analysis and metadata">
              {!activeImage ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-sm text-zinc-400">Select an image from live feed.</div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
                    <img src={absoluteAssetUrl(resolvePrimaryImageUrl(activeImage))} alt={activeImage.filename} className="h-56 w-full object-cover" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <MetaLine label="Filename" value={activeImage.filename} />
                    <MetaLine label="Category" value={categoryLabel(activeImage.category)} />
                    <MetaLine label="Preset" value={activeImage.preset} />
                    <MetaLine label="Retouch" value={`${activeImage.retouchIntensity}%`} />
                    <MetaLine label="Updated" value={formatRelativeTime(activeImage.updatedAt)} />
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                      <p className="mb-1 text-[11px] uppercase tracking-wide text-zinc-500">Status</p>
                      <StatusBadge status={activeImage.status} />
                    </div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-xs text-zinc-300">
                    <p className="mb-2 inline-flex items-center gap-2 uppercase tracking-wide text-zinc-500">
                      <SlidersHorizontal className="h-3.5 w-3.5" /> AI Analysis
                    </p>
                    {activeImage.analysis ? (
                      <div className="space-y-1.5">
                        <p>Exposure: {activeImage.analysis.exposure.bucket} ({activeImage.analysis.exposure.score})</p>
                        <p>Skin tone: {activeImage.analysis.skinTone.bucket} ({activeImage.analysis.skinTone.warmth})</p>
                        <p>Lighting: {activeImage.analysis.lighting.bucket} / contrast {activeImage.analysis.lighting.contrast}</p>
                      </div>
                    ) : (
                      <p className="text-zinc-500">Analysis will appear once processing is complete.</p>
                    )}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard(props: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">
      <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-zinc-500">
        {props.icon}
        {props.label}
      </div>
      <p className="text-lg font-semibold text-zinc-100">{props.value}</p>
    </div>
  );
}

function MetaLine(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
      <p className="mb-1 text-[11px] uppercase tracking-wide text-zinc-500">{props.label}</p>
      <p className="truncate text-sm text-zinc-200">{props.value}</p>
    </div>
  );
}
