import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { Download, Image as ImageIcon, FileText, Link2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";

import type { Album } from "./types";
import type { PageSlot } from "./AlbumTimeline";
import { ALBUM_SIZES, type AlbumSize } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  album: Album;
  pages: PageSlot[];
  onSharePreview: () => Promise<string>;
}

export default function AlbumExportDialog({ open, onOpenChange, album, pages, onSharePreview }: Props) {
  const [exporting, setExporting] = useState(false);

  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    label: "",
  });

  const [cmyk, setCmyk] = useState(false);

  /* ---------------- Load images ---------------- */

  const loadPageImages = async () => {
    const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

    const pageIds = sortedPages.map((p) => p.id);

    const { data: layersData } = await supabase
      .from("album_layers")
      .select("page_id,settings_json,layer_type")
      .in("page_id", pageIds)
      .order("z_index", { ascending: true });

    const { data: pagesData } = await supabase.from("album_pages").select("id,background_color").in("id", pageIds);

    const bgMap = new Map((pagesData || []).map((p: any) => [p.id, p.background_color || "#ffffff"]));

    return sortedPages.map((p) => {
      const pageLayers = (layersData || []).filter((l: any) => l.page_id === p.id && l.layer_type === "photo");

      const photos = pageLayers
        .filter((l: any) => l.settings_json?.imageUrl)
        .map((l: any) => l.settings_json.imageUrl as string);

      return {
        pageNum: p.pageNumber,
        bgColor: bgMap.get(p.id) || "#ffffff",
        photos,
      };
    });
  };

  /* ---------------- Render page ---------------- */

  const renderCanvas = async (bgColor: string, photos: string[], width: number, height: number) => {
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    if (!photos.length) return canvas;

    const cols = Math.ceil(Math.sqrt(photos.length));
    const rows = Math.ceil(photos.length / cols);

    const cellW = width / cols;
    const cellH = height / rows;

    await Promise.all(
      photos.map(
        (url, i) =>
          new Promise<void>((resolve) => {
            const img = new Image();

            img.crossOrigin = "anonymous";

            img.onload = () => {
              const col = i % cols;
              const row = Math.floor(i / cols);

              const scale = Math.max(cellW / img.width, cellH / img.height);

              const w = img.width * scale;
              const h = img.height * scale;

              ctx.drawImage(img, col * cellW + (cellW - w) / 2, row * cellH + (cellH - h) / 2, w, h);

              resolve();
            };

            img.onerror = () => resolve();

            img.src = url;
          }),
      ),
    );

    return canvas;
  };

  /* ---------------- JPEG ZIP Export ---------------- */

  const handleJpegExport = async () => {
    setExporting(true);

    try {
      const data = await loadPageImages();

      const zip = new JSZip();

      const dim = ALBUM_SIZES[album.size as AlbumSize] || ALBUM_SIZES["12x12"];

      setProgress({
        current: 0,
        total: data.length,
        label: "",
      });

      for (let i = 0; i < data.length; i++) {
        setProgress({
          current: i + 1,
          total: data.length,
          label: `Rendering page ${i + 1}`,
        });

        const page = data[i];

        const canvas = await renderCanvas(page.bgColor, page.photos, dim.widthPx, dim.heightPx);

        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.92));

        zip.file(`page-${String(page.pageNum).padStart(3, "0")}.jpg`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });

      saveAs(zipBlob, `${album.name} Album Export.zip`);

      toast.success("JPEG export complete");
    } catch (e) {
      console.error(e);
      toast.error("Export failed");
    }

    setExporting(false);
  };

  /* ---------------- PDF Export ---------------- */

  const handlePdfExport = async (printReady: boolean) => {
    setExporting(true);

    try {
      const data = await loadPageImages();

      const dim = ALBUM_SIZES[album.size as AlbumSize] || ALBUM_SIZES["12x12"];

      const pxW = printReady ? dim.widthPx : dim.widthPx / 2;
      const pxH = printReady ? dim.heightPx : dim.heightPx / 2;

      const mmW = dim.widthIn * 25.4;
      const mmH = dim.heightIn * 25.4;

      const pdf = new jsPDF({
        orientation: mmW > mmH ? "landscape" : "portrait",
        unit: "mm",
        format: [mmW, mmH],
      });

      for (let i = 0; i < data.length; i++) {
        setProgress({
          current: i + 1,
          total: data.length,
          label: `Rendering page ${i + 1}`,
        });

        if (i > 0) pdf.addPage();

        const page = data[i];

        const canvas = await renderCanvas(page.bgColor, page.photos, pxW, pxH);

        const img = canvas.toDataURL("image/jpeg", printReady ? 1 : 0.85);

        pdf.addImage(img, "JPEG", 0, 0, mmW, mmH);
      }

      pdf.save(`${album.name} ${printReady ? "Print" : "Preview"}.pdf`);

      toast.success("PDF exported");
    } catch (e) {
      console.error(e);
      toast.error("PDF export failed");
    }

    setExporting(false);
  };

  /* ---------------- UI ---------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Album</DialogTitle>
        </DialogHeader>

        {exporting ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{progress.label}</p>

            <Progress value={progress.total ? (progress.current / progress.total) * 100 : 0} />
          </div>
        ) : (
          <Tabs defaultValue="digital">
            <TabsList className="w-full">
              <TabsTrigger value="digital" className="flex-1">
                Digital
              </TabsTrigger>

              <TabsTrigger value="print" className="flex-1">
                Print
              </TabsTrigger>
            </TabsList>

            <TabsContent value="digital" className="space-y-3 mt-4">
              <Button variant="outline" className="w-full justify-start gap-3 h-12" onClick={handleJpegExport}>
                <ImageIcon className="h-4 w-4" />
                JPEG Pages
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => handlePdfExport(false)}
              >
                <FileText className="h-4 w-4" />
                PDF Preview
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => onSharePreview().then(() => onOpenChange(false))}
              >
                <Link2 className="h-4 w-4" />
                Share Preview Link
              </Button>
            </TabsContent>

            <TabsContent value="print" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <Label className="text-xs">Color Profile {cmyk ? "CMYK" : "sRGB"}</Label>

                <Switch checked={cmyk} onCheckedChange={setCmyk} />
              </div>

              <Button className="w-full" onClick={() => handlePdfExport(true)}>
                <Download className="h-4 w-4 mr-2" />
                Print PDF
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
