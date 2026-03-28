import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  CircleDot,
  Image as ImageIcon,
  Layers,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  Wand2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_MIRROR_API_BASE || "http://localhost:8787";
const WS_BASE = import.meta.env.VITE_MIRROR_WS_URL || "ws://localhost:8787/ws";

type ImageStatus = "queued" | "processing" | "done" | "failed";

type ControlState = {
  activePresetId: string;
  retouchIntensity: number;
  activeCategory: string;
};

type Preset = {
  id: string;
  name: string;
  description: string;
  config: Record<string, number>;
};

type MirrorImage = {
  id: string;
  originalFilename: string;
  category: string;
  status: ImageStatus;
  presetId: string;
  retouchIntensity: number;
  exposureScore: number;
  skinToneScore: number;
  lightingScore: number;
  notes: string;
  width: number;
  height: number;
  previewUrl: string | null;
  processedUrl: string | null;
  sourceUrl: string;
  createdAt: string;
  processedAt?: string | null;
};

type SnapshotPayload = {
  images: MirrorImage[];
  control: ControlState;
  presets: Preset[];
  queue: QueueState;
};

type QueueState = {
  running: number;
  waiting: number;
  concurrency: number;
};

const STATUS_STYLE: Record<ImageStatus, string> = {
  queued: "bg-blue-500/15 text-blue-300 border-blue-400/20",
  processing: "bg-amber-500/15 text-amber-300 border-amber-400/20",
  done: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
  failed: "bg-rose-500/15 text-rose-300 border-rose-400/20",
};

const CATEGORIES = ["portrait", "fashion", "wedding", "commercial", "lifestyle", "event", "general"];

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return response.json();
}

function statusIcon(status: ImageStatus) {
  if (status === "queued") return <CircleDot className="h-3.5 w-3.5" />;
  if (status === "processing") return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
  if (status === "done") return <CheckCircle2 className="h-3.5 w-3.5" />;
  return <XCircle className="h-3.5 w-3.5" />;
}

function formatScore(value: number) {
  return `${Math.round(value * 100)}%`;
}

function buildImageUrl(relative: string | null | undefined) {
  if (!relative) return null;
  if (relative.startsWith("http://") || relative.startsWith("https://")) {
    return relative;
  }
  return `${API_BASE}${relative}`;
}

function App() {
  const [images, setImages] = useState<MirrorImage[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [control, setControl] = useState<ControlState>({
    activePresetId: "",
    retouchIntensity: 0.22,
    activeCategory: "general",
  });
  const [selectedImageId, setSelectedImageId] = useState<string>("");
  const [compareMode, setCompareMode] = useState<"after" | "before">("after");
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [queue, setQueue] = useState<QueueState>({ running: 0, waiting: 0, concurrency: 2 });
  const [uploading, setUploading] = useState(false);
  const [syncingControl, setSyncingControl] = useState(false);
  const [appError, setAppError] = useState<string>("");
  const queueRef = useRef(queue);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const selectedImage = useMemo(() => {
    if (!selectedImageId) return images[0] ?? null;
    return images.find((image) => image.id === selectedImageId) ?? images[0] ?? null;
  }, [images, selectedImageId]);

  const liveFeed = useMemo(() => images.slice(0, 30), [images]);
  const selectedBatchCount = selectedBatchIds.length;

  const upsertImage = (incoming: MirrorImage) => {
    setImages((prev) => {
      const idx = prev.findIndex((item) => item.id === incoming.id);
      if (idx === -1) return [incoming, ...prev];
      const copy = [...prev];
      copy[idx] = incoming;
      copy.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return copy;
    });
  };

  const mergeSnapshot = (payload: SnapshotPayload) => {
    setImages(payload.images ?? []);
    setPresets(payload.presets ?? []);
    setQueue(payload.queue ?? { running: 0, waiting: 0, concurrency: 2 });
    setControl(payload.control ?? { activePresetId: "", retouchIntensity: 0.22, activeCategory: "general" });
    if (!selectedImageId && payload.images.length > 0) setSelectedImageId(payload.images[0].id);
  };

  const loadInitial = async () => {
    const [imagesRes, presetsRes, controlRes] = await Promise.all([
      apiFetch<{ items: MirrorImage[]; queue: QueueState }>("/api/images?limit=120&offset=0"),
      apiFetch<{ items: Preset[] }>("/api/presets"),
      apiFetch<ControlState>("/api/control"),
    ]);
    setImages(imagesRes.items);
    setQueue(imagesRes.queue);
    setPresets(presetsRes.items);
    setControl(controlRes);
    if (imagesRes.items.length > 0) setSelectedImageId(imagesRes.items[0].id);
  };

  useEffect(() => {
    loadInitial().catch((error) => setAppError(error.message));

    const ws = new WebSocket(WS_BASE);
    ws.onmessage = (event) => {
      const packet = JSON.parse(event.data);
      if (packet.type === "snapshot") {
        mergeSnapshot(packet.payload);
        return;
      }
      if (packet.type === "image:ingested" || packet.type === "image:updated" || packet.type === "image:done") {
        upsertImage(packet.payload);
        return;
      }
      if (packet.type === "image:status") {
        setImages((prev) =>
          prev.map((item) =>
            item.id === packet.payload.id ? { ...item, status: packet.payload.status as ImageStatus } : item,
          ),
        );
        return;
      }
      if (packet.type === "image:queued") {
        setQueue(packet.payload.queue ?? queueRef.current);
        return;
      }
      if (packet.type === "control:updated") {
        setControl(packet.payload);
      }
    };
    ws.onerror = () => setAppError("Realtime connection failed.");
    return () => ws.close();
  }, []);

  const syncControl = async (next: Partial<ControlState>) => {
    const optimistic = { ...control, ...next };
    setControl(optimistic);
    setSyncingControl(true);
    try {
      const updated = await apiFetch<ControlState>("/api/control", {
        method: "PATCH",
        body: JSON.stringify(next),
      });
      setControl(updated);
    } catch (error) {
      setAppError((error as Error).message);
    } finally {
      setSyncingControl(false);
    }
  };

  const triggerSingleReprocess = async (id: string) => {
    try {
      await apiFetch(`/api/images/${id}/requeue`, {
        method: "POST",
        body: JSON.stringify({
          presetId: control.activePresetId,
          retouchIntensity: control.retouchIntensity,
        }),
      });
    } catch (error) {
      setAppError((error as Error).message);
    }
  };

  const applyBatch = async () => {
    if (selectedBatchIds.length === 0) return;
    try {
      await apiFetch("/api/images/batch/apply", {
        method: "POST",
        body: JSON.stringify({
          ids: selectedBatchIds,
          presetId: control.activePresetId,
          retouchIntensity: control.retouchIntensity,
          category: control.activeCategory,
        }),
      });
      setSelectedBatchIds([]);
    } catch (error) {
      setAppError((error as Error).message);
    }
  };

  const onUploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(await response.text());
    } catch (error) {
      setAppError((error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const previewUrl =
    compareMode === "before" ? buildImageUrl(selectedImage?.sourceUrl) : buildImageUrl(selectedImage?.processedUrl || selectedImage?.previewUrl);

  return (
    <main className="min-h-screen bg-[#07090f] text-zinc-100">
      <div className="mx-auto max-w-[1540px] space-y-6 p-4 md:p-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-950 to-zinc-900 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Mirror AI</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Real-time photography assistant</h1>
            <p className="mt-2 text-sm text-zinc-400">
              FTP ingest {"->"} AI pipeline {"->"} instant delivery. Premium capture flow for studio teams.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs md:text-sm">
            <Card className="border-white/10 bg-zinc-950/80">
              <CardContent className="p-3">
                <p className="text-zinc-400">Queue</p>
                <p className="mt-1 font-semibold text-zinc-100">{queue.waiting}</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-zinc-950/80">
              <CardContent className="p-3">
                <p className="text-zinc-400">Processing</p>
                <p className="mt-1 font-semibold text-zinc-100">{queue.running}</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-zinc-950/80">
              <CardContent className="p-3">
                <p className="text-zinc-400">Concurrency</p>
                <p className="mt-1 font-semibold text-zinc-100">{queue.concurrency}</p>
              </CardContent>
            </Card>
          </div>
        </header>

        {appError ? (
          <div className="rounded-lg border border-rose-500/40 bg-rose-900/20 px-4 py-2 text-sm text-rose-200">
            {appError}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_2.1fr_1.2fr]">
          <Card className="border-white/10 bg-zinc-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="h-4 w-4 text-indigo-300" />
                Live Feed
              </CardTitle>
              <CardDescription>Incoming images from FTP and uploads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-900">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Upload test image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadFile(file);
                  }}
                />
              </label>

              <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
                {liveFeed.map((item) => (
                  <button
                    key={item.id}
                    className={cn(
                      "w-full rounded-xl border px-3 py-3 text-left transition",
                      selectedImage?.id === item.id
                        ? "border-indigo-400/60 bg-indigo-500/10"
                        : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-700",
                    )}
                    onClick={() => setSelectedImageId(item.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{item.originalFilename}</p>
                      <Badge className={cn("border text-[11px] capitalize", STATUS_STYLE[item.status])}>
                        <span className="mr-1">{statusIcon(item.status)}</span>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">
                      {item.category} · {new Date(item.createdAt).toLocaleTimeString()}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedBatchIds.includes(item.id)}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setSelectedBatchIds((prev) =>
                            checked ? [...new Set([...prev, item.id])] : prev.filter((id) => id !== item.id),
                          );
                        }}
                      />
                      <span className="text-xs text-zinc-400">Batch select</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4 text-emerald-300" />
                Before / After
              </CardTitle>
              <CardDescription>Instant output with no refresh</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <ToggleGroup
                  type="single"
                  value={compareMode}
                  onValueChange={(value) => {
                    if (value === "before" || value === "after") setCompareMode(value);
                  }}
                >
                  <ToggleGroupItem value="before">Before</ToggleGroupItem>
                  <ToggleGroupItem value="after">After</ToggleGroupItem>
                </ToggleGroup>
                {selectedImage ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-zinc-700 bg-zinc-900"
                    onClick={() => triggerSingleReprocess(selectedImage.id)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reprocess
                  </Button>
                ) : null}
              </div>

              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                {selectedImage && previewUrl ? (
                  <img src={previewUrl} alt={selectedImage.originalFilename} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-500">No image selected</div>
                )}
              </div>

              {selectedImage ? (
                <div className="grid grid-cols-3 gap-3 text-xs md:text-sm">
                  <MetricTile label="Exposure" value={formatScore(selectedImage.exposureScore)} />
                  <MetricTile label="Skin tones" value={formatScore(selectedImage.skinToneScore)} />
                  <MetricTile label="Lighting" value={formatScore(selectedImage.lightingScore)} />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4 text-purple-300" />
                Control System
                {syncingControl ? <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" /> : null}
              </CardTitle>
              <CardDescription>Live preset, retouch, category and batch apply</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Preset selector
                </p>
                <Select
                  value={control.activePresetId}
                  onValueChange={(value) => syncControl({ activePresetId: value })}
                >
                  <SelectTrigger className="border-zinc-700 bg-zinc-900">
                    <SelectValue placeholder="Choose preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
                  <span className="flex items-center gap-2">
                    <Wand2 className="h-3.5 w-3.5" />
                    Retouch intensity
                  </span>
                  <span>{Math.round(control.retouchIntensity * 100)}%</span>
                </p>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[control.retouchIntensity]}
                  onValueCommit={(value) => syncControl({ retouchIntensity: value[0] })}
                  onValueChange={(value) =>
                    setControl((prev) => ({
                      ...prev,
                      retouchIntensity: value[0],
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-400">
                  <Layers className="h-3.5 w-3.5" />
                  Shoot category
                </p>
                <Select
                  value={control.activeCategory}
                  onValueChange={(value) => syncControl({ activeCategory: value })}
                >
                  <SelectTrigger className="border-zinc-700 bg-zinc-900">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
                <p className="text-sm font-medium text-zinc-200">Batch apply edits</p>
                <p className="text-xs text-zinc-400">{selectedBatchCount} image(s) selected</p>
                <Button className="w-full" disabled={selectedBatchCount === 0} onClick={applyBatch}>
                  Apply preset + retouch + category
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/75">
      <CardContent className="p-3">
        <p className="text-xs text-zinc-400">{label}</p>
        <p className="mt-1 text-base font-semibold text-zinc-100">{value}</p>
      </CardContent>
    </Card>
  );
}

export default App;
