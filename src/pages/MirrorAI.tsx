import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

type ImageStatus = "queued" | "processing" | "done" | "error";

interface MirrorImage {
  id: string;
  originalUrl: string | null;
  previewUrl: string | null;
  processedUrl: string | null;
  status: ImageStatus;
  presetId?: string;
  category?: string;
  retouchIntensity?: number;
  analysis?: {
    exposure?: { score?: number };
    skin?: { score?: number };
    lighting?: { score?: number };
  };
  error?: string | null;
  createdAt?: string;
}

interface MirrorPreset {
  id: string;
  name: string;
  description: string;
}

interface PresetResponse {
  presets: MirrorPreset[];
  categories: string[];
}

interface ImagesResponse {
  images: MirrorImage[];
}

const API_BASE =
  (import.meta.env.VITE_MIRRORAI_API_BASE as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8787";
const WS_BASE =
  (import.meta.env.VITE_MIRRORAI_WS_BASE as string | undefined)?.replace(/\/$/, "") ||
  "ws://localhost:8787/ws";

function statusBadge(status: ImageStatus) {
  if (status === "done") {
    return <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-400/25">Done</Badge>;
  }
  if (status === "processing") {
    return (
      <Badge className="bg-amber-500/15 text-amber-300 border-amber-400/25">
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        Processing
      </Badge>
    );
  }
  if (status === "queued") {
    return (
      <Badge className="bg-blue-500/15 text-blue-300 border-blue-400/25">
        <Clock3 className="mr-1 h-3 w-3" />
        Queued
      </Badge>
    );
  }
  return <Badge className="bg-rose-500/15 text-rose-300 border-rose-400/25">Error</Badge>;
}

function resolveImageSrc(image: MirrorImage, showAfter: boolean) {
  if (showAfter) return image.processedUrl || image.previewUrl || image.originalUrl || "";
  return image.originalUrl || image.previewUrl || image.processedUrl || "";
}

export default function MirrorAI() {
  const [images, setImages] = useState<MirrorImage[]>([]);
  const [presets, setPresets] = useState<MirrorPreset[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState("editorial-balanced");
  const [selectedCategory, setSelectedCategory] = useState("portrait");
  const [retouch, setRetouch] = useState(45);
  const [showAfter, setShowAfter] = useState(true);
  const [busy, setBusy] = useState(false);
  const [socketOnline, setSocketOnline] = useState(false);

  const selectedImage = useMemo(
    () => images.find((image) => image.id === selectedImageId) || images[0] || null,
    [images, selectedImageId],
  );

  useEffect(() => {
    const load = async () => {
      const [presetRes, imagesRes] = await Promise.all([
        fetch(`${API_BASE}/api/presets`).then((res) => res.json() as Promise<PresetResponse>),
        fetch(`${API_BASE}/api/images`).then((res) => res.json() as Promise<ImagesResponse>),
      ]);

      setPresets(presetRes.presets || []);
      setCategories(presetRes.categories || []);
      setImages((imagesRes.images || []) as MirrorImage[]);

      if (!selectedImageId && imagesRes.images?.length) {
        setSelectedImageId(imagesRes.images[0].id);
      }
      if (presetRes.presets?.length) {
        setSelectedPreset(presetRes.presets[0].id);
      }
      if (presetRes.categories?.length) {
        setSelectedCategory(presetRes.categories[0]);
      }
    };

    load().catch(() => {
      // Keep page functional; data will update if websocket events arrive.
    });
  }, [selectedImageId]);

  useEffect(() => {
    const ws = new WebSocket(WS_BASE);
    ws.onopen = () => setSocketOnline(true);
    ws.onclose = () => setSocketOnline(false);
    ws.onerror = () => setSocketOnline(false);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type: string; payload: any };
        if (payload.type === "image:queued") {
          setImages((current) => [payload.payload as MirrorImage, ...current]);
        }
        if (payload.type === "image:status" || payload.type === "image:error") {
          const { id, status, error } = payload.payload || {};
          if (!id) return;
          setImages((current) =>
            current.map((item) => (item.id === id ? { ...item, status: status || item.status, error } : item)),
          );
        }
        if (payload.type === "image:done") {
          const updated = payload.payload as MirrorImage;
          if (!updated?.id) return;
          setImages((current) => {
            const exists = current.some((item) => item.id === updated.id);
            if (!exists) return [updated, ...current];
            return current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
          });
        }
      } catch {
        // ignore malformed events
      }
    };
    return () => ws.close();
  }, []);

  const applyToCurrent = async () => {
    if (!selectedImage) return;
    setBusy(true);
    try {
      await fetch(`${API_BASE}/api/controls/reprocess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: selectedImage.id,
          presetId: selectedPreset,
          category: selectedCategory,
          retouchIntensity: retouch / 100,
        }),
      });
    } finally {
      setBusy(false);
    }
  };

  const applyBatch = async () => {
    if (!selectedIds.length) return;
    setBusy(true);
    try {
      await fetch(`${API_BASE}/api/controls/batch-apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageIds: selectedIds,
          presetId: selectedPreset,
          category: selectedCategory,
          retouchIntensity: retouch / 100,
        }),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090d] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Mirror AI</p>
            <h1 className="text-2xl font-semibold tracking-tight">Real-time Photography Assistant</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={socketOnline ? "bg-emerald-500/15 text-emerald-300 border-emerald-300/30" : "bg-slate-600/30 text-slate-300 border-slate-400/20"}>
              {socketOnline ? "Realtime Connected" : "Realtime Offline"}
            </Badge>
            <Badge className="bg-slate-700/40 text-slate-200 border-slate-400/20">{images.length} frames</Badge>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card className="border-slate-700/40 bg-slate-900/70 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Before / After</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-slate-600 ${!showAfter ? "bg-slate-800 text-white" : "text-slate-300"}`}
                    onClick={() => setShowAfter(false)}
                  >
                    Before
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-slate-600 ${showAfter ? "bg-slate-800 text-white" : "text-slate-300"}`}
                    onClick={() => setShowAfter(true)}
                  >
                    After
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-700/50 bg-black/40">
                {selectedImage ? (
                  <img
                    src={`${API_BASE}${resolveImageSrc(selectedImage, showAfter)}`}
                    alt="Selected frame"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Waiting for incoming images...
                  </div>
                )}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3">
                  <p className="text-xs text-slate-400">Exposure</p>
                  <p className="text-lg font-semibold">
                    {selectedImage?.analysis?.exposure?.score?.toFixed?.(2) || "--"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3">
                  <p className="text-xs text-slate-400">Skin Tone</p>
                  <p className="text-lg font-semibold">
                    {selectedImage?.analysis?.skin?.score?.toFixed?.(2) || "--"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3">
                  <p className="text-xs text-slate-400">Lighting</p>
                  <p className="text-lg font-semibold">
                    {selectedImage?.analysis?.lighting?.score?.toFixed?.(2) || "--"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-slate-700/40 bg-slate-900/70 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Control System</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-400">Preset Selector</p>
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedPreset(preset.id)}
                        className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                          selectedPreset === preset.id
                            ? "border-violet-400/70 bg-violet-500/15 text-violet-100"
                            : "border-slate-700/60 bg-slate-800/50 text-slate-300 hover:border-slate-500"
                        }`}
                      >
                        <p className="font-medium">{preset.name}</p>
                        <p className="mt-1 text-[11px] opacity-80">{preset.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-400">Shoot Category</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          selectedCategory === category
                            ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-100"
                            : "border-slate-700/60 bg-slate-800/40 text-slate-300"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Natural Retouch</p>
                    <p className="text-sm text-slate-200">{retouch}%</p>
                  </div>
                  <Slider value={[retouch]} max={100} min={0} step={1} onValueChange={(v) => setRetouch(v[0] || 0)} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={applyToCurrent} disabled={busy || !selectedImage} className="bg-white text-slate-900 hover:bg-slate-200">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Apply Current
                  </Button>
                  <Button onClick={applyBatch} disabled={busy || !selectedIds.length} variant="outline" className="border-slate-600 text-slate-100">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Batch Apply
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700/40 bg-slate-900/70 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Live Feed</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[50vh] space-y-2 overflow-y-auto">
                {images.map((image) => {
                  const selected = selectedImage?.id === image.id;
                  const checked = selectedIds.includes(image.id);
                  return (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageId(image.id)}
                      className={`w-full rounded-xl border p-2 text-left transition ${
                        selected
                          ? "border-violet-400/60 bg-violet-500/10"
                          : "border-slate-700/50 bg-slate-800/35 hover:border-slate-500/70"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-16 w-16 overflow-hidden rounded-lg border border-slate-700/60 bg-black/30">
                          <img
                            src={`${API_BASE}${resolveImageSrc(image, true)}`}
                            alt="thumb"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="truncate text-xs text-slate-200">{image.id.slice(0, 12)}</p>
                            {statusBadge(image.status)}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {image.category || "portrait"} • {image.presetId || "editorial-balanced"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        {image.error ? (
                          <span className="truncate text-[11px] text-rose-300">{image.error}</span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {(image.retouchIntensity ?? 0.45 * 100).toFixed(0)}% retouch
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIds((current) =>
                              checked ? current.filter((id) => id !== image.id) : [...current, image.id],
                            );
                          }}
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] ${
                            checked
                              ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200"
                              : "border-slate-600 text-slate-300"
                          }`}
                        >
                          {checked ? <CheckCircle2 className="h-3 w-3" /> : null}
                          {checked ? "Selected" : "Select"}
                        </button>
                      </div>
                    </button>
                  );
                })}
                {!images.length && (
                  <div className="rounded-lg border border-dashed border-slate-700 p-5 text-center text-sm text-slate-400">
                    Awaiting FTP uploads...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
