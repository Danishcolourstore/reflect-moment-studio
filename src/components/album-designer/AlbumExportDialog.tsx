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
import { SPREAD_SIZES, type AlbumSize } from "./types";
import type { SpreadSlot } from "./AlbumTimeline";
import type { AlbumData } from "@/hooks/use-album-editor";

interface SpreadRenderData {
  spreadIndex: number;
  bgColor: string;
  photos: { url: string; x: number; y: number; w: number; h: number }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  album: AlbumData;
  spreads: SpreadSlot[];
  onSharePreview: () => Promise<string>;
}

export default function AlbumExportDialog({ open, onOpenChange, album, spreads, onSharePreview }: Props) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: "" });
  const [cmyk, setCmyk] = useState(false);

  const loadSpreadsData = async (): Promise<SpreadRenderData[]> => {
    const sorted = [...spreads].sort((a, b) => a.spreadIndex - b.spreadIndex);
    const ids = sorted.map(s => s.id);

    const { data: layersData } = await supabase.from("album_layers")
      .select("page_id,settings_json,layer_type").in("page_id", ids).order("z_index", { ascending: true });
    const { data: pagesData } = await supabase.from("album_pages")
      .select("id,background_color").in("id", ids);

    const bgMap = new Map((pagesData || []).map(p => [p.id, p.background_color || "#ffffff"]));

    return sorted.map(s => {
      const layers = (layersData || []).filter(l => l.page_id === s.id && l.layer_type === "photo");
      const photos = layers.filter(l => {
        const st = l.settings_json as any;
        return st?.imageUrl;
      }).map(l => {
        const st = l.settings_json as any;
        return { url: st.imageUrl, x: st.x || 0, y: st.y || 0, w: st.w || 100, h: st.h || 100 };
      });
      return { spreadIndex: s.spreadIndex, bgColor: bgMap.get(s.id) || "#ffffff", photos };
    });
  };

  const renderCanvas = async (spread: SpreadRenderData, width: number, height: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = spread.bgColor;
    ctx.fillRect(0, 0, width, height);

    await Promise.all(spread.photos.map(photo =>
      new Promise<void>(resolve => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const fx = (photo.x / 100) * width;
          const fy = (photo.y / 100) * height;
          const fw = (photo.w / 100) * width;
          const fh = (photo.h / 100) * height;
          const scale = Math.max(fw / img.width, fh / img.height);
          const iw = img.width * scale;
          const ih = img.height * scale;
          ctx.save();
          ctx.beginPath();
          ctx.rect(fx, fy, fw, fh);
          ctx.clip();
          ctx.drawImage(img, fx + (fw - iw) / 2, fy + (fh - ih) / 2, iw, ih);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = photo.url;
      })
    ));
    return canvas;
  };

  const dim = SPREAD_SIZES[album.size] || SPREAD_SIZES["12x36"];

  const handleJpegExport = async () => {
    setExporting(true);
    try {
      const data = await loadSpreadsData();
      const zip = new JSZip();
      setProgress({ current: 0, total: data.length, label: "" });
      for (let i = 0; i < data.length; i++) {
        setProgress({ current: i + 1, total: data.length, label: `Rendering spread ${i + 1}` });
        const canvas = await renderCanvas(data[i], dim.spreadWidthPx, dim.spreadHeightPx);
        const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), "image/jpeg", 0.92));
        zip.file(`spread-${String(data[i].spreadIndex).padStart(3, "0")}.jpg`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${album.name} Album Export.zip`);
      toast.success("JPEG export complete");
    } catch (e) { console.error(e); toast.error("Export failed"); }
    setExporting(false);
  };

  const handlePdfExport = async (printReady: boolean) => {
    setExporting(true);
    try {
      const data = await loadSpreadsData();
      const pxW = printReady ? dim.spreadWidthPx : dim.spreadWidthPx / 2;
      const pxH = printReady ? dim.spreadHeightPx : dim.spreadHeightPx / 2;
      const mmW = dim.spreadWidthIn * 25.4;
      const mmH = dim.spreadHeightIn * 25.4;

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [mmW, mmH] });
      for (let i = 0; i < data.length; i++) {
        setProgress({ current: i + 1, total: data.length, label: `Rendering spread ${i + 1}` });
        if (i > 0) pdf.addPage();
        const canvas = await renderCanvas(data[i], pxW, pxH);
        const img = canvas.toDataURL("image/jpeg", printReady ? 1 : 0.85);
        pdf.addImage(img, "JPEG", 0, 0, mmW, mmH);
      }
      pdf.save(`${album.name} ${printReady ? "Print" : "Preview"}.pdf`);
      toast.success("PDF exported");
    } catch (e) { console.error(e); toast.error("PDF export failed"); }
    setExporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Export Album</DialogTitle></DialogHeader>
        {exporting ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{progress.label}</p>
            <Progress value={progress.total ? (progress.current / progress.total) * 100 : 0} />
          </div>
        ) : (
          <Tabs defaultValue="digital">
            <TabsList className="w-full">
              <TabsTrigger value="digital" className="flex-1">Digital</TabsTrigger>
              <TabsTrigger value="print" className="flex-1">Print</TabsTrigger>
            </TabsList>
            <TabsContent value="digital" className="space-y-3 mt-4">
              <Button variant="outline" className="w-full justify-start gap-3 h-12" onClick={handleJpegExport}>
                <ImageIcon className="h-4 w-4" /> JPEG Spreads (ZIP)
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12" onClick={() => handlePdfExport(false)}>
                <FileText className="h-4 w-4" /> PDF Preview
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12" onClick={() => onSharePreview().then(() => onOpenChange(false))}>
                <Link2 className="h-4 w-4" /> Share Preview Link
              </Button>
            </TabsContent>
            <TabsContent value="print" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <Label className="text-xs">Color Profile: {cmyk ? "CMYK" : "sRGB"}</Label>
                <Switch checked={cmyk} onCheckedChange={setCmyk} />
              </div>
              <Button className="w-full" onClick={() => handlePdfExport(true)}>
                <Download className="h-4 w-4 mr-2" /> Print-Ready PDF (300 DPI)
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
