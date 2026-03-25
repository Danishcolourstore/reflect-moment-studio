import { useEffect, useMemo, useState } from "react";
import { Sparkles, Activity, RefreshCw, Wand2, CheckCircle2, Clock3, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type MirrorStatus = "queued" | "processing" | "done" | "error";
type PresetId = "balanced" | "bright-clean" | "moody-cinematic" | "skin-first";
type ShootCategory = "portrait" | "wedding" | "fashion" | "product" | "event";

type MirrorImage = {
  id: string;
  sourceFilename: string;
  status: MirrorStatus;
  preset: PresetId;
  category: ShootCategory;
  retouchIntensity: number;
  createdAt: string;
  updatedAt: string;
  originalUrl: string;
  previewUrl?: string;
  processedUrl?: string;
};

type PresetDefinition = {
  id: PresetId;
  label: string;
  description: string;
};

type Controls = {
  preset: PresetId;
  retouchIntensity: number;
  category: ShootCategory;
};

type BootstrapResponse = {
  presets: PresetDefinition[];
  categories: ShootCategory[];
  controls: Controls;
  queue: { queued: number; processing: number };
  images: MirrorImage[];
};

const API_BASE = import.meta.env.VITE_MIRROR_AI_API_BASE ?? "http://localhost:8787";
const WS_BASE = import.meta.env.VITE_MIRROR_AI_WS_BASE ?? "ws://localhost:8787/ws";

const statusMeta: Record<MirrorStatus, { label: string; icon: JSX.Element; className: string }> = {
  queued: {
    label: "Queued",
    icon: <Clock3 className="h-3.5 w-3.5" />,
    className: "bg-zinc-700/60 text-zinc-200 border-zinc-600/50",
  },
  processing: {
    label: "Processing",
    icon: <RefreshCw className="h-3.5 w-3.5 animate-spin" />,
    className: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  },
  done: {
    label: "Done",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  },
  error: {
    label: "Error",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    className: "bg-rose-500/20 text-rose-200 border-rose-500/40",
  },
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export default function MirrorAI() {
  const [images, setImages] = useState<MirrorImage[]>([]);
  const [presets, setPresets] = useState<PresetDefinition[]>([]);
  const [categories, setCategories] = useState<ShootCategory[]>([]);
  const [controls, setControls] = useState<Controls>({
    preset: "balanced",
    retouchIntensity: 0.2,
    category: "portrait",
  });
  const [queue, setQueue] = useState({ queued: 0, processing: 0 });
  const [selected, setSelected] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"before" | "after">("after");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      setLoading(true);
      setError(null);
      try {
        const data = await api<BootstrapResponse>("/api/bootstrap");
        if (!mounted) return;
        setPresets(data.presets);
        setCategories(data.categories);
        setControls(data.controls);
        setQueue(data.queue);
        setImages(data.images);
        if (data.images.length > 0) {
          setActiveId(data.images[0].id);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load Mirror AI");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const ws = new WebSocket(WS_BASE);
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as
          | { type: "bootstrap"; images: MirrorImage[]; controls: Controls; queue: { queued: number; processing: number } }
          | { type: "image.created"; image: MirrorImage }
          | { type: "image.updated"; image: MirrorImage }
          | { type: "controls.updated"; controls: Controls }
          | { type: "queue.stats"; queue: { queued: number; processing: number } }
          | { type: string };

        if (message.type === "bootstrap") {
          setImages(message.images);
          setControls(message.controls);
          setQueue(message.queue);
          return;
        }
        if (message.type === "image.created") {
          setImages((prev) => [message.image, ...prev.filter((x) => x.id !== message.image.id)]);
          setActiveId((prev) => prev ?? message.image.id);
          return;
        }
        if (message.type === "image.updated") {
          setImages((prev) => {
            const next = prev.map((item) => (item.id === message.image.id ? message.image : item));
            return next.some((x) => x.id === message.image.id) ? next : [message.image, ...prev];
          });
          return;
        }
        if (message.type === "controls.updated") {
          setControls(message.controls);
          return;
        }
        if (message.type === "queue.stats") {
          setQueue(message.queue);
        }
      } catch {
        // Ignore malformed messages to keep stream resilient.
      }
    };
    return () => ws.close();
  }, []);

  const activeImage = useMemo(
    () => images.find((item) => item.id === activeId) ?? images[0] ?? null,
    [images, activeId],
  );

  const counts = useMemo(() => {
    return images.reduce(
      (acc, image) => {
        acc[image.status] += 1;
        return acc;
      },
      { queued: 0, processing: 0, done: 0, error: 0 } as Record<MirrorStatus, number>,
    );
  }, [images]);

  async function updateControls(next: Partial<Controls>) {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...controls, ...next };
      const res = await api<{ controls: Controls }>("/api/controls", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setControls(res.controls);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update controls");
    } finally {
      setSaving(false);
    }
  }

  async function batchApply() {
    if (selected.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await api("/api/images/batch", {
        method: "POST",
        body: JSON.stringify({
          imageIds: selected,
          preset: controls.preset,
          retouchIntensity: controls.retouchIntensity,
          category: controls.category,
        }),
      });
      setSelected([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Batch apply failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-8 md:py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Mirror AI</p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-50 md:text-3xl">Real-Time Photography Assistant</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="border-zinc-700 bg-zinc-900 text-zinc-300">
              <Activity className="mr-1.5 h-3.5 w-3.5" /> Queue {queue.queued + queue.processing}
            </Badge>
            <Badge className="border-zinc-700 bg-zinc-900 text-zinc-300">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Live WS
            </Badge>
          </div>
        </div>

        {error && (
          <Card className="mb-4 border-rose-500/40 bg-rose-950/30">
            <CardContent className="pt-6 text-sm text-rose-200">{error}</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[370px_minmax(0,1fr)_360px]">
          <Card className="border-zinc-800/80 bg-zinc-950/60 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-zinc-100">Control System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Preset</p>
                <Select
                  value={controls.preset}
                  onValueChange={(value) => void updateControls({ preset: value as PresetId })}
                >
                  <SelectTrigger className="border-zinc-800 bg-zinc-900 text-zinc-100">
                    <SelectValue placeholder="Select preset" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                    {presets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Shoot Category</p>
                <Select
                  value={controls.category}
                  onValueChange={(value) => void updateControls({ category: value as ShootCategory })}
                >
                  <SelectTrigger className="border-zinc-800 bg-zinc-900 text-zinc-100">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Retouch Intensity</p>
                  <span className="text-xs text-zinc-300">{Math.round(controls.retouchIntensity * 100)}%</span>
                </div>
                <Slider
                  value={[controls.retouchIntensity]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueCommit={(value) => void updateControls({ retouchIntensity: value[0] ?? controls.retouchIntensity })}
                />
              </div>

              <Button
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                onClick={() => void batchApply()}
                disabled={selected.length === 0 || saving}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Batch Apply to {selected.length || 0} Selected
              </Button>

              <div className="grid grid-cols-2 gap-2">
                {(["queued", "processing", "done", "error"] as MirrorStatus[]).map((status) => (
                  <div key={status} className="rounded-lg border border-zinc-800 bg-zinc-900 p-2.5">
                    <p className="text-xs text-zinc-500">{statusMeta[status].label}</p>
                    <p className="mt-1 text-lg font-semibold text-zinc-100">{counts[status]}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800/80 bg-zinc-950/60 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base font-medium text-zinc-100">Before / After</CardTitle>
                <Tabs
                  value={viewMode}
                  onValueChange={(value) => setViewMode(value as "before" | "after")}
                  className="w-auto"
                >
                  <TabsList className="bg-zinc-900">
                    <TabsTrigger value="before">Before</TabsTrigger>
                    <TabsTrigger value="after">After</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black">
                {activeImage ? (
                  <img
                    src={
                      viewMode === "before"
                        ? activeImage.originalUrl
                        : activeImage.previewUrl ?? activeImage.processedUrl ?? activeImage.originalUrl
                    }
                    alt={activeImage.sourceFilename}
                    className="h-[68vh] w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-[68vh] items-center justify-center text-zinc-500">
                    {loading ? "Loading feed..." : "No images yet. Upload through FTP to start."}
                  </div>
                )}
              </div>
              {activeImage && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                  <span className="truncate">{activeImage.sourceFilename}</span>
                  <span>{new Date(activeImage.updatedAt).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-zinc-800/80 bg-zinc-950/60 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-zinc-100">Live Feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="max-h-[74vh] space-y-2 overflow-y-auto pr-1">
                {images.map((image) => {
                  const isActive = image.id === activeImage?.id;
                  const isChecked = selected.includes(image.id);
                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setActiveId(image.id)}
                      className={cn(
                        "group w-full rounded-xl border p-2 text-left transition",
                        isActive
                          ? "border-zinc-400/70 bg-zinc-900"
                          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            setSelected((prev) =>
                              checked
                                ? [...new Set([...prev, image.id])]
                                : prev.filter((id) => id !== image.id),
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 border-zinc-600 data-[state=checked]:bg-zinc-200 data-[state=checked]:text-zinc-900"
                        />
                        <img
                          src={image.previewUrl ?? image.originalUrl}
                          alt={image.sourceFilename}
                          className="h-16 w-16 rounded-lg object-cover"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-100">{image.sourceFilename}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">{image.category}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge className={cn("border text-[10px]", statusMeta[image.status].className)}>
                              <span className="mr-1">{statusMeta[image.status].icon}</span>
                              {statusMeta[image.status].label}
                            </Badge>
                            <Badge variant="outline" className="border-zinc-700 text-[10px] text-zinc-300">
                              {image.preset}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
