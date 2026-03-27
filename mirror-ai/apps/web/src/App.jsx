import { useCallback, useEffect, useMemo, useState } from "react";
import { ShootCategories } from "@mirror-ai/shared/contracts";
import { batchApply, getControl, getImages, getPresets, patchControl, reprocessImage } from "./lib/api";
import { getSocket } from "./lib/socket";
import { ControlPanel } from "./components/ControlPanel";
import { TopStats } from "./components/TopStats";
import { ImageCard } from "./components/ImageCard";

function upsertImage(images, nextImage) {
  const existing = images.find((image) => image.id === nextImage.id);
  if (!existing) {
    return [nextImage, ...images];
  }
  return images.map((image) => (image.id === nextImage.id ? nextImage : image));
}

export function App() {
  const [images, setImages] = useState([]);
  const [presets, setPresets] = useState([]);
  const [control, setControl] = useState({
    presetId: "clean-natural",
    retouchIntensity: 0.3,
    category: "portrait",
  });
  const [showAfter, setShowAfter] = useState(true);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [socketState, setSocketState] = useState("connecting");

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [imagesData, presetsData, controlData] = await Promise.all([getImages(), getPresets(), getControl()]);
      setImages(imagesData);
      setPresets(presetsData);
      if (controlData) {
        setControl(controlData);
      }
    } catch (loadError) {
      setError(loadError.message || "Failed to load initial dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData().catch(() => {});
  }, [loadInitialData]);

  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => setSocketState("live");
    const onDisconnect = () => setSocketState("offline");
    const onSnapshot = (nextImages) => setImages(nextImages);
    const onIngested = (image) => setImages((prev) => upsertImage(prev, image));
    const onUpdated = (image) => setImages((prev) => upsertImage(prev, image));
    const onControl = ({ control: nextControl }) => {
      if (nextControl) {
        setControl(nextControl);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("images:snapshot", onSnapshot);
    socket.on("image:ingested", onIngested);
    socket.on("image:updated", onUpdated);
    socket.on("control:updated", onControl);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("images:snapshot", onSnapshot);
      socket.off("image:ingested", onIngested);
      socket.off("image:updated", onUpdated);
      socket.off("control:updated", onControl);
    };
  }, []);

  const onSelect = useCallback((imageId) => {
    setSelected((prev) => (prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]));
  }, []);

  const onControlChange = useCallback(
    async (patch) => {
      const optimistic = { ...control, ...patch };
      setControl(optimistic);
      try {
        const saved = await patchControl(patch);
        setControl(saved);
      } catch (patchError) {
        setError(patchError.message || "Failed to update control settings");
        setControl(control);
      }
    },
    [control],
  );

  const onReprocess = useCallback(
    async (imageId) => {
      setBusy(true);
      setError("");
      try {
        await reprocessImage(imageId, {
          presetId: control.presetId,
          retouchIntensity: control.retouchIntensity,
          category: control.category,
        });
      } catch (reprocessError) {
        setError(reprocessError.message || "Failed to reprocess image");
      } finally {
        setBusy(false);
      }
    },
    [control.category, control.presetId, control.retouchIntensity],
  );

  const onBatchApply = useCallback(async () => {
    if (selected.length === 0) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await batchApply({
        imageIds: selected,
        presetId: control.presetId,
        retouchIntensity: control.retouchIntensity,
        category: control.category,
      });
      setSelected([]);
    } catch (batchError) {
      setError(batchError.message || "Failed to apply batch");
    } finally {
      setBusy(false);
    }
  }, [control.category, control.presetId, control.retouchIntensity, selected]);

  return (
    <div className="min-h-screen px-4 pb-8 pt-6 md:px-8 lg:px-12">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-400">Mirror AI</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-50 md:text-4xl">Real-time Photography Assistant</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            FTP ingest, AI-enhanced previews, and instant live delivery for premium shoots.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              socketState === "live"
                ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                : "bg-zinc-500/15 text-zinc-200 ring-1 ring-zinc-500/30"
            }`}
          >
            {socketState}
          </div>
          <button
            type="button"
            onClick={() => setShowAfter((value) => !value)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-sky-500/50 hover:bg-sky-500/10"
          >
            {showAfter ? "After View" : "Before View"}
          </button>
        </div>
      </header>

      <div className="space-y-4">
        <TopStats images={images} />

        <ControlPanel
          control={control}
          presets={presets}
          categories={ShootCategories}
          selectedIds={selected}
          onControlChange={onControlChange}
          onBatchApply={onBatchApply}
          busy={busy}
        />

        {error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>
        ) : null}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Live Feed</h2>
            <p className="text-xs text-zinc-400">
              {loading ? "Loading..." : `${images.length} images`} {showAfter ? "(after)" : "(before)"}
            </p>
          </div>
          {images.length === 0 && !loading ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-sm text-zinc-400">
              Waiting for camera uploads via FTP...
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {images.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  selected={selectedSet.has(image.id)}
                  onSelect={onSelect}
                  onReprocess={onReprocess}
                  showAfter={showAfter}
                  actionBusy={busy}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
