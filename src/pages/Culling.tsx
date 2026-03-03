import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Sparkles, Upload, CheckCircle, AlertTriangle, XCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type CulledPhoto = {
  file: File;
  url: string;
  rating: "best" | "maybe" | "reject" | null;
  reason: string;
  sharpness: number;
  exposure: number;
  composition: number;
  eyes_open: boolean | null;
  duplicate_risk: boolean;
  analyzing: boolean;
  error: boolean;
};

export default function Culling() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<CulledPhoto[]>([]);
  const [activeTab, setActiveTab] = useState<"best" | "maybe" | "reject">("best");
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFiles = useCallback((files: FileList | File[]) => {
    const valid = Array.from(files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 20 * 1024 * 1024
    );
    if (valid.length === 0) {
      toast.error("Only JPG, PNG, WEBP under 20MB accepted");
      return;
    }
    const newPhotos: CulledPhoto[] = valid.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      rating: null,
      reason: "",
      sharpness: 0,
      exposure: 0,
      composition: 0,
      eyes_open: null,
      duplicate_risk: false,
      analyzing: false,
      error: false,
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  }, []);

  const startCulling = async () => {
    const unanalyzed = photos.filter((p) => p.rating === null && !p.analyzing);
    if (unanalyzed.length === 0) return;

    setAnalyzing(true);
    setProgress({ current: 0, total: unanalyzed.length });

    for (let i = 0; i < unanalyzed.length; i++) {
      const photo = unanalyzed[i];
      const idx = photos.indexOf(photo);
      setProgress({ current: i + 1, total: unanalyzed.length });

      setPhotos((prev) => prev.map((p, j) => (j === idx ? { ...p, analyzing: true } : p)));

      try {
        // Upload to temp storage for AI analysis
        const ext = photo.file.name.split(".").pop() || "jpg";
        const path = `culling/${user?.id}/${Date.now()}_${i}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("gallery-photos").upload(path, photo.file);
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from("gallery-photos").getPublicUrl(path);

        const { data, error } = await supabase.functions.invoke("ai-culling", {
          body: { imageUrl: urlData.publicUrl, fileName: photo.file.name },
        });

        if (error) throw error;

        setPhotos((prev) =>
          prev.map((p, j) =>
            j === idx
              ? {
                  ...p,
                  rating: data.rating || "maybe",
                  reason: data.reason || "",
                  sharpness: data.sharpness || 50,
                  exposure: data.exposure || 50,
                  composition: data.composition || 50,
                  eyes_open: data.eyes_open ?? null,
                  duplicate_risk: data.duplicate_risk ?? false,
                  analyzing: false,
                  error: false,
                }
              : p
          )
        );
      } catch (err) {
        console.error("Culling error:", err);
        setPhotos((prev) =>
          prev.map((p, j) => (j === idx ? { ...p, analyzing: false, error: true } : p))
        );
      }
    }

    setAnalyzing(false);
    toast.success("AI culling complete!");
  };

  const retryPhoto = async (idx: number) => {
    const photo = photos[idx];
    setPhotos((prev) => prev.map((p, j) => (j === idx ? { ...p, analyzing: true, error: false } : p)));

    try {
      const ext = photo.file.name.split(".").pop() || "jpg";
      const path = `culling/${user?.id}/${Date.now()}_retry.${ext}`;
      await supabase.storage.from("gallery-photos").upload(path, photo.file);
      const { data: urlData } = supabase.storage.from("gallery-photos").getPublicUrl(path);

      const { data, error } = await supabase.functions.invoke("ai-culling", {
        body: { imageUrl: urlData.publicUrl, fileName: photo.file.name },
      });
      if (error) throw error;

      setPhotos((prev) =>
        prev.map((p, j) =>
          j === idx
            ? { ...p, ...data, analyzing: false, error: false }
            : p
        )
      );
    } catch {
      setPhotos((prev) => prev.map((p, j) => (j === idx ? { ...p, analyzing: false, error: true } : p)));
      toast.error("Retry failed");
    }
  };

  const movePhoto = (idx: number, newRating: "best" | "maybe" | "reject") => {
    setPhotos((prev) => prev.map((p, j) => (j === idx ? { ...p, rating: newRating } : p)));
  };

  const filtered = photos.filter((p) => p.rating === activeTab);
  const counts = {
    best: photos.filter((p) => p.rating === "best").length,
    maybe: photos.filter((p) => p.rating === "maybe").length,
    reject: photos.filter((p) => p.rating === "reject").length,
  };

  const ratingColor = (r: string) =>
    r === "best" ? "text-primary" : r === "reject" ? "text-destructive" : "text-amber-500 dark:text-amber-400";

  const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-20">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[11px] text-muted-foreground w-8 text-right">{value}</span>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-5 pb-24 max-w-3xl mx-auto">
        <h1 className="font-serif text-foreground mb-1" style={{ fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 400 }}>
          AI Culling
        </h1>
        <p className="font-serif italic text-muted-foreground mb-6" style={{ fontSize: 15 }}>
          Let AI find your best shots
        </p>

        {/* Upload zone */}
        {photos.length === 0 && (
          <label
            className="flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed border-primary/40 bg-card cursor-pointer hover:border-primary/60 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <Upload className="h-12 w-12 text-primary" strokeWidth={1.2} />
            <p className="font-serif italic text-foreground" style={{ fontSize: 22 }}>Drop your photos here</p>
            <p className="text-muted-foreground" style={{ fontSize: 13 }}>JPG, PNG, WEBP up to 20MB</p>
            <span className="inline-flex items-center h-11 px-6 rounded-lg bg-primary text-primary-foreground font-sans" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Browse Files
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
          </label>
        )}

        {/* Photos loaded — start culling */}
        {photos.length > 0 && !analyzing && photos.some((p) => p.rating === null && !p.error) && (
          <div className="flex flex-col items-center gap-4 mb-6">
            <p className="text-muted-foreground" style={{ fontSize: 14 }}>
              {photos.filter((p) => p.rating === null).length} photos ready to analyze
            </p>
            <button
              onClick={startCulling}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-lg bg-primary text-primary-foreground font-sans transition-opacity hover:opacity-90"
              style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}
            >
              <Sparkles className="h-4 w-4" />
              Start AI Culling
            </button>
            <label className="text-primary underline cursor-pointer" style={{ fontSize: 12 }}>
              + Add more photos
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
            </label>
          </div>
        )}

        {/* Progress */}
        {analyzing && (
          <div className="mb-6 space-y-2">
            <p className="text-foreground" style={{ fontSize: 15 }}>
              Analyzing photo {progress.current} of {progress.total}...
            </p>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Results tabs */}
        {photos.some((p) => p.rating !== null) && (
          <>
            <div className="flex gap-1 mb-4 border-b border-border">
              {(["best", "maybe", "reject"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors font-sans ${activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
                  style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" }}
                >
                  {tab === "best" && <CheckCircle className="h-3.5 w-3.5" />}
                  {tab === "maybe" && <AlertTriangle className="h-3.5 w-3.5" />}
                  {tab === "reject" && <XCircle className="h-3.5 w-3.5" />}
                  {tab}
                  <span className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{counts[tab]}</span>
                </button>
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12 font-serif italic" style={{ fontSize: 18 }}>
                No photos in this category
              </p>
            )}

            <div className="grid gap-4">
              {filtered.map((photo, i) => {
                const realIdx = photos.indexOf(photo);
                return (
                  <div key={realIdx} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex gap-4 p-4">
                      <img src={photo.url} alt={photo.file.name} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-foreground truncate" style={{ fontSize: 14, fontWeight: 500 }}>{photo.file.name}</p>
                          <span className={`font-sans font-bold uppercase text-[10px] tracking-wider ${ratingColor(photo.rating!)}`}>
                            {photo.rating}
                          </span>
                        </div>
                        <p className="text-muted-foreground font-serif italic" style={{ fontSize: 12 }}>{photo.reason}</p>
                        <div className="space-y-1">
                          <ScoreBar label="Sharpness" value={photo.sharpness} />
                          <ScoreBar label="Exposure" value={photo.exposure} />
                          <ScoreBar label="Composition" value={photo.composition} />
                        </div>
                        <div className="flex gap-2 pt-1">
                          {(["best", "maybe", "reject"] as const).filter((r) => r !== photo.rating).map((r) => (
                            <button
                              key={r}
                              onClick={() => movePhoto(realIdx, r)}
                              className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                            >
                              → {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Error photos */}
        {photos.some((p) => p.error) && (
          <div className="mt-4 space-y-2">
            <p className="text-destructive font-sans" style={{ fontSize: 12, fontWeight: 600 }}>Failed to analyze:</p>
            {photos.map((p, i) =>
              p.error ? (
                <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
                  <img src={p.url} alt="" className="w-10 h-10 object-cover rounded" />
                  <span className="flex-1 truncate text-muted-foreground" style={{ fontSize: 13 }}>{p.file.name}</span>
                  <button onClick={() => retryPhoto(i)} className="flex items-center gap-1 text-primary" style={{ fontSize: 11 }}>
                    <RotateCcw className="h-3 w-3" /> Retry
                  </button>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
