import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Upload,
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Wand2,
  BookOpen,
  Loader2,
  Camera,
  Palette,
  Eye,
  ArrowRight,
  ImageIcon,
  Layers,
  Clock,
  Zap,
  RefreshCw,
} from "lucide-react";
import {
  INDIAN_ALBUM_SIZES,
  DESIGN_PRESETS,
  MOMENT_LABELS,
  type IndianAlbumSize,
  type DesignPreset,
  type PhotoAnalysis,
  type AIAlbumGenerationResult,
} from "@/components/ai-album/ai-album-types";
import { generateAlbumLayout } from "@/components/ai-album/ai-layout-engine";
import AIAlbumPreviewGrid from "@/components/ai-album/AIAlbumPreviewGrid";

type WizardStep = "upload" | "size" | "preset" | "generate" | "preview";

const STEPS: { key: WizardStep; label: string; icon: React.ReactNode }[] = [
  { key: "upload", label: "Upload", icon: <Camera className="h-4 w-4" /> },
  { key: "size", label: "Size", icon: <BookOpen className="h-4 w-4" /> },
  { key: "preset", label: "Design", icon: <Palette className="h-4 w-4" /> },
  { key: "generate", label: "Generate", icon: <Wand2 className="h-4 w-4" /> },
  { key: "preview", label: "Preview", icon: <Eye className="h-4 w-4" /> },
];

const AI_BATCH_SIZE = 8;
const UPLOAD_CONCURRENCY = 5;

export default function AIAlbumBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<WizardStep>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(new Map());
  const [selectedSize, setSelectedSize] = useState<IndianAlbumSize>("12x36");
  const [selectedPreset, setSelectedPreset] = useState<DesignPreset>(DESIGN_PRESETS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [generationResult, setGenerationResult] = useState<AIAlbumGenerationResult | null>(null);
  const [savedAlbumId, setSavedAlbumId] = useState<string | null>(null);

  // Memory-safe thumbnail generation
  useEffect(() => {
    const newMap = new Map<string, string>();
    const toRevoke: string[] = [];

    // Only generate thumbnails for first 120 files
    files.slice(0, 120).forEach((f) => {
      const key = f.name + f.size;
      const existing = thumbnailUrls.get(key);
      if (existing) {
        newMap.set(key, existing);
      } else {
        const url = URL.createObjectURL(f);
        newMap.set(key, url);
      }
    });

    // Revoke old URLs no longer needed
    thumbnailUrls.forEach((url, key) => {
      if (!newMap.has(key)) toRevoke.push(url);
    });
    toRevoke.forEach((u) => URL.revokeObjectURL(u));

    setThumbnailUrls(newMap);

    return () => {
      // Don't revoke on unmount since we still use them
    };
  }, [files.length]); // intentionally only depend on length

  // Cleanup all URLs on unmount
  useEffect(() => {
    return () => {
      thumbnailUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  /* ─── File handling ─── */
  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const images = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/") && f.size < 30 * 1024 * 1024
    );
    if (images.length === 0) {
      toast.error("No valid image files found");
      return;
    }
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      const newFiles = images.filter((f) => !existing.has(f.name + f.size));
      if (newFiles.length < images.length) {
        toast.info(`${images.length - newFiles.length} duplicate(s) skipped`);
      }
      return [...prev, ...newFiles];
    });
  }, []);

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      const file = prev[idx];
      const key = file.name + file.size;
      const url = thumbnailUrls.get(key);
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  /* ─── Parallel upload ─── */
  const uploadPhotos = async (): Promise<string[]> => {
    if (!user) throw new Error("Not authenticated");
    const albumFolder = `${user.id}/ai-albums/${Date.now()}`;
    const urls: string[] = new Array(files.length).fill("");
    let completed = 0;

    const uploadOne = async (index: number) => {
      const file = files[index];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${albumFolder}/${index}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("gallery-photos")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`);

      const { data } = supabase.storage.from("gallery-photos").getPublicUrl(path);
      urls[index] = data.publicUrl;
      completed++;
      setProgress(Math.round((completed / files.length) * 35));
      setProgressLabel(`Uploading ${completed} of ${files.length} photos…`);
    };

    // Process in parallel batches
    for (let i = 0; i < files.length; i += UPLOAD_CONCURRENCY) {
      const batch = [];
      for (let j = i; j < Math.min(i + UPLOAD_CONCURRENCY, files.length); j++) {
        batch.push(uploadOne(j));
      }
      await Promise.all(batch);
    }

    return urls.filter(Boolean);
  };

  /* ─── AI Analysis ─── */
  const analyzePhotos = async (urls: string[]): Promise<PhotoAnalysis[]> => {
    const allAnalyses: PhotoAnalysis[] = [];
    const batches = Math.ceil(urls.length / AI_BATCH_SIZE);

    for (let b = 0; b < batches; b++) {
      const batchUrls = urls.slice(b * AI_BATCH_SIZE, (b + 1) * AI_BATCH_SIZE);
      setProgressLabel(`AI analyzing batch ${b + 1} of ${batches}…`);
      setProgress(35 + Math.round(((b + 1) / batches) * 35));

      try {
        const { data, error } = await supabase.functions.invoke("ai-album-analyze", {
          body: { photoUrls: batchUrls, batchIndex: b, batchSize: AI_BATCH_SIZE },
        });

        if (error) {
          console.error("Analysis error:", error);
          batchUrls.forEach((url) => allAnalyses.push(createFallbackAnalysis(url, allAnalyses.length)));
          continue;
        }

        if (data?.analyses && Array.isArray(data.analyses)) {
          allAnalyses.push(...data.analyses);
        } else {
          batchUrls.forEach((url) => allAnalyses.push(createFallbackAnalysis(url, allAnalyses.length)));
        }
      } catch (err) {
        console.error("Batch failed:", err);
        batchUrls.forEach((url) => allAnalyses.push(createFallbackAnalysis(url, allAnalyses.length)));
      }
    }

    return allAnalyses;
  };

  const createFallbackAnalysis = (url: string, index: number): PhotoAnalysis => {
    const moments: PhotoAnalysis["moment"][] = [
      "opening", "bride_preparation", "groom_preparation", "detail_shots",
      "ceremony", "couple_portraits", "family", "candid", "reception", "grand_finale",
    ];
    return {
      url,
      qualityScore: 60 + Math.random() * 30,
      sharpness: 65 + Math.random() * 25,
      composition: 65 + Math.random() * 25,
      moment: moments[index % moments.length],
      isDuplicate: false,
      isBestInGroup: true,
      faces: Math.floor(Math.random() * 4),
      emotion: ["joy", "love", "celebration", "serene"][index % 4],
      description: "Wedding moment",
    };
  };

  /* ─── Save to DB ─── */
  const saveAlbumToDb = async (result: AIAlbumGenerationResult): Promise<string> => {
    if (!user) throw new Error("Not authenticated");

    setProgressLabel("Creating album…");
    setProgress(80);

    const { data: album, error: albumError } = await supabase
      .from("albums")
      .insert({
        user_id: user.id,
        name: `AI Album — ${selectedPreset.name} — ${new Date().toLocaleDateString()}`,
        size: selectedSize,
        cover_type: "hardcover",
        leaf_count: Math.ceil(result.spreads.length / 2),
        page_count: result.spreads.length,
        status: "draft",
      })
      .select("id")
      .single();

    if (albumError || !album) throw new Error("Failed to create album");

    setProgressLabel("Building spreads…");
    setProgress(85);

    const pagesToInsert = result.spreads.map((s, i) => ({
      album_id: album.id,
      page_number: i,
      spread_index: Math.floor(i / 2),
      background_color: s.bgColor,
    }));

    const { data: pages, error: pagesError } = await supabase
      .from("album_pages")
      .insert(pagesToInsert)
      .select("id");

    if (pagesError || !pages) throw new Error("Failed to create pages");

    setProgressLabel("Placing photos on spreads…");
    setProgress(90);

    const allLayers: any[] = [];
    for (let i = 0; i < result.spreads.length; i++) {
      const spread = result.spreads[i];
      const pageId = pages[i]?.id;
      if (!pageId) continue;

      for (let j = 0; j < spread.photos.length; j++) {
        const photo = spread.photos[j];
        const cell = spread.layout.cells[j];
        if (!cell) continue;

        allLayers.push({
          page_id: pageId,
          layer_type: "photo",
          photo_id: null,
          text_content: null,
          x: 0, y: 0, width: 100, height: 100, rotation: 0, z_index: j,
          settings_json: {
            imageUrl: photo.url,
            offsetX: 0, offsetY: 0, scale: 1,
            layout: {
              gridCols: spread.layout.gridCols,
              gridRows: spread.layout.gridRows,
              cells: spread.layout.cells.map((c) => ({
                rowStart: c[0], colStart: c[1], rowEnd: c[2], colEnd: c[3],
              })),
            },
            cellIndex: j,
            moment: spread.moment,
            presetId: selectedPreset.id,
          },
        });
      }
    }

    if (allLayers.length > 0) {
      // Insert in chunks to avoid payload limits
      const CHUNK = 200;
      for (let i = 0; i < allLayers.length; i += CHUNK) {
        const chunk = allLayers.slice(i, i + CHUNK);
        const { error } = await supabase.from("album_layers").insert(chunk);
        if (error) throw error;
        setProgress(90 + Math.round(((i + CHUNK) / allLayers.length) * 8));
      }
    }

    return album.id;
  };

  /* ─── Main Generate ─── */
  const handleGenerate = async () => {
    if (!user || files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setGenerationResult(null);
    setSavedAlbumId(null);

    try {
      setProgressLabel("Uploading photos…");
      const urls = await uploadPhotos();

      setProgressLabel("AI analyzing photos…");
      const analyses = await analyzePhotos(urls);

      setProgressLabel("Generating album layout…");
      setProgress(72);
      const result = generateAlbumLayout(analyses, selectedPreset);

      setProgressLabel("Saving album…");
      const albumId = await saveAlbumToDb(result);

      setProgress(100);
      setProgressLabel(`Done! ${result.spreads.length} spreads, ${result.totalPhotosUsed} photos`);
      setGenerationResult(result);
      setSavedAlbumId(albumId);

      toast.success(`Album generated — ${result.spreads.length} spreads`, { duration: 4000 });

      // Auto advance to preview
      setTimeout(() => {
        setStep("preview");
        setIsProcessing(false);
      }, 1200);
    } catch (err: any) {
      console.error("Generation failed:", err);
      toast.error(err?.message || "Album generation failed");
      setIsProcessing(false);
      setProgress(0);
      setProgressLabel("");
    }
  };

  /* ─── Regenerate ─── */
  const handleRegenerate = async () => {
    if (!generationResult) return;
    // Delete old album
    if (savedAlbumId) {
      await supabase.from("albums").delete().eq("id", savedAlbumId);
    }
    setStep("generate");
    setTimeout(handleGenerate, 100);
  };

  /* ─── Navigation ─── */
  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const canNext =
    (step === "upload" && files.length >= 5) ||
    step === "size" ||
    step === "preset";

  const goNext = () => {
    const map: Record<string, WizardStep> = {
      upload: "size", size: "preset", preset: "generate",
    };
    if (map[step]) setStep(map[step]);
  };

  const goPrev = () => {
    const map: Record<string, WizardStep> = {
      size: "upload", preset: "size", generate: "preset", preview: "generate",
    };
    if (map[step]) setStep(map[step]);
  };

  /* ─── Stats for generate summary ─── */
  const estimatedSpreads = useMemo(() => {
    if (files.length <= 30) return 15;
    if (files.length <= 50) return 20;
    if (files.length <= 100) return 25;
    if (files.length <= 200) return 30;
    if (files.length <= 400) return 35;
    return 40;
  }, [files.length]);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* ─── Header ─── */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground">
              Mirror AI Album Builder
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload photos → Choose size & design → AI builds your album
          </p>
        </div>

        {/* ─── Steps ─── */}
        <div className="flex items-center justify-center gap-0.5 md:gap-1.5 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const isActive = i === stepIndex;
            const isDone = i < stepIndex;
            const isDisabled = i > stepIndex && !(i === stepIndex);

            return (
              <div key={s.key} className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => { if (isDone) setStep(s.key); }}
                  disabled={isDisabled}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all",
                    isActive && "bg-primary text-primary-foreground shadow-sm",
                    isDone && "bg-primary/15 text-primary cursor-pointer hover:bg-primary/25",
                    isDisabled && "bg-muted/50 text-muted-foreground/50"
                  )}
                >
                  {isDone ? <Check className="h-3 w-3" /> : s.icon}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "w-4 h-px",
                    isDone ? "bg-primary/40" : "bg-border"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        <Separator />

        {/* ═══════════ UPLOAD ═══════════ */}
        {step === "upload" && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              className="hidden"
              onChange={(e) => { handleFiles(e.target.files); if (e.target) e.target.value = ""; }}
            />

            <div
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all",
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border hover:border-primary/40 hover:bg-muted/20"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <p className="text-base font-medium text-foreground">
                Drop wedding photos here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse • JPG, PNG, WEBP
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                Minimum 5 photos • Best results with 100–500 photos
              </p>
            </div>

            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      {files.length} photo{files.length !== 1 ? "s" : ""} selected
                    </p>
                    {files.length < 5 && (
                      <Badge variant="destructive" className="text-[10px]">
                        Need at least 5
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="text-xs text-destructive h-7">
                    Clear all
                  </Button>
                </div>

                <ScrollArea className="h-44">
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5">
                    {files.slice(0, 120).map((f, i) => {
                      const key = f.name + f.size;
                      const url = thumbnailUrls.get(key);
                      return (
                        <div key={key} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                          {url && (
                            <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                            className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center"
                          >
                            <X className="h-3.5 w-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </div>
                      );
                    })}
                    {files.length > 120 && (
                      <div className="aspect-square rounded-lg bg-muted/60 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground font-medium">+{files.length - 120}</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Quick stats */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>~{estimatedSpreads} spreads</span>
                  <span>•</span>
                  <span>{(files.reduce((s, f) => s + f.size, 0) / (1024 * 1024)).toFixed(0)} MB total</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ SIZE ═══════════ */}
        {step === "size" && (
          <div className="space-y-3 animate-in fade-in-50 duration-300">
            <p className="text-sm font-medium text-foreground">
              Select print album size <span className="text-muted-foreground font-normal">(Indian standard sizes)</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.entries(INDIAN_ALBUM_SIZES) as [IndianAlbumSize, typeof INDIAN_ALBUM_SIZES["12x36"]][]).map(
                ([key, spec]) => {
                  const isSelected = selectedSize === key;
                  return (
                    <Card
                      key={key}
                      className={cn(
                        "p-4 cursor-pointer transition-all group",
                        isSelected
                          ? "ring-2 ring-primary bg-primary/5 shadow-md"
                          : "hover:bg-muted/40 hover:shadow-sm"
                      )}
                      onClick={() => setSelectedSize(key)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold font-serif text-foreground">{key}"</h3>
                        {isSelected && (
                          <div className="bg-primary rounded-full p-0.5"><Check className="h-3 w-3 text-primary-foreground" /></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{spec.label}</p>
                      <Badge variant="secondary" className="mt-2 text-[10px]">{spec.aspectLabel}</Badge>

                      {/* Proportional size preview */}
                      <div className="mt-3 flex justify-center">
                        <div
                          className={cn(
                            "border-2 rounded-[2px] transition-colors",
                            isSelected ? "border-primary bg-primary/10" : "border-foreground/15 group-hover:border-foreground/25"
                          )}
                          style={{
                            width: `${Math.min(140, spec.widthIn * 4.5)}px`,
                            height: `${Math.min(60, spec.heightIn * 4.5)}px`,
                          }}
                        />
                      </div>

                      <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
                        {spec.widthPx} × {spec.heightPx} px @ 300 DPI
                      </p>
                    </Card>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* ═══════════ PRESET ═══════════ */}
        {step === "preset" && (
          <div className="space-y-3 animate-in fade-in-50 duration-300">
            <p className="text-sm font-medium text-foreground">
              Choose a design preset
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {DESIGN_PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <Card
                    key={preset.id}
                    className={cn(
                      "p-0 cursor-pointer transition-all overflow-hidden group",
                      isSelected ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm"
                    )}
                    onClick={() => setSelectedPreset(preset)}
                  >
                    {/* Color header bar */}
                    <div className="h-12 relative flex" style={{ backgroundColor: preset.bgColor }}>
                      <div className="flex-1 flex items-center justify-center gap-2 px-3">
                        {/* Mini layout preview */}
                        <div className="flex gap-[2px] h-6" style={{ opacity: 0.7 }}>
                          <div className="w-4 h-6 rounded-[1px]" style={{ backgroundColor: preset.textColor }} />
                          <div className="flex flex-col gap-[1px]">
                            <div className="w-3 h-[11px] rounded-[1px]" style={{ backgroundColor: preset.accentColor }} />
                            <div className="w-3 h-[11px] rounded-[1px]" style={{ backgroundColor: preset.textColor }} />
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 bg-primary rounded-full p-0.5">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <h3 className="text-sm font-bold text-foreground">{preset.name}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{preset.description}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{preset.style}</Badge>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{preset.photoArrangement}</Badge>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{preset.fontFamily}</Badge>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════ GENERATE ═══════════ */}
        {step === "generate" && (
          <div className="max-w-md mx-auto space-y-6 text-center animate-in fade-in-50 duration-300">
            <Card className="p-6 space-y-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Wand2 className="h-7 w-7 text-primary" />
              </div>

              <div>
                <h2 className="text-lg font-serif font-bold text-foreground">
                  Ready to Build Your Album
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  AI will analyze, select & arrange your photos automatically
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-xl font-bold text-foreground">{files.length}</p>
                  <p className="text-[10px] text-muted-foreground">Photos</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-xl font-bold text-foreground">{selectedSize}"</p>
                  <p className="text-[10px] text-muted-foreground">{INDIAN_ALBUM_SIZES[selectedSize].aspectLabel}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-xs font-bold text-foreground leading-tight">{selectedPreset.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Design</p>
                </div>
              </div>

              <Separator />

              <div className="text-left space-y-1.5">
                {[
                  { icon: <Zap className="h-3 w-3" />, text: `~${estimatedSpreads} spreads in storytelling sequence` },
                  { icon: <ImageIcon className="h-3 w-3" />, text: "Duplicates & blurry photos auto-removed" },
                  { icon: <Layers className="h-3 w-3" />, text: "Full bleed, grids, hero & panoramic layouts" },
                  { icon: <Clock className="h-3 w-3" />, text: "Editable in album editor after generation" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-primary shrink-0">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </Card>

            {isProcessing ? (
              <div className="space-y-3 px-4">
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">{progressLabel}</p>
                </div>
                <p className="text-[10px] text-muted-foreground/60">{progress}%</p>
              </div>
            ) : (
              <Button size="lg" onClick={handleGenerate} className="gap-2 px-10 h-12 text-base shadow-lg">
                <Sparkles className="h-5 w-5" />
                Generate Album
              </Button>
            )}
          </div>
        )}

        {/* ═══════════ PREVIEW ═══════════ */}
        {step === "preview" && generationResult && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            {/* Stats bar */}
            <Card className="p-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-bold text-foreground">{generationResult.spreads.length} Spreads</span>
                  <span className="text-muted-foreground">{generationResult.totalPhotosUsed} photos used</span>
                  {generationResult.totalPhotosSkipped > 0 && (
                    <span className="text-muted-foreground/60">{generationResult.totalPhotosSkipped} skipped</span>
                  )}
                  <Badge variant="secondary" className="text-[10px]">
                    {generationResult.generationTimeMs.toFixed(0)}ms
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRegenerate} className="gap-1 h-8 text-xs">
                    <RefreshCw className="h-3 w-3" /> Regenerate
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => savedAlbumId && navigate(`/dashboard/album-designer/${savedAlbumId}/editor`)}
                    className="gap-1 h-8 text-xs"
                  >
                    Open in Editor <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Scrollable spread previews */}
            <ScrollArea className="h-[55vh]">
              <AIAlbumPreviewGrid
                spreads={generationResult.spreads}
                preset={selectedPreset}
              />
            </ScrollArea>

            {/* Bottom CTA */}
            <div className="flex justify-center pt-2">
              <Button
                size="lg"
                onClick={() => savedAlbumId && navigate(`/dashboard/album-designer/${savedAlbumId}/editor`)}
                className="gap-2 px-8"
              >
                Open Album Editor <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Navigation ─── */}
        {!isProcessing && step !== "preview" && (
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={goPrev} disabled={step === "upload"} className="gap-1 h-9">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            {step !== "generate" && (
              <Button onClick={goNext} disabled={!canNext} className="gap-1 h-9">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
