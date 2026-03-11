import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

export default function AlbumAutoLayoutDialog({
  open,
  onOpenChange,
  album,
  onComplete,
}: Props) {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState("");
  const [progress, setProgress] = useState(0);

  const handleRun = async () => {
    if (!album.event_id) {
      toast.error("Link a gallery event to this album first");
      return;
    }

    setRunning(true);

    try {
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

      setStep("Loading photos…");
      setProgress(20);

      const { data: photos, error: photosError } = await supabase
        .from("photos")
        .select("id,url,created_at")
        .eq("event_id", album.event_id)
        .order("created_at", { ascending: true });

      if (photosError) throw photosError;
      if (!photos || photos.length === 0) {
        toast.error("No photos found — upload photos first");
        setRunning(false);
        return;
      }

      setStep("Building layout…");
      setProgress(40);

      const pagesToInsert: Array<{
        album_id: string;
        page_number: number;
        spread_index: number;
      }> = [];
      const layersBatch: Array<{ pageIndex: number; layers: any[] }> = [];

      // Cover
      pagesToInsert.push({
        album_id: album.id,
        page_number: 1,
        spread_index: 1,
      });
      layersBatch.push({
        pageIndex: 0,
        layers: [
          {
            layer_type: "photo",
            photo_id: photos[0].id,
            text_content: null,
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            rotation: 0,
            z_index: 0,
            settings_json: {
              imageUrl: photos[0].url,
              offsetX: 0,
              offsetY: 0,
              scale: 1,
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
            photo_id: photo.id,
            text_content: null,
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            rotation: 0,
            z_index: i,
            settings_json: {
              imageUrl: photo.url,
              offsetX: 0,
              offsetY: 0,
              scale: 1,
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
      setProgress(60);

      const { data: insertedPages, error: pagesError } = await supabase
        .from("album_pages")
        .insert(pagesToInsert)
        .select("id");

      if (pagesError || !insertedPages) throw new Error("Failed to create pages");

      setStep("Placing photos…");
      setProgress(80);

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

      setStep(`Done! ${pageNum - 1} pages, ${photos.length} photos`);
      setProgress(100);
      toast.success(`Album layout generated — ${pageNum - 1} pages`);

      await onComplete();

      setTimeout(() => {
        setRunning(false);
        onOpenChange(false);
        setStep("");
        setProgress(0);
      }, 1500);
    } catch (error: any) {
      console.error("Auto layout error:", error);
      toast.error(error?.message || "Auto layout failed");
      setRunning(false);
      setStep("");
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={running ? undefined : onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Auto Layout Album</DialogTitle>
          {!running && (
            <DialogDescription>
              Automatically builds your album from event photos. Existing pages
              will be replaced.
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
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleRun} disabled={!album.event_id}>
              Generate Layout
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
