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
import type { Album } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  album: Album;
  onComplete: () => Promise<void>;
}

/* ---------- Layout Templates ---------- */

const TEMPLATES = {
  story: {
    gridCols: 2,
    gridRows: 3,
    cells: [
      [1, 1, 3, 3],
      [3, 1, 4, 2],
      [3, 2, 4, 3],
    ],
  },

  hSplit: {
    gridCols: 2,
    gridRows: 1,
    cells: [
      [1, 1, 2, 2],
      [1, 2, 2, 3],
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

  fullBleed: {
    gridCols: 1,
    gridRows: 1,
    cells: [[1, 1, 2, 2]],
  },
};

export default function AlbumAutoLayoutDialog({ open, onOpenChange, album, onComplete }: Props) {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState("");
  const [progress, setProgress] = useState(0);

  const handleRun = async () => {
    if (!album.event_id) {
      toast.error("Album has no linked event");
      return;
    }

    setRunning(true);

    try {
      /* ---------- Step 1: Clear existing pages ---------- */

      setStep("Clearing existing pages…");
      setProgress(10);

      const { data: existingPages } = await supabase.from("album_pages").select("id").eq("album_id", album.id);

      const pageIds = (existingPages || []).map((p: any) => p.id);

      if (pageIds.length) {
        await supabase.from("album_layers").delete().in("page_id", pageIds);
        await supabase.from("album_pages").delete().eq("album_id", album.id);
      }

      /* ---------- Step 2: Load Photos ---------- */

      setStep("Loading photos…");
      setProgress(20);

      const { data: photos } = await supabase
        .from("photos")
        .select("id,url,created_at")
        .eq("event_id", album.event_id)
        .order("created_at", { ascending: true });

      if (!photos || photos.length === 0) {
        toast.error("No photos found for event");
        setRunning(false);
        return;
      }

      /* ---------- Step 3: Split Photos ---------- */

      setStep("Grouping photos…");
      setProgress(35);

      const third = Math.ceil(photos.length / 3);

      const groups = [photos.slice(0, third), photos.slice(third, third * 2), photos.slice(third * 2)];

      /* ---------- Step 4: Generate Pages ---------- */

      setStep("Generating layout…");
      setProgress(50);

      const pagesToInsert: any[] = [];
      const layersBatch: any[] = [];

      /* Cover page */

      pagesToInsert.push({
        album_id: album.id,
        page_number: 1,
        spread_index: 1,
      });

      if (photos[0]) {
        layersBatch.push({
          pageIndex: 0,
          layers: [
            {
              layer_type: "photo",
              photo_id: null,
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
      }

      let pageNum = 2;

      for (let g = 0; g < groups.length; g++) {
        const group = groups[g];
        let groupPhotoIdx = 0;

        while (groupPhotoIdx < group.length) {
          const remaining = group.length - groupPhotoIdx;

          let template;
          let photoCount;

          if (groupPhotoIdx === 0) {
            template = TEMPLATES.story;
            photoCount = Math.min(3, remaining);
          } else if (remaining <= 1) {
            template = TEMPLATES.fullBleed;
            photoCount = 1;
          } else if (pageNum % 2 === 0) {
            template = TEMPLATES.hSplit;
            photoCount = Math.min(2, remaining);
          } else {
            template = TEMPLATES.collage;
            photoCount = Math.min(4, remaining);
          }

          const spreadIndex = Math.ceil(pageNum / 2);

          pagesToInsert.push({
            album_id: album.id,
            page_number: pageNum,
            spread_index: spreadIndex,
          });

          const pageLayers: any[] = [];

          for (let i = 0; i < photoCount && groupPhotoIdx < group.length; i++) {
            pageLayers.push({
              layer_type: "photo",
              photo_id: null,
              text_content: null,
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              rotation: 0,
              z_index: i,
              settings_json: {
                imageUrl: group[groupPhotoIdx].url,
                offsetX: 0,
                offsetY: 0,
                scale: 1,
                layout: template,
              },
            });

            groupPhotoIdx++;
          }

          layersBatch.push({
            pageIndex: pagesToInsert.length - 1,
            layers: pageLayers,
          });

          pageNum++;
        }
      }

      /* ---------- Step 5: Insert Pages ---------- */

      setStep("Creating pages…");
      setProgress(70);

      const { data: insertedPages, error: pagesError } = await supabase
        .from("album_pages")
        .insert(pagesToInsert)
        .select("id");

      if (pagesError || !insertedPages) {
        toast.error("Failed to create album pages");
        setRunning(false);
        return;
      }

      /* ---------- Step 6: Insert Layers ---------- */

      setProgress(85);

      const allLayers: any[] = [];

      for (const batch of layersBatch) {
        const pageId = insertedPages[batch.pageIndex]?.id;

        if (!pageId) continue;

        for (const layer of batch.layers) {
          allLayers.push({
            ...layer,
            page_id: pageId,
          });
        }
      }

      if (allLayers.length) {
        await supabase.from("album_layers").insert(allLayers);
      }

      /* ---------- Step 7: Update Album ---------- */

      await supabase
        .from("albums")
        .update({ page_count: pageNum - 1 })
        .eq("id", album.id);

      setStep(`Done! ${pageNum - 1} pages created`);
      setProgress(100);

      toast.success(`Album layout generated`);

      await onComplete();

      setTimeout(() => {
        setRunning(false);
        onOpenChange(false);
        setStep("");
        setProgress(0);
      }, 1200);
    } catch (error) {
      console.error(error);
      toast.error("Auto layout failed");
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={running ? undefined : onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Auto Layout Album</DialogTitle>

          {!running && (
            <DialogDescription>
              This will automatically build your album layout using the event photos.
            </DialogDescription>
          )}
        </DialogHeader>

        {running ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-foreground">{step}</p>
            <Progress value={progress} className="h-2" />
          </div>
        ) : (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>

            <Button onClick={handleRun}>Generate Layout</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
