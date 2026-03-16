import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ImageIcon,
  Wand2,
  BookOpen,
  Loader2,
} from "lucide-react";
import {
  INDIAN_ALBUM_SIZES,
  DESIGN_PRESETS,
  type IndianAlbumSize,
  type DesignPreset,
  type PhotoAnalysis,
} from "@/components/ai-album/ai-album-types";
import { generateAlbumLayout } from "@/components/ai-album/ai-layout-engine";

type WizardStep = "upload" | "size" | "preset" | "generate";

const STEPS: { key: WizardStep; label: string; icon: React.ReactNode }[] = [
  { key: "upload", label: "Upload Photos", icon: <Upload className="h-4 w-4" /> },
  { key: "size", label: "Album Size", icon: <BookOpen className="h-4 w-4" /> },
  { key: "preset", label: "Design Preset", icon: <Sparkles className="h-4 w-4" /> },
  { key: "generate", label: "Generate", icon: <Wand2 className="h-4 w-4" /> },
];

const AI_BATCH_SIZE = 10;

export default function AIAlbumBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<WizardStep>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<IndianAlbumSize>("12x36");
  const [selectedPreset, setSelectedPreset] = useState<DesignPreset>(DESIGN_PRESETS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  /* ─── File handling ─── */
  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const images = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...images.filter((f) => !existing.has(f.name + f.size))];
    });
  }, []);

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  /* ─── Upload photos to storage ─── */
  const uploadPhotos = async (): Promise<string[]> => {
    if (!user) throw new Error("Not authenticated");
    const urls: string[] = [];
    const albumFolder = `${user.id}/ai-albums/${Date.now()}`;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${albumFolder}/${i}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("gallery-photos")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (error) throw new Error(`Upload failed: ${error.message}`);

      const { data } = supabase.storage.from("gallery-photos").getPublicUrl(path);
      urls.push(data.publicUrl);

      setProgress(Math.round(((i + 1) / files.length) * 40));
      setProgressLabel(`Uploading ${i + 1} of ${files.length} photos…`);
    }

    return urls;
  };

  /* ─── AI Analysis ─── */
  const analyzePhotos = async (urls: string[]): Promise<PhotoAnalysis[]> => {
    const allAnalyses: PhotoAnalysis[] = [];
    const batches = Math.ceil(urls.length / AI_BATCH_SIZE);

    for (let b = 0; b < batches; b++) {
      const batchUrls = urls.slice(b * AI_BATCH_SIZE, (b + 1) * AI_BATCH_SIZE);
      setProgressLabel(`AI analyzing batch ${b + 1} of ${batches}…`);
      setProgress(40 + Math.round(((b + 1) / batches) * 35));

      try {
        const { data, error } = await supabase.functions.invoke("ai-album-analyze", {
          body: { photoUrls: batchUrls, batchIndex: b, batchSize: AI_BATCH_SIZE },
        });

        if (error) {
          console.error("Analysis error:", error);
          // Fallback for this batch
          for (const url of batchUrls) {
            allAnalyses.push(createFallbackAnalysis(url, allAnalyses.length));
          }
          continue;
        }

        if (data?.analyses && Array.isArray(data.analyses)) {
          allAnalyses.push(...data.analyses);
        }
      } catch (err) {
        console.error("Batch analysis failed:", err);
        for (const url of batchUrls) {
          allAnalyses.push(createFallbackAnalysis(url, allAnalyses.length));
        }
      }
    }

    return allAnalyses;
  };

  const createFallbackAnalysis = (url: string, index: number): PhotoAnalysis => {
    const moments: PhotoAnalysis["moment"][] = [
      "bride_preparation", "groom_preparation", "detail_shots",
      "ceremony", "couple_portraits", "family", "candid", "reception",
    ];
    return {
      url,
      qualityScore: 65 + Math.random() * 25,
      sharpness: 70 + Math.random() * 20,
      composition: 70 + Math.random() * 20,
      moment: moments[index % moments.length],
      isDuplicate: false,
      isBestInGroup: true,
      faces: Math.floor(Math.random() * 3),
      emotion: "joy",
      description: "Wedding photo",
    };
  };

  /* ─── Save to DB ─── */
  const saveAlbumToDb = async (
    analyses: PhotoAnalysis[],
    result: ReturnType<typeof generateAlbumLayout>
  ) => {
    if (!user) throw new Error("Not authenticated");

    setProgressLabel("Creating album…");
    setProgress(80);

    const sizeSpec = INDIAN_ALBUM_SIZES[selectedSize];

    // Create album record
    const { data: album, error: albumError } = await supabase
      .from("albums")
      .insert({
        user_id: user.id,
        name: `AI Album — ${new Date().toLocaleDateString()}`,
        size: selectedSize,
        cover_type: "hardcover",
        leaf_count: Math.ceil(result.spreads.length / 2),
        page_count: result.spreads.length,
        status: "draft",
      })
      .select("id")
      .single();

    if (albumError || !album) throw new Error("Failed to create album");

    setProgressLabel("Building pages…");
    setProgress(85);

    // Create pages
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

    setProgressLabel("Placing photos…");
    setProgress(90);

    // Create layers for each page
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
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          z_index: j,
          settings_json: {
            imageUrl: photo.url,
            offsetX: 0,
            offsetY: 0,
            scale: 1,
            layout: {
              gridCols: spread.layout.gridCols,
              gridRows: spread.layout.gridRows,
              cells: spread.layout.cells.map((c) => ({
                rowStart: c[0],
                colStart: c[1],
                rowEnd: c[2],
                colEnd: c[3],
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
      const { error: layersError } = await supabase
        .from("album_layers")
        .insert(allLayers);
      if (layersError) throw layersError;
    }

    return album.id;
  };

  /* ─── Main Generate ─── */
  const handleGenerate = async () => {
    if (!user || files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Step 1: Upload
      setProgressLabel("Uploading photos…");
      const urls = await uploadPhotos();
      setUploadedUrls(urls);

      // Step 2: AI Analysis
      setProgressLabel("AI analyzing photos…");
      const analyses = await analyzePhotos(urls);

      // Step 3: Generate layout
      setProgressLabel("Generating album layout…");
      setProgress(75);
      const result = generateAlbumLayout(analyses, selectedPreset);

      // Step 4: Save to DB
      const albumId = await saveAlbumToDb(analyses, result);

      setProgress(100);
      setProgressLabel(
        `Done! ${result.spreads.length} spreads, ${result.totalPhotosUsed} photos used`
      );

      toast.success(
        `AI Album generated — ${result.spreads.length} spreads from ${result.totalPhotosUsed} photos`,
        { duration: 5000 }
      );

      // Navigate to album editor after brief delay
      setTimeout(() => {
        navigate(`/dashboard/album-designer/${albumId}/editor`);
      }, 2000);
    } catch (err: any) {
      console.error("Generation failed:", err);
      toast.error(err?.message || "Album generation failed");
      setIsProcessing(false);
      setProgress(0);
      setProgressLabel("");
    }
  };

  /* ─── Step navigation ─── */
  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const canNext =
    (step === "upload" && files.length > 0) ||
    step === "size" ||
    step === "preset";

  const goNext = () => {
    if (step === "upload") setStep("size");
    else if (step === "size") setStep("preset");
    else if (step === "preset") setStep("generate");
  };

  const goPrev = () => {
    if (step === "size") setStep("upload");
    else if (step === "preset") setStep("size");
    else if (step === "generate") setStep("preset");
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
            AI Album Builder
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Upload your photos and let AI create a complete print-ready wedding album automatically.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-1 md:gap-2">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (i < stepIndex) setStep(s.key);
                }}
                disabled={i > stepIndex}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  i === stepIndex
                    ? "bg-primary text-primary-foreground"
                    : i < stepIndex
                    ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i < stepIndex ? <Check className="h-3 w-3" /> : s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* ─── Step: Upload ─── */}
        {step === "upload" && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div
              className={cn(
                "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
            >
              <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-base font-medium text-foreground">
                Drop wedding photos here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WEBP • Upload 50–1000 photos for best results
              </p>
            </div>

            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {files.length} photo{files.length !== 1 ? "s" : ""} selected
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiles([])}
                    className="text-xs text-destructive"
                  >
                    Clear all
                  </Button>
                </div>
                <ScrollArea className="h-48">
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {files.slice(0, 100).map((f, i) => (
                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={URL.createObjectURL(f)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(i);
                          }}
                          className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}
                    {files.length > 100 && (
                      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          +{files.length - 100} more
                        </span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        {/* ─── Step: Size ─── */}
        {step === "size" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(Object.entries(INDIAN_ALBUM_SIZES) as [IndianAlbumSize, typeof INDIAN_ALBUM_SIZES["12x36"]][]).map(
              ([key, spec]) => (
                <Card
                  key={key}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:shadow-md",
                    selectedSize === key
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-muted/40"
                  )}
                  onClick={() => setSelectedSize(key)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base font-bold font-serif text-foreground">{key}"</h3>
                    {selectedSize === key && (
                      <div className="bg-primary rounded-full p-0.5">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{spec.label}</p>
                  <Badge variant="secondary" className="mt-2 text-[10px]">
                    {spec.aspectLabel}
                  </Badge>
                  {/* Visual aspect ratio preview */}
                  <div className="mt-3 flex justify-center">
                    <div
                      className={cn(
                        "border-2 border-foreground/20 rounded-sm",
                        selectedSize === key ? "border-primary" : ""
                      )}
                      style={{
                        width: `${Math.min(120, spec.widthIn * 4)}px`,
                        height: `${Math.min(60, spec.heightIn * 4)}px`,
                      }}
                    />
                  </div>
                </Card>
              )
            )}
          </div>
        )}

        {/* ─── Step: Preset ─── */}
        {step === "preset" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {DESIGN_PRESETS.map((preset) => (
              <Card
                key={preset.id}
                className={cn(
                  "p-4 cursor-pointer transition-all hover:shadow-md overflow-hidden",
                  selectedPreset.id === preset.id
                    ? "ring-2 ring-primary"
                    : "hover:bg-muted/40"
                )}
                onClick={() => setSelectedPreset(preset)}
              >
                {/* Color preview strip */}
                <div className="flex gap-1 mb-3">
                  <div
                    className="h-8 flex-1 rounded-sm"
                    style={{ backgroundColor: preset.bgColor }}
                  />
                  <div
                    className="h-8 w-8 rounded-sm"
                    style={{ backgroundColor: preset.accentColor }}
                  />
                  <div
                    className="h-8 w-8 rounded-sm"
                    style={{ backgroundColor: preset.textColor }}
                  />
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{preset.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {preset.description}
                    </p>
                  </div>
                  {selectedPreset.id === preset.id && (
                    <div className="bg-primary rounded-full p-0.5 shrink-0">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex gap-1 mt-2">
                  <Badge variant="outline" className="text-[9px]">{preset.style}</Badge>
                  <Badge variant="outline" className="text-[9px]">{preset.photoArrangement}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ─── Step: Generate ─── */}
        {step === "generate" && (
          <div className="max-w-lg mx-auto space-y-6 text-center">
            {/* Summary */}
            <Card className="p-6 space-y-4">
              <Wand2 className="h-10 w-10 mx-auto text-primary" />
              <h2 className="text-lg font-serif font-bold text-foreground">
                Ready to Generate
              </h2>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">{files.length}</p>
                  <p className="text-xs text-muted-foreground">Photos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{selectedSize}"</p>
                  <p className="text-xs text-muted-foreground">Album Size</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{selectedPreset.name}</p>
                  <p className="text-xs text-muted-foreground">Design Preset</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• AI will analyze all photos for quality, faces & moments</p>
                <p>• Best photos selected, duplicates removed</p>
                <p>• 20–40 spreads generated in storytelling sequence</p>
                <p>• You can edit the result in the album editor</p>
              </div>
            </Card>

            {isProcessing ? (
              <div className="space-y-3">
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">{progressLabel}</p>
                </div>
                <p className="text-xs text-muted-foreground">{progress}%</p>
              </div>
            ) : (
              <Button
                size="lg"
                onClick={handleGenerate}
                className="gap-2 px-8"
              >
                <Sparkles className="h-5 w-5" />
                Generate Album with AI
              </Button>
            )}
          </div>
        )}

        {/* ─── Navigation ─── */}
        {!isProcessing && (
          <div className="flex justify-between pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={step === "upload"}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>

            {step !== "generate" ? (
              <Button onClick={goNext} disabled={!canNext} className="gap-1">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
