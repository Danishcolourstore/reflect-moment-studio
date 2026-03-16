import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import AIAlbumUploadStep from "@/components/ai-album/steps/AIAlbumUploadStep";
import AIAlbumDesignStep from "@/components/ai-album/steps/AIAlbumDesignStep";
import AIAlbumPreviewStep from "@/components/ai-album/steps/AIAlbumPreviewStep";
import AIAlbumProcessingOverlay from "@/components/ai-album/AIAlbumProcessingOverlay";
import {
  INDIAN_ALBUM_SIZES,
  DESIGN_PRESETS,
  type IndianAlbumSize,
  type DesignPreset,
  type PhotoAnalysis,
  type AIAlbumGenerationResult,
} from "@/components/ai-album/ai-album-types";
import { generateAlbumLayout } from "@/components/ai-album/ai-layout-engine";

type Step = "upload" | "design" | "preview";

const AI_BATCH_SIZE = 8;
const UPLOAD_CONCURRENCY = 5;

/** Determine best album size based on photo count */
function autoSelectSize(count: number): IndianAlbumSize {
  if (count <= 50) return "12x24";
  if (count <= 100) return "12x30";
  return "12x36";
}

export default function AIAlbumBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(new Map());
  const [selectedPreset, setSelectedPreset] = useState<DesignPreset>(DESIGN_PRESETS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [generationResult, setGenerationResult] = useState<AIAlbumGenerationResult | null>(null);
  const [savedAlbumId, setSavedAlbumId] = useState<string | null>(null);

  const autoSize = useMemo(() => autoSelectSize(files.length), [files.length]);

  // Thumbnail management
  useEffect(() => {
    const newMap = new Map<string, string>();
    const toRevoke: string[] = [];
    files.slice(0, 120).forEach((f) => {
      const key = f.name + f.size;
      const existing = thumbnailUrls.get(key);
      if (existing) newMap.set(key, existing);
      else newMap.set(key, URL.createObjectURL(f));
    });
    thumbnailUrls.forEach((url, key) => { if (!newMap.has(key)) toRevoke.push(url); });
    toRevoke.forEach((u) => URL.revokeObjectURL(u));
    setThumbnailUrls(newMap);
  }, [files.length]);

  useEffect(() => () => { thumbnailUrls.forEach((url) => URL.revokeObjectURL(url)); }, []);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const images = Array.from(fileList).filter((f) => f.type.startsWith("image/") && f.size < 30 * 1024 * 1024);
    if (!images.length) { toast.error("No valid images found"); return; }
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      const newFiles = images.filter((f) => !existing.has(f.name + f.size));
      if (newFiles.length < images.length) toast.info(`${images.length - newFiles.length} duplicate(s) skipped`);
      return [...prev, ...newFiles];
    });
  }, []);

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      const key = prev[idx].name + prev[idx].size;
      const url = thumbnailUrls.get(key);
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ── Upload photos to storage ──
  const uploadPhotos = async (): Promise<string[]> => {
    if (!user) throw new Error("Not authenticated");
    const folder = `${user.id}/ai-albums/${Date.now()}`;
    const urls: string[] = new Array(files.length).fill("");
    let done = 0;
    const uploadOne = async (i: number) => {
      const file = files[i];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${folder}/${i}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("gallery-photos").upload(path, file, { contentType: file.type });
      if (error) throw error;
      urls[i] = supabase.storage.from("gallery-photos").getPublicUrl(path).data.publicUrl;
      done++;
      setProgress(Math.round((done / files.length) * 30));
      setProgressLabel(`Uploading ${done}/${files.length}…`);
    };
    for (let i = 0; i < files.length; i += UPLOAD_CONCURRENCY) {
      const batch = [];
      for (let j = i; j < Math.min(i + UPLOAD_CONCURRENCY, files.length); j++) batch.push(uploadOne(j));
      await Promise.all(batch);
    }
    return urls.filter(Boolean);
  };

  // ── AI Analysis ──
  const analyzePhotos = async (urls: string[]): Promise<PhotoAnalysis[]> => {
    const all: PhotoAnalysis[] = [];
    const batches = Math.ceil(urls.length / AI_BATCH_SIZE);
    for (let b = 0; b < batches; b++) {
      const batch = urls.slice(b * AI_BATCH_SIZE, (b + 1) * AI_BATCH_SIZE);
      setProgressLabel(`AI analyzing ${b + 1}/${batches}…`);
      setProgress(30 + Math.round(((b + 1) / batches) * 35));
      try {
        const { data, error } = await supabase.functions.invoke("ai-album-analyze", {
          body: { photoUrls: batch, batchIndex: b, batchSize: AI_BATCH_SIZE },
        });
        if (!error && data?.analyses) all.push(...data.analyses);
        else batch.forEach((url) => all.push(fallback(url, all.length)));
      } catch { batch.forEach((url) => all.push(fallback(url, all.length))); }
    }
    return all;
  };

  const fallback = (url: string, i: number): PhotoAnalysis => {
    const moments: PhotoAnalysis["moment"][] = ["opening","bride_preparation","groom_preparation","detail_shots","ceremony","couple_portraits","family","candid","reception","grand_finale"];
    return { url, qualityScore: 60 + Math.random() * 30, sharpness: 65 + Math.random() * 25, composition: 65 + Math.random() * 25, moment: moments[i % moments.length], isDuplicate: false, isBestInGroup: true, faces: Math.floor(Math.random() * 4), emotion: ["joy","love","celebration","serene"][i % 4], description: "" };
  };

  // ── Save to DB ──
  const saveAlbumToDb = async (result: AIAlbumGenerationResult): Promise<string> => {
    if (!user) throw new Error("Not authenticated");
    setProgressLabel("Creating album…"); setProgress(75);
    const { data: album, error } = await supabase.from("albums").insert({ user_id: user.id, name: `AI Album — ${selectedPreset.name}`, size: autoSize, cover_type: "hardcover", leaf_count: Math.ceil(result.spreads.length / 2), page_count: result.spreads.length, status: "draft" }).select("id").single();
    if (error || !album) throw new Error("Failed to create album");
    setProgressLabel("Building pages…"); setProgress(80);
    const pages = result.spreads.map((s, i) => ({ album_id: album.id, page_number: i, spread_index: Math.floor(i / 2), background_color: s.bgColor }));
    const { data: dbPages, error: pErr } = await supabase.from("album_pages").insert(pages).select("id");
    if (pErr || !dbPages) throw new Error("Failed to create pages");
    setProgressLabel("Placing photos…"); setProgress(85);
    const layers: any[] = [];
    result.spreads.forEach((s, i) => {
      const pid = dbPages[i]?.id; if (!pid) return;
      s.photos.forEach((photo, j) => {
        const cell = s.layout.cells[j]; if (!cell) return;
        layers.push({ page_id: pid, layer_type: "photo", photo_id: null, text_content: null, x: 0, y: 0, width: 100, height: 100, rotation: 0, z_index: j, settings_json: { imageUrl: photo.url, offsetX: 0, offsetY: 0, scale: 1, layout: { gridCols: s.layout.gridCols, gridRows: s.layout.gridRows, cells: s.layout.cells.map((c) => ({ rowStart: c[0], colStart: c[1], rowEnd: c[2], colEnd: c[3] })) }, cellIndex: j, moment: s.moment, presetId: selectedPreset.id } });
      });
    });
    for (let i = 0; i < layers.length; i += 200) {
      const { error: e } = await supabase.from("album_layers").insert(layers.slice(i, i + 200));
      if (e) throw e;
      setProgress(85 + Math.round(((i + 200) / layers.length) * 12));
    }
    return album.id;
  };

  // ── Generate ──
  const handleGenerate = async () => {
    if (!user || files.length < 5) return;
    setIsProcessing(true); setProgress(0); setGenerationResult(null); setSavedAlbumId(null);
    try {
      const urls = await uploadPhotos();
      const analyses = await analyzePhotos(urls);
      setProgressLabel("Generating layout…"); setProgress(68);
      const result = generateAlbumLayout(analyses, selectedPreset);
      const albumId = await saveAlbumToDb(result);
      setProgress(100); setProgressLabel("Album ready!");
      setGenerationResult(result); setSavedAlbumId(albumId);
      toast.success(`Album created — ${result.spreads.length} spreads`);
      setTimeout(() => { setStep("preview"); setIsProcessing(false); }, 800);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Generation failed");
      setIsProcessing(false); setProgress(0);
    }
  };

  const handleRegenerate = async () => {
    if (savedAlbumId) await supabase.from("albums").delete().eq("id", savedAlbumId);
    handleGenerate();
  };

  const estimatedSpreads = useMemo(() => {
    if (files.length <= 30) return 15; if (files.length <= 50) return 20;
    if (files.length <= 100) return 25; if (files.length <= 200) return 30;
    return Math.min(40, Math.round(files.length / 10));
  }, [files.length]);

  return (
    <DashboardLayout>
      <div className="relative min-h-[calc(100vh-140px)]">
        {/* Processing overlay */}
        {isProcessing && (
          <AIAlbumProcessingOverlay progress={progress} label={progressLabel} />
        )}

        {/* Step: Upload */}
        {step === "upload" && (
          <AIAlbumUploadStep
            files={files}
            thumbnailUrls={thumbnailUrls}
            onFilesAdded={handleFiles}
            onRemoveFile={removeFile}
            onClearAll={() => setFiles([])}
            estimatedSpreads={estimatedSpreads}
            autoSize={autoSize}
            onContinue={() => setStep("design")}
          />
        )}

        {/* Step: Design Presets */}
        {step === "design" && (
          <AIAlbumDesignStep
            presets={DESIGN_PRESETS}
            selectedPreset={selectedPreset}
            onSelectPreset={setSelectedPreset}
            photoCount={files.length}
            estimatedSpreads={estimatedSpreads}
            autoSize={autoSize}
            onBack={() => setStep("upload")}
            onGenerate={handleGenerate}
          />
        )}

        {/* Step: Preview & Edit */}
        {step === "preview" && generationResult && (
          <AIAlbumPreviewStep
            result={generationResult}
            preset={selectedPreset}
            albumId={savedAlbumId}
            onRegenerate={handleRegenerate}
            onEditInEditor={() => savedAlbumId && navigate(`/dashboard/album-designer/${savedAlbumId}/editor`)}
            onBack={() => setStep("design")}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
