import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FolderArchive, Link2, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlbumData } from "@/hooks/use-album-editor";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  album: AlbumData;
  onComplete: () => Promise<void>;
}

const TEMPLATES = {
  fullBleed: { gridCols: 1, gridRows: 1, cells: [[1, 1, 2, 2]] },
  hSplit: {
    gridCols: 2,
    gridRows: 1,
    cells: [
      [1, 1, 2, 2],
      [1, 2, 2, 3],
    ],
  },
  vSplit: {
    gridCols: 1,
    gridRows: 2,
    cells: [
      [1, 1, 2, 2],
      [2, 1, 3, 2],
    ],
  },
  story: {
    gridCols: 2,
    gridRows: 3,
    cells: [
      [1, 1, 3, 3],
      [3, 1, 4, 2],
      [3, 2, 4, 3],
    ],
  },
  collage: {
    gridCols: 2,
    gridRows: 2,
    cells: [
      [1, 1, 2, 2],
      [1, 2, 2, 3],
      [2, 1, 3, 2],
      [2, 2, 3, 3],
    ],
  },
};

function pickTemplate(
  remaining: number,
  pageNum: number
): { template: (typeof TEMPLATES)["fullBleed"]; count: number } {
  if (remaining === 1) return { template: TEMPLATES.fullBleed, count: 1 };
  if (remaining === 2) return { template: TEMPLATES.hSplit, count: 2 };
  if (remaining === 3) return { template: TEMPLATES.story, count: 3 };
  if (remaining >= 4 && pageNum % 3 === 0)
    return { template: TEMPLATES.collage, count: 4 };
  if (pageNum % 2 === 0) return { template: TEMPLATES.hSplit, count: 2 };
  return { template: TEMPLATES.story, count: 3 };
}

// Upload a file to Supabase storage and return public URL
async function uploadFileToStorage(file: File, albumId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/albums/${albumId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("gallery-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = supabase.storage.from("gallery-photos").getPublicUrl(path);
  return data.publicUrl;
}

export default function AlbumAutoLayoutDialog({
  open,
  onOpenChange,
  album,
  onComplete,
}: Props) {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploadTab, setUploadTab] = useState<"event" | "photos" | "zip">("event");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setRunning(false);
    setStep("");
    setProgress(0);
    setSelectedFiles([]);
  };

  // ── Extract images from ZIP ──
  const extractImagesFromZip = async (zipFile: File): Promise<File[]> => {
    // Dynamically import JSZip only when needed
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(zipFile);
    const imageFiles: File[] = [];
    const imageExts = ["jpg", "jpeg", "png", "webp", "heic"];

    await Promise.all(
      Object.entries(zip.files).map(async ([name, zipEntry]) => {
        if (zipEntry.dir) return;
        const ext = name.split(".").pop()?.toLowerCase() || "";
        if (!imageExts.includes(ext)) return;
        const blob = await zipEntry.async("blob");
        const file = new File([blob], name.split("/").pop() || name, {
          type: `image/${ext === "jpg" ? "jpeg" : ext}`,
        });
        imageFiles.push(file);
      })
    );

    // Sort by filename for consistent ordering
    return imageFiles.sort((a, b) => a.name.localeCompare(b.name));
  };

  // ── Handle file selection ──
  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const images = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    setSelectedFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...images.filter((f) => !names.has(f.name))];
    });
  };

  const handleZipSelected = async (files: FileList | null) => {
    if (!files?.[0]) return;
    setStep("Reading ZIP file…");
    try {
      const images = await extractImagesFromZip(files[0]);
      if (images.length === 0) {
        toast.error("No images found in ZIP file");
        return;
      }
      setSelectedFiles(images);
      toast.success(`Found ${images.length} photos in ZIP`);
    } catch {
      toast.error("Failed to read ZIP file");
    } finally {
      setStep("");
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Core: build album pages from photo URLs ──
  const buildAlbumFromPhotos = async (
    photos: { id?: string; url: string }[]
  ) => {
    setStep("Clearing existing pages…");
    setProgress(10);

    const { data: existingPages } = await supabase
      .from("album_pages")
      .select("id")
      .eq("album_id", album.id);

    const pageIds = (existingPages || []).map((p) => p.id);
    if (pageIds.length) {
      await supabase.from("album_layers").delete().in("page_id", pageIds);
      await supabase.from("album_pages").delete().eq("album_id", album.id);
    }

    setStep("Building layout…");
    setProgress(40);

    const pagesToInsert: Array<{
      album_id: string;
      page_number: number;
      spread_index: number;
    }> = [];
    const layersBatch: Array<{ pageIndex: number; layers: any[] }> = [];

    // Cover page — first photo full bleed
    pagesToInsert.push({ album_id: album.id, page_number: 0, spread_index: 0 });
    layersBatch.push({
      pageIndex: 0,
      layers: [
        {
          layer_type: "photo",
          photo_id: photos[0].id || null,
          text_content: null,
          x: 0, y: 0, width: 100, height: 100, rotation: 0, z_index: 0,
          settings_json: {
            imageUrl: photos[0].url,
            offsetX: 0, offsetY: 0, scale: 1,
            layout: TEMPLATES.fullBleed,
          },
        },
      ],
    });

    let photoIdx = 1;
    let pageNum = 2;

    while (photoIdx < photos.length) {
      const remaining = photos.length - photoIdx;
      const { template, count } = pickTemplate(remaining, pageNum);
      const actualCount = Math.min(count, remaining);

      pagesToInsert.push({
        album_id: album.id,
        page_number: pageNum,
        spread_index: Math.ceil(pageNum / 2),
      });

      const pageLayers: any[] = [];
      for (let i = 0; i < actualCount; i++) {
        const photo = photos[photoIdx];
        pageLayers.push({
          layer_type: "photo",
          photo_id: photo.id || null,
          text_content: null,
          x: 0, y: 0, width: 100, height: 100, rotation: 0, z_index: i,
          settings_json: {
            imageUrl: photo.url,
            offsetX: 0, offsetY: 0, scale: 1,
            layout: template,
            cellIndex: i,
          },
        });
        photoIdx++;
      }

      layersBatch.push({ pageIndex: pagesToInsert.length - 1, layers: pageLayers });
      pageNum++;
    }

    setStep("Creating pages…");
    setProgress(65);

    const { data: insertedPages, error: pagesError } = await supabase
      .from("album_pages")
      .insert(pagesToInsert)
      .select("id");

    if (pagesError || !insertedPages) throw new Error("Failed to create pages");

    setStep("Placing photos…");
    setProgress(85);

    const allLayers: any[] = [];
    for (const batch of layersBatch) {
      const pageId = insertedPages[batch.pageIndex]?.id;
      if (!pageId) continue;
      for (const layer of batch.layers) {
        allLayers.push({ ...layer, page_id: pageId });
      }
    }

    if (allLayers.length) {
      const { error: layersError } = await supabase
        .from("album_layers")
        .insert(allLayers);
      if (layersError) throw layersError;
    }

    await supabase
      .from("albums")
      .update({ page_count: pageNum - 1 })
      .eq("id", album.id);

    return pageNum - 1;
  };

  // ── Run: Event gallery ──
  const handleRunFromEvent = async () => {
    if (!album.event_id) {
      toast.error("Link a gallery event to this album first");
      return;
    }
    setRunning(true);
    try {
      setStep("Loading photos from event…");
      setProgress(20);

      const { data: photos, error } = await supabase
        .from("photos")
        .select("id,url,created_at")
        .eq("event_id", album.event_id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!photos || photos.length === 0) {
        toast.error("No photos found in this event");
        setRunning(false);
        return;
      }

      const totalPages = await buildAlbumFromPhotos(photos);

      setStep(`Done! ${totalPages} pages, ${photos.length} photos`);
      setProgress(100);
      toast.success(`Album generated — ${totalPages} pages from event`);
      await onComplete();
      setTimeout(() => { resetState(); onOpenChange(false); }, 1500);
    } catch (error: any) {
      toast.error(error?.message || "Auto layout failed");
      resetState();
    }
  };

  // ── Run: Direct photo upload ──
  const handleRunFromFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one photo");
      return;
    }
    setRunning(true);
    try {
      setStep(`Uploading ${selectedFiles.length} photos…`);
      setProgress(15);

      const uploaded: { url: string }[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const url = await uploadFileToStorage(selectedFiles[i], album.id);
        uploaded.push({ url });
        setProgress(15 + Math.round((i / selectedFiles.length) * 30));
      }

      const totalPages = await buildAlbumFromPhotos(uploaded);

      setStep(`Done! ${totalPages} pages, ${uploaded.length} photos`);
      setProgress(100);
      toast.success(`Album generated — ${totalPages} pages`);
      await onComplete();
      setTimeout(() => { resetState(); onOpenChange(false); }, 1500);
    } catch (error: any) {
      toast.error(error?.message || "Upload or layout failed");
      resetState();
    }
  };

  // ── Run: ZIP upload ──
  const handleRunFromZip = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please extract photos from a ZIP first");
      return;
    }
    await handleRunFromFiles(); // same logic after extraction
  };

  const handleRun = () => {
    if (uploadTab === "event") handleRunFromEvent();
    else if (uploadTab === "photos") handleRunFromFiles();
    else handleRunFromZip();
  };

  const canRun =
    (uploadTab === "event" && !!album.event_id) ||
    ((uploadTab === "photos" || uploadTab === "zip") && selectedFiles.length > 0);

  return (
    <Dialog open={open} onOpenChange={running ? undefined : (v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="max-w-md w-[95vw]">
        <DialogHeader>
          <DialogTitle>Auto Layout Album</DialogTitle>
          {!running && (
            <DialogDescription>
              Upload photos and we'll automatically arrange them into a beautiful album.
            </DialogDescription>
          )}
        </DialogHeader>

        {running ? (
          <div className="space-y-4 py-4">
            <p className="text-sm font-medium">{step}</p>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">{progress}%</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs value={uploadTab} onValueChange={(v) => { setUploadTab(v as any); setSelectedFiles([]); }}>
              <TabsList className="w-full">
                <TabsTrigger value="event" className="flex-1 text-xs gap-1">
                  <Link2 className="h-3 w-3" />
                  Gallery Event
                </TabsTrigger>
                <TabsTrigger value="photos" className="flex-1 text-xs gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Upload Photos
                </TabsTrigger>
                <TabsTrigger value="zip" className="flex-1 text-xs gap-1">
                  <FolderArchive className="h-3 w-3" />
                  ZIP File
                </TabsTrigger>
              </TabsList>

              {/* ── Event Tab ── */}
              <TabsContent value="event" className="mt-3">
                {album.event_id ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <Link2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      Event gallery linked — ready to generate
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <Link2 className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      No event linked. Link an event to this album first using the toolbar.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ── Photos Tab ── */}
              <TabsContent value="photos" className="mt-3 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFilesSelected(e.dataTransfer.files);
                  }}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop photos here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP supported</p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    <p className="text-xs text-muted-foreground font-medium">
                      {selectedFiles.length} photo{selectedFiles.length !== 1 ? "s" : ""} selected
                    </p>
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-muted/40">
                        <ImageIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate flex-1">{f.name}</span>
                        <button onClick={() => removeFile(i)}>
                          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── ZIP Tab ── */}
              <TabsContent value="zip" className="mt-3 space-y-3">
                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => handleZipSelected(e.target.files)}
                />
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
                    "border-border hover:border-primary/50 hover:bg-muted/30"
                  )}
                  onClick={() => zipInputRef.current?.click()}
                >
                  <FolderArchive className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload ZIP file</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All images inside the ZIP will be extracted automatically
                  </p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200">
                    <FolderArchive className="h-4 w-4 text-emerald-600 shrink-0" />
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      {selectedFiles.length} photos extracted from ZIP — ready!
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={() => { resetState(); onOpenChange(false); }}>
                Cancel
              </Button>
              <Button onClick={handleRun} disabled={!canRun}>
                Generate Album
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}