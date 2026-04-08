import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  batchApplyControls,
  fetchMirrorControls,
  fetchMirrorImages,
  fetchMirrorPresets,
  fetchMirrorStats,
  updateImageControls,
  updateMirrorControls,
} from "@/lib/mirror-api";
import type { ControlState, MirrorImage, ProcessingStatus } from "@/types/mirror-ai";
import { useMirrorRealtime } from "@/hooks/use-mirror-realtime";

const statusClass: Record<ProcessingStatus, string> = {
  queued: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  processing: "bg-sky-500/20 text-sky-300 border-sky-500/40",
  done: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  error: "bg-red-500/20 text-red-300 border-red-500/40",
};

function formatTime(value: number): string {
  try {
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
}

function statCard(title: string, value: string, hint?: string) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
        {hint ? <p className="mt-1 text-xs text-white/45">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function ImageTile({
  item,
  selected,
  toggleSelected,
  beforeAfter,
  applyToImage,
}: {
  item: MirrorImage;
  selected: boolean;
  toggleSelected: (id: string) => void;
  beforeAfter: boolean;
  applyToImage: (id: string, patch: Partial<ControlState>) => void;
}) {
  const mainImage = beforeAfter ? item.originalUrl : item.previewUrl || item.processedUrl || item.originalUrl;
  const compareImage = beforeAfter ? item.previewUrl || item.processedUrl || item.originalUrl : item.originalUrl;

  return (
    <Card
      className={cn(
        "overflow-hidden border-white/10 bg-black/30 transition-all",
        selected ? "ring-2 ring-white/60" : "hover:border-white/30",
      )}
    >
      <div className="relative aspect-[4/3] bg-black">
        {mainImage ? (
          <img src={mainImage} alt={item.originalFilename} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full place-content-center text-white/40">No preview</div>
        )}
        <button
          onClick={() => toggleSelected(item.id)}
          className="absolute left-3 top-3 rounded-md border border-white/30 bg-black/50 px-2 py-1 text-xs text-white"
          type="button"
        >
          {selected ? "Selected" : "Select"}
        </button>
        <Badge className={cn("absolute right-3 top-3 border", statusClass[item.status])}>{item.status}</Badge>
        {beforeAfter && compareImage ? (
          <img
            src={compareImage}
            alt={`${item.originalFilename}-after`}
            className="absolute bottom-3 right-3 h-20 w-32 rounded border border-white/20 object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <CardContent className="space-y-3 p-3">
        <div>
          <p className="truncate text-sm font-medium text-white">{item.originalFilename}</p>
          <p className="text-xs text-white/45">{formatTime(item.createdAt)}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px] text-white/60">
          <div>Preset: {item.controls.presetId}</div>
          <div>Retouch: {Math.round(item.controls.retouchIntensity * 100)}%</div>
          <div>Category: {item.controls.category}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 bg-white/10 text-[10px] text-white hover:bg-white/20"
            onClick={() => applyToImage(item.id, { presetId: "clean" })}
          >
            Clean
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 bg-white/10 text-[10px] text-white hover:bg-white/20"
            onClick={() => applyToImage(item.id, { presetId: "editorial" })}
          >
            Editorial
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MirrorAIPage() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [beforeAfter, setBeforeAfter] = useState(true);

  const imagesQuery = useQuery({
    queryKey: ["mirror-images"],
    queryFn: () => fetchMirrorImages(100),
    refetchInterval: 5000,
  });
  const presetsQuery = useQuery({
    queryKey: ["mirror-presets"],
    queryFn: fetchMirrorPresets,
  });
  const controlsQuery = useQuery({
    queryKey: ["mirror-controls"],
    queryFn: fetchMirrorControls,
  });
  const statsQuery = useQuery({
    queryKey: ["mirror-stats"],
    queryFn: fetchMirrorStats,
    refetchInterval: 5000,
  });

  useMirrorRealtime((event) => {
    if (event.type === "image.received" || event.type === "image.updated" || event.type === "ready") {
      void queryClient.invalidateQueries({ queryKey: ["mirror-images"] });
      void queryClient.invalidateQueries({ queryKey: ["mirror-stats"] });
    }
    if (event.type === "control.updated") {
      queryClient.setQueryData(["mirror-controls"], event.payload.controls);
    }
  });

  const globalControlMutation = useMutation({
    mutationFn: (patch: Partial<ControlState>) => updateMirrorControls(patch),
    onSuccess: (controls) => {
      queryClient.setQueryData(["mirror-controls"], controls);
      toast.success("Live controls updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const imageControlMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ControlState> }) => updateImageControls(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["mirror-images"] });
      void queryClient.invalidateQueries({ queryKey: ["mirror-stats"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const batchMutation = useMutation({
    mutationFn: (patch: Partial<ControlState>) => batchApplyControls(selectedIds, patch),
    onSuccess: () => {
      toast.success(`Batch updated (${selectedIds.length})`);
      void queryClient.invalidateQueries({ queryKey: ["mirror-images"] });
      void queryClient.invalidateQueries({ queryKey: ["mirror-stats"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const images = imagesQuery.data ?? [];
  const presets = presetsQuery.data ?? [];
  const controls = controlsQuery.data;
  const stats = statsQuery.data;

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const processingCount = stats?.processing ?? 0;
  const doneCount = stats?.done ?? 0;
  const errorCount = stats?.error ?? 0;

  function toggleSelected(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((v) => v !== id) : [...current, id]));
  }

  function setRetouch(intensity: number) {
    globalControlMutation.mutate({ retouchIntensity: intensity });
  }

  return (
    <div className="min-h-screen bg-[#07080c] text-white">
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/40">Mirror AI</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Real-time Photography Assistant</h1>
            <p className="mt-2 text-sm text-white/60">Camera -&gt; FTP -&gt; AI Pipeline -&gt; Instant premium delivery</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className={cn("h-10 border border-white/10 bg-white/5 text-white hover:bg-white/10", beforeAfter && "bg-white/15")}
              onClick={() => setBeforeAfter((v) => !v)}
            >
              Before / After
            </Button>
            <Button
              variant="secondary"
              className="h-10 border border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => void queryClient.invalidateQueries({ queryKey: ["mirror-images"] })}
            >
              Refresh Feed
            </Button>
          </div>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statCard("Total", `${stats?.total ?? 0}`)}
          {statCard("Processing", `${processingCount}`, "Live queue")}
          {statCard("Delivered", `${doneCount}`, "Done")}
          {statCard("Errors", `${errorCount}`, "Needs attention")}
        </section>

        <section className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_2fr]">
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Control System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/45">Preset Selector</p>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => globalControlMutation.mutate({ presetId: preset.id })}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left text-xs transition",
                        controls?.presetId === preset.id
                          ? "border-white/70 bg-white/15 text-white"
                          : "border-white/10 bg-black/20 text-white/70 hover:border-white/30 hover:text-white",
                      )}
                    >
                      <p className="font-medium">{preset.name}</p>
                      <p className="mt-1 text-[10px] opacity-70">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.16em] text-white/45">Retouch Intensity</p>
                <Slider
                  value={[Math.round((controls?.retouchIntensity ?? 0.35) * 100)]}
                  max={100}
                  min={0}
                  step={1}
                  onValueChange={(values) => setRetouch(values[0] / 100)}
                />
                <p className="mt-2 text-xs text-white/55">{Math.round((controls?.retouchIntensity ?? 0.35) * 100)}%</p>
              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/45">Shoot Category</p>
                <div className="flex flex-wrap gap-2">
                  {(["portrait", "fashion", "wedding", "product", "street"] as const).map((category) => (
                    <button
                      type="button"
                      key={category}
                      onClick={() => globalControlMutation.mutate({ category })}
                      className={cn(
                        "rounded-md border px-3 py-2 text-xs",
                        controls?.category === category
                          ? "border-white/70 bg-white/15 text-white"
                          : "border-white/10 text-white/70 hover:border-white/30",
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/45">Batch Apply Edits</p>
                <p className="mt-1 text-xs text-white/55">{selectedIds.length} selected</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9 border border-white/10 bg-white/10 text-white hover:bg-white/20"
                    disabled={selectedIds.length === 0 || batchMutation.isPending}
                    onClick={() => batchMutation.mutate({ presetId: controls?.presetId ?? "clean" })}
                  >
                    Apply Preset
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9 border border-white/10 bg-white/10 text-white hover:bg-white/20"
                    disabled={selectedIds.length === 0 || batchMutation.isPending}
                    onClick={() =>
                      batchMutation.mutate({
                        retouchIntensity: controls?.retouchIntensity ?? 0.35,
                        category: controls?.category ?? "portrait",
                      })
                    }
                  >
                    Apply Category + Retouch
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 text-white/70 hover:text-white"
                    onClick={() => setSelectedIds([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Live Feed</CardTitle>
            </CardHeader>
            <CardContent>
              {imagesQuery.isLoading ? (
                <div className="py-20 text-center text-white/50">Loading live feed...</div>
              ) : images.length === 0 ? (
                <div className="py-20 text-center text-white/50">
                  Waiting for FTP uploads in backend inbox.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {images.map((item) => (
                    <ImageTile
                      key={item.id}
                      item={item}
                      selected={selectedSet.has(item.id)}
                      toggleSelected={toggleSelected}
                      beforeAfter={beforeAfter}
                      applyToImage={(id, patch) => imageControlMutation.mutate({ id, patch })}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
