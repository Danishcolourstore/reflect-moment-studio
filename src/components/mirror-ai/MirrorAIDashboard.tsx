import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useMirrorAI } from "@/lib/mirror-ai/hooks";
import type { MirrorImage } from "@/lib/mirror-ai/types";

const statusStyles: Record<string, string> = {
  queued: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  processing: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  done: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  failed: "bg-rose-500/10 text-rose-300 border-rose-500/30",
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const ImageCard = ({
  image,
  compareMode,
  onReprocess,
}: {
  image: MirrorImage;
  compareMode: boolean;
  onReprocess: (imageId: string) => void;
}) => {
  const primaryUrl = compareMode ? image.previewUrl ?? image.processedUrl : image.processedUrl ?? image.previewUrl;
  const secondaryUrl = compareMode ? image.originalUrl : undefined;

  return (
    <Card className="overflow-hidden border-white/10 bg-white/[0.02] backdrop-blur-xl">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/40">
        {secondaryUrl && primaryUrl ? (
          <div className="grid h-full grid-cols-2">
            <div className="relative border-r border-white/10">
              <img src={secondaryUrl} alt={`${image.originalFilename} original`} className="h-full w-full object-cover" loading="lazy" />
              <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[10px] uppercase tracking-wide text-white/80">
                Before
              </span>
            </div>
            <div className="relative">
              <img src={primaryUrl} alt={`${image.originalFilename} processed`} className="h-full w-full object-cover" loading="lazy" />
              <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[10px] uppercase tracking-wide text-white/80">
                After
              </span>
            </div>
          </div>
        ) : primaryUrl ? (
          <img src={primaryUrl} alt={image.originalFilename} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/40">Awaiting render...</div>
        )}
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="line-clamp-1 text-sm font-medium text-white">{image.originalFilename}</p>
          <Badge className={cn("capitalize border", statusStyles[image.status] ?? statusStyles.queued)}>
            {image.status}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
          <span>Preset: {image.processing?.presetId ?? "—"}</span>
          <span>Retouch: {Math.round((image.processing?.retouchIntensity ?? 0) * 100)}%</span>
          <span>Category: {image.category ?? "—"}</span>
          <span>Updated: {formatDateTime(image.updatedAt)}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-white/40">{image.error ? `Error: ${image.error}` : "Ready for delivery"}</p>
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            onClick={() => onReprocess(image.id)}
          >
            Reprocess
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const MirrorAIDashboard = () => {
  const {
    images,
    presets,
    categories,
    settings,
    queue,
    isLoading,
    isConnected,
    compareMode,
    setCompareMode,
    patchSettings,
    reprocessImage,
    batchReprocess,
  } = useMirrorAI();

  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === settings.activePresetId) ?? presets[0],
    [presets, settings.activePresetId],
  );

  const processingCount = images.filter((image) => image.status === "processing").length;
  const doneCount = images.filter((image) => image.status === "done").length;

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <header className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-white/50">Mirror AI</p>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Real-time photography assistant</h1>
              <p className="max-w-2xl text-sm text-white/60">
                Camera to FTP to AI to instant delivery. Tuned for premium speed, natural skin, and controlled lighting correction.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Card className="border-white/10 bg-black/30">
                <CardContent className="p-3">
                  <p className="text-white/50">Live Status</p>
                  <p className={cn("mt-1 font-medium", isConnected ? "text-emerald-300" : "text-amber-300")}>
                    {isConnected ? "Connected" : "Offline"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-black/30">
                <CardContent className="p-3">
                  <p className="text-white/50">Queued</p>
                  <p className="mt-1 font-medium text-white">{queue?.queued ?? 0}</p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-black/30">
                <CardContent className="p-3">
                  <p className="text-white/50">Processing</p>
                  <p className="mt-1 font-medium text-white">{processingCount}</p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-black/30">
                <CardContent className="p-3">
                  <p className="text-white/50">Delivered</p>
                  <p className="mt-1 font-medium text-white">{doneCount}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr,2fr]">
          <Card className="border-white/10 bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-base text-white">Control System</CardTitle>
              <CardDescription className="text-white/50">Preset, retouch intensity, and batch actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-white/50">Preset Selector</p>
                <Select
                  value={settings.activePresetId}
                  onValueChange={(value) => patchSettings({ activePresetId: value })}
                >
                  <SelectTrigger className="border-white/20 bg-black/40 text-white">
                    <SelectValue placeholder="Select preset" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111216] text-white">
                    {presets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-white/40">Active: {activePreset?.name ?? "—"}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/50">
                  <span>Retouch Intensity</span>
                  <span>{Math.round(settings.retouchIntensity * 100)}%</span>
                </div>
                <Slider
                  value={[settings.retouchIntensity]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={(value) => patchSettings({ retouchIntensity: value[0] ?? 0 })}
                />
                <p className="text-[11px] text-white/40">Natural smoothing with texture preservation.</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-white/50">Shoot Category</p>
                <Select value={settings.category} onValueChange={(value) => patchSettings({ category: value })}>
                  <SelectTrigger className="border-white/20 bg-black/40 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111216] text-white">
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant={compareMode ? "default" : "outline"}
                  className={cn(
                    compareMode ? "bg-white text-black hover:bg-white/90" : "border-white/20 bg-white/5 text-white hover:bg-white/10",
                  )}
                  onClick={() => setCompareMode(!compareMode)}
                >
                  {compareMode ? "After View" : "Before / After"}
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                  onClick={batchReprocess}
                >
                  Batch Apply
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.02]">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base text-white">Live Feed</CardTitle>
                <CardDescription className="text-white/50">
                  Incoming frames from FTP ingest with instant status and rendering updates
                </CardDescription>
              </div>
              <Badge className="border border-white/20 bg-white/5 text-white/80">
                {isLoading ? "Loading..." : `${images.length} assets`}
              </Badge>
            </CardHeader>
            <CardContent>
              {images.length === 0 ? (
                <div className="flex h-[420px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/20 text-sm text-white/40">
                  Waiting for FTP uploads...
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {images.map((image) => (
                    <ImageCard
                      key={image.id}
                      image={image}
                      compareMode={compareMode}
                      onReprocess={reprocessImage}
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
};

