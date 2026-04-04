import { useMemo, useState } from "react";
import { Camera, CheckCircle2, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { LiveStatusBadge } from "@/components/mirror-ai/LiveStatusBadge";
import { ImageStatusBadge } from "@/components/mirror-ai/ImageStatusBadge";
import { BeforeAfterPreview } from "@/components/mirror-ai/BeforeAfterPreview";
import { ControlPanel } from "@/components/mirror-ai/ControlPanel";
import { BatchApplyPanel } from "@/components/mirror-ai/BatchApplyPanel";
import { useMirrorAIRealtime } from "@/lib/mirror-ai/useMirrorAIRealtime";
import type { MirrorImage } from "@/lib/mirror-ai/types";

const countByStatus = (images: MirrorImage[]) => {
  return images.reduce(
    (acc, image) => {
      acc[image.status] += 1;
      return acc;
    },
    { queued: 0, processing: 0, done: 0, failed: 0 },
  );
};

const MirrorAI = () => {
  const {
    images,
    presets,
    controls,
    isLoading,
    isRefreshing,
    isSocketConnected,
    lastEventAt,
    refetch,
    updateControls,
    batchApply,
    controlsPending,
    batchPending,
  } = useMirrorAIRealtime();

  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [focusedImageId, setFocusedImageId] = useState<string | null>(null);

  const stats = useMemo(() => countByStatus(images), [images]);
  const focusedImage = useMemo(
    () => images.find((item) => item.id === focusedImageId) ?? images[0],
    [focusedImageId, images],
  );

  const selectedSet = useMemo(() => new Set(selectedImageIds), [selectedImageIds]);

  const toggleSelect = (imageId: string) => {
    setSelectedImageIds((current) =>
      current.includes(imageId) ? current.filter((id) => id !== imageId) : [...current, imageId],
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 shadow-2xl shadow-black/40 md:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-300">
                <Sparkles className="h-3.5 w-3.5" />
                Mirror AI
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Real-time photography assistant
              </h1>
              <p className="max-w-2xl text-sm text-zinc-400">
                Camera to FTP to AI processing with instant live delivery. Designed for fast on-set
                review and premium output control.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <LiveStatusBadge connected={isSocketConnected} refreshing={isRefreshing} />
              <button
                type="button"
                onClick={() => void refetch()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Queued</div>
              <div className="mt-1 text-xl font-semibold text-amber-300">{stats.queued}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Processing</div>
              <div className="mt-1 text-xl font-semibold text-sky-300">{stats.processing}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Done</div>
              <div className="mt-1 text-xl font-semibold text-emerald-300">{stats.done}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Total</div>
              <div className="mt-1 text-xl font-semibold text-zinc-100">{images.length}</div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
          <section className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">
                  Live Feed
                </h2>
                <div className="text-xs text-zinc-500">
                  {lastEventAt
                    ? `Last event ${formatDistanceToNowStrict(new Date(lastEventAt))} ago`
                    : "No events yet"}
                </div>
              </div>

              {isLoading ? (
                <div className="flex h-52 items-center justify-center text-zinc-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading feed...
                </div>
              ) : images.length === 0 ? (
                <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-black/20 text-zinc-500">
                  <Camera className="h-6 w-6" />
                  <div className="text-sm">Waiting for FTP uploads in mirror-ai/server/storage/incoming</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((image) => {
                    const isSelected = selectedSet.has(image.id);
                    const display = image.thumbnailUrl || image.previewUrl || image.originalUrl;
                    return (
                      <article
                        key={image.id}
                        className={`overflow-hidden rounded-2xl border transition ${
                          focusedImage?.id === image.id
                            ? "border-white/40 bg-white/5"
                            : "border-white/10 bg-black/30"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setFocusedImageId(image.id)}
                          className="w-full text-left"
                        >
                          <div className="aspect-[4/3] w-full bg-black/50">
                            {display ? (
                              <img
                                src={display}
                                alt={image.fileName}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-zinc-500">
                                No preview
                              </div>
                            )}
                          </div>
                        </button>
                        <div className="space-y-2 p-3">
                          <div className="line-clamp-1 text-sm font-medium text-zinc-100">{image.fileName}</div>
                          <div className="flex items-center justify-between gap-2">
                            <ImageStatusBadge status={image.status} />
                            <button
                              type="button"
                              onClick={() => toggleSelect(image.id)}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${
                                isSelected
                                  ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                                  : "border-white/10 bg-white/5 text-zinc-300"
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {isSelected ? "Selected" : "Select"}
                            </button>
                          </div>
                          <div className="text-xs text-zinc-500">
                            {image.category} · {image.preset} · retouch {image.retouchIntensity}%
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <BeforeAfterPreview
              beforeUrl={focusedImage?.originalUrl}
              afterUrl={focusedImage?.previewUrl || focusedImage?.fullUrl}
              alt={focusedImage?.fileName || "Mirror AI image"}
            />
          </section>

          <aside className="space-y-5">
            <ControlPanel
              presets={presets}
              controls={controls}
              pending={controlsPending}
              onSave={updateControls}
            />

            <BatchApplyPanel
              presets={presets}
              selectedCount={selectedImageIds.length}
              selectedImageIds={selectedImageIds}
              pending={batchPending}
              onApply={batchApply}
            />

            <section className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 md:p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">
                Current Defaults
              </h2>
              <div className="space-y-2 text-sm text-zinc-300">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500">Preset</span>
                  <span className="font-medium">{controls?.defaultPreset || "-"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500">Retouch</span>
                  <span className="font-medium">{controls?.defaultRetouchIntensity ?? "-"}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Category</span>
                  <span className="font-medium">{controls?.defaultCategory || "-"}</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default MirrorAI;
