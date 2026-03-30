import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, ImageIcon, Loader2, RefreshCcw, Sparkles, Wand2, XCircle } from "lucide-react";
import { mirrorApi } from "@/lib/mirror-ai/api";
import type { MirrorControlState, MirrorImage, MirrorPreset, MirrorWsMessage } from "@/lib/mirror-ai/types";

const CATEGORIES = ["wedding", "portrait", "fashion", "street", "event", "product"];

function statusBadge(status: MirrorImage["status"]): { label: string; className: string; icon: JSX.Element } {
  if (status === "done") {
    return {
      label: "Done",
      className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    };
  }
  if (status === "processing") {
    return {
      label: "Processing",
      className: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    };
  }
  if (status === "queued") {
    return {
      label: "Queued",
      className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      icon: <Clock3 className="h-3.5 w-3.5" />,
    };
  }
  return {
    label: "Error",
    className: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    icon: <XCircle className="h-3.5 w-3.5" />,
  };
}

function wsUrlFromBase(apiUrl: string): string {
  const asWs = apiUrl.startsWith("https://")
    ? apiUrl.replace("https://", "wss://")
    : apiUrl.replace("http://", "ws://");
  return `${asWs}/ws`;
}

export default function MirrorAILive() {
  const [images, setImages] = useState<MirrorImage[]>([]);
  const [presets, setPresets] = useState<MirrorPreset[]>([]);
  const [control, setControl] = useState<MirrorControlState | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [showAfter, setShowAfter] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingControl, setIsSavingControl] = useState(false);
  const [isApplyingBatch, setIsApplyingBatch] = useState(false);
  const [batchPresetId, setBatchPresetId] = useState<string>("");
  const [batchRetouch, setBatchRetouch] = useState<number>(0.35);
  const [batchCategory, setBatchCategory] = useState<string>("wedding");

  const selectedImage = useMemo(
    () => images.find((image) => image.id === selectedImageId) ?? images[0] ?? null,
    [images, selectedImageId],
  );

  async function refreshAll(): Promise<void> {
    setError(null);
    const [nextImages, nextPresets, nextControl] = await Promise.all([
      mirrorApi.getImages(200),
      mirrorApi.getPresets(),
      mirrorApi.getControl(),
    ]);
    setImages(nextImages);
    setPresets(nextPresets);
    setControl(nextControl);
    setBatchPresetId((current) => current || nextControl.activePresetId);
    setBatchRetouch(nextControl.retouchIntensity);
    setBatchCategory(nextControl.shootCategory);
    setSelectedImageId((current) => current ?? nextImages[0]?.id ?? null);
  }

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    refreshAll()
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load Mirror AI");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    const ws = new WebSocket(wsUrlFromBase(mirrorApi.getBaseUrl()));
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as MirrorWsMessage<MirrorImage | MirrorControlState>;
        if (message.type === "image.updated") {
          const updatedImage = message.payload as MirrorImage;
          setImages((prev) => {
            const idx = prev.findIndex((item) => item.id === updatedImage.id);
            if (idx === -1) return [updatedImage, ...prev];
            const next = [...prev];
            next[idx] = updatedImage;
            next.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            return next;
          });
          return;
        }
        if (message.type === "control.updated") {
          setControl(message.payload as MirrorControlState);
        }
      } catch {
        // Ignore malformed events.
      }
    };

    return () => {
      mounted = false;
      ws.close();
    };
  }, []);

  async function updateControl(patch: Partial<MirrorControlState>): Promise<void> {
    if (!control) return;
    setIsSavingControl(true);
    setError(null);
    try {
      const next = await mirrorApi.updateControl(patch);
      setControl(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update controls");
    } finally {
      setIsSavingControl(false);
    }
  }

  async function applyBatch(): Promise<void> {
    if (!selectedIds.length) return;
    setIsApplyingBatch(true);
    setError(null);
    try {
      await mirrorApi.batchUpdateImages({
        ids: selectedIds,
        presetId: batchPresetId || undefined,
        retouchIntensity: batchRetouch,
        shootCategory: batchCategory || undefined,
        reprocess: true,
      });
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed batch apply");
    } finally {
      setIsApplyingBatch(false);
    }
  }

  function toggleSelected(id: string): void {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  const beforeAfterUrl =
    showAfter && (selectedImage?.previewUrl || selectedImage?.fullUrl)
      ? selectedImage.previewUrl || selectedImage.fullUrl
      : selectedImage?.originalUrl;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto grid max-w-[1600px] gap-5 px-4 py-4 md:grid-cols-[360px_1fr_420px] md:px-6">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-zinc-50">Live Feed</h1>
              <p className="text-xs text-zinc-400">Incoming FTP/API photos</p>
            </div>
            <button
              onClick={() => {
                setIsLoading(true);
                refreshAll().finally(() => setIsLoading(false));
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
            >
              <RefreshCcw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {error ? <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-300">{error}</p> : null}

          <div className="max-h-[74vh] space-y-2 overflow-y-auto pr-1">
            {images.map((image) => {
              const badge = statusBadge(image.status);
              const selected = selectedIds.includes(image.id);
              return (
                <div
                  key={image.id}
                  className={`cursor-pointer rounded-xl border p-2 transition ${
                    image.id === selectedImage?.id ? "border-blue-500/60 bg-blue-500/10" : "border-zinc-800 bg-zinc-900/80 hover:bg-zinc-900"
                  }`}
                  onClick={() => setSelectedImageId(image.id)}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-zinc-100">{image.fileName}</p>
                      <p className="text-[11px] text-zinc-400">{image.shootCategory}</p>
                    </div>
                    <label className="inline-flex items-center gap-1 text-[11px] text-zinc-300">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) => {
                          event.stopPropagation();
                          toggleSelected(image.id);
                        }}
                        className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-800"
                      />
                      Select
                    </label>
                  </div>
                  <div className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] ${badge.className}`}>
                    {badge.icon}
                    {badge.label}
                  </div>
                </div>
              );
            })}
            {!images.length && !isLoading ? <p className="text-sm text-zinc-500">No incoming images yet.</p> : null}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-zinc-400" />
              <h2 className="text-sm font-medium text-zinc-200">Before / After</h2>
            </div>
            <button
              onClick={() => setShowAfter((v) => !v)}
              className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
            >
              {showAfter ? "After" : "Before"}
            </button>
          </div>

          <div className="relative min-h-[65vh] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
            {beforeAfterUrl ? (
              <img src={beforeAfterUrl} alt="Mirror AI preview" className="h-full max-h-[72vh] w-full object-contain" />
            ) : (
              <div className="flex h-[65vh] items-center justify-center text-zinc-500">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-8 w-8" />
                  <p className="mt-2 text-sm">Select an image from live feed</p>
                </div>
              </div>
            )}
          </div>

          {selectedImage?.analysis ? (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-2">Exposure: {(selectedImage.analysis.exposureScore * 100).toFixed(0)}%</div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-2">Skin tone: {(selectedImage.analysis.skinToneScore * 100).toFixed(0)}%</div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-2">Lighting: {(selectedImage.analysis.lightingScore * 100).toFixed(0)}%</div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-2">Warmth: {(selectedImage.analysis.warmthScore * 100).toFixed(0)}%</div>
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <h2 className="text-sm font-semibold">Live Control System</h2>
            </div>

            <div className="space-y-3">
              <label className="block text-xs text-zinc-300">
                Preset selector
                <select
                  value={control?.activePresetId ?? ""}
                  onChange={(event) => void updateControl({ activePresetId: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-sm"
                >
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs text-zinc-300">
                Shoot category
                <select
                  value={control?.shootCategory ?? ""}
                  onChange={(event) => void updateControl({ shootCategory: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-sm"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs text-zinc-300">
                Natural retouch intensity: {Math.round((control?.retouchIntensity ?? 0) * 100)}%
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={control?.retouchIntensity ?? 0.35}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setControl((prev) => (prev ? { ...prev, retouchIntensity: value } : prev));
                  }}
                  onMouseUp={(event) => void updateControl({ retouchIntensity: Number((event.target as HTMLInputElement).value })}
                  onTouchEnd={(event) => void updateControl({ retouchIntensity: Number((event.target as HTMLInputElement).value })}
                  className="mt-2 w-full"
                />
              </label>

              <p className="text-[11px] text-zinc-500">{isSavingControl ? "Saving controls..." : "Changes apply to new incoming images instantly."}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-blue-300" />
              <h2 className="text-sm font-semibold">Batch Apply Edits</h2>
            </div>
            <p className="mb-3 text-xs text-zinc-400">{selectedIds.length} selected in live feed.</p>

            <div className="space-y-3">
              <label className="block text-xs text-zinc-300">
                Preset
                <select
                  value={batchPresetId}
                  onChange={(event) => setBatchPresetId(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-sm"
                >
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs text-zinc-300">
                Category
                <select
                  value={batchCategory}
                  onChange={(event) => setBatchCategory(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-sm"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs text-zinc-300">
                Retouch: {Math.round(batchRetouch * 100)}%
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={batchRetouch}
                  onChange={(event) => setBatchRetouch(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>

              <button
                onClick={() => void applyBatch()}
                disabled={!selectedIds.length || isApplyingBatch}
                className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isApplyingBatch ? "Applying..." : "Apply & Reprocess"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
