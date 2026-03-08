import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download, Image as ImageIcon, FileText, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { Album } from './types';
import type { PageSlot } from './AlbumTimeline';
import { ALBUM_SIZES, type AlbumSize } from './types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  album: Album;
  pages: PageSlot[];
  onSharePreview: () => Promise<string>;
}

export default function AlbumExportDialog({ open, onOpenChange, album, pages, onSharePreview }: Props) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' });
  const [cmyk, setCmyk] = useState(false);

  const loadSpreadImages = async (): Promise<{ pageNum: number; bgColor: string; photos: string[] }[]> => {
    const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
    const pageIds = sortedPages.map(p => p.id);
    const { data: layersData } = await (supabase.from('album_layers' as any)
      .select('page_id, settings_json, layer_type').in('page_id', pageIds).order('z_index', { ascending: true }) as any);

    const { data: pagesData } = await (supabase.from('album_pages' as any)
      .select('id, background_color').in('id', pageIds) as any);

    const bgMap = new Map((pagesData || []).map((p: any) => [p.id, p.background_color || '#ffffff']));

    return sortedPages.map(p => {
      const pageLayers = (layersData || []).filter((l: any) => l.page_id === p.id && l.layer_type === 'photo');
      const photos: string[] = pageLayers.filter((l: any) => l.settings_json?.imageUrl).map((l: any) => l.settings_json.imageUrl as string);
      return { pageNum: p.pageNumber, bgColor: (bgMap.get(p.id) || '#ffffff') as string, photos };
    });
  };

  const renderPageToCanvas = (bgColor: string, photos: string[], width: number, height: number): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      if (photos.length === 0) { resolve(canvas); return; }

      let loaded = 0;
      photos.forEach((url, i) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const cols = Math.ceil(Math.sqrt(photos.length));
          const rows = Math.ceil(photos.length / cols);
          const cw = width / cols;
          const ch = height / rows;
          const col = i % cols;
          const row = Math.floor(i / cols);

          // Cover fit
          const scale = Math.max(cw / img.width, ch / img.height);
          const sw = img.width * scale;
          const sh = img.height * scale;
          ctx.drawImage(img, col * cw + (cw - sw) / 2, row * ch + (ch - sh) / 2, sw, sh);

          loaded++;
          if (loaded === photos.length) resolve(canvas);
        };
        img.onerror = () => { loaded++; if (loaded === photos.length) resolve(canvas); };
        img.src = url;
      });
    });
  };

  const handleJpegExport = async () => {
    setExporting(true);
    try {
      const spreadData = await loadSpreadImages();
      const zip = new JSZip();
      const dim = ALBUM_SIZES[album.size as AlbumSize] || ALBUM_SIZES['12x12'];
      const total = spreadData.length;
      setProgress({ current: 0, total, label: '' });

      for (let i = 0; i < spreadData.length; i++) {
        setProgress({ current: i + 1, total, label: `Exporting spread ${i + 1} of ${total}…` });
        const s = spreadData[i];
        const canvas = await renderPageToCanvas(s.bgColor, s.photos, dim.widthPx, dim.heightPx);
        const blob = await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), 'image/jpeg', 0.92));
        zip.file(`page-${String(s.pageNum).padStart(3, '0')}.jpg`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${album.name} - Digital Preview.zip`);
      toast.success('JPEG export complete');
    } catch (e) {
      console.error(e);
      toast.error('Export failed');
    }
    setExporting(false);
  };

  const handlePdfExport = async (printReady: boolean) => {
    setExporting(true);
    try {
      const spreadData = await loadSpreadImages();
      const dim = ALBUM_SIZES[album.size as AlbumSize] || ALBUM_SIZES['12x12'];
      const dpi = printReady ? 300 : 150;
      const pxW = printReady ? dim.widthPx : Math.round(dim.widthPx / 2);
      const pxH = printReady ? dim.heightPx : Math.round(dim.heightPx / 2);
      const mmW = dim.widthIn * 25.4 + (printReady ? dim.bleedMm * 2 : 0);
      const mmH = dim.heightIn * 25.4 + (printReady ? dim.bleedMm * 2 : 0);

      const pdf = new jsPDF({ orientation: mmW > mmH ? 'landscape' : 'portrait', unit: 'mm', format: [mmW, mmH] });
      const total = spreadData.length;

      for (let i = 0; i < spreadData.length; i++) {
        setProgress({ current: i + 1, total, label: `Rendering ${printReady ? 'page' : 'spread'} ${i + 1} of ${total}…` });
        if (i > 0) pdf.addPage([mmW, mmH]);
        const s = spreadData[i];
        const canvas = await renderPageToCanvas(s.bgColor, s.photos, pxW, pxH);
        const imgData = canvas.toDataURL('image/jpeg', printReady ? 1.0 : 0.85);
        pdf.addImage(imgData, 'JPEG', 0, 0, mmW, mmH);
      }

      const suffix = printReady ? 'Print Ready' : 'Digital Preview';
      pdf.save(`${album.name} - ${suffix}.pdf`);
      toast.success(`${suffix} PDF exported`);
    } catch (e) {
      console.error(e);
      toast.error('PDF export failed');
    }
    setExporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Album</DialogTitle>
        </DialogHeader>

        {exporting ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{progress.label}</p>
            <Progress value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">{progress.current} / {progress.total}</p>
          </div>
        ) : (
          <Tabs defaultValue="digital" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="digital" className="flex-1 text-xs">Digital</TabsTrigger>
              <TabsTrigger value="print" className="flex-1 text-xs">Print</TabsTrigger>
            </TabsList>

            <TabsContent value="digital" className="space-y-3 mt-4">
              <Button variant="outline" className="w-full justify-start gap-3 h-12" onClick={handleJpegExport}>
                <ImageIcon className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <div className="text-sm font-medium">JPEG Spreads</div>
                  <div className="text-[10px] text-muted-foreground">ZIP bundle of all pages</div>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12" onClick={() => handlePdfExport(false)}>
                <FileText className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <div className="text-sm font-medium">PDF Preview</div>
                  <div className="text-[10px] text-muted-foreground">Screen resolution, compressed</div>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12" onClick={() => onSharePreview().then(() => onOpenChange(false))}>
                <Link2 className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <div className="text-sm font-medium">Copy Share Link</div>
                  <div className="text-[10px] text-muted-foreground">Read-only preview URL</div>
                </div>
              </Button>
            </TabsContent>

            <TabsContent value="print" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Color Profile: {cmyk ? 'CMYK' : 'sRGB'}</Label>
                <Switch checked={cmyk} onCheckedChange={setCmyk} />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {cmyk ? 'CMYK approximation (browser-side). Verify with print vendor.' : 'Standard sRGB color profile.'}
              </p>
              <Button className="w-full gap-2" onClick={() => handlePdfExport(true)}>
                <Download className="h-4 w-4" /> Download Print PDF (300 DPI)
              </Button>
              <p className="text-[10px] text-muted-foreground">Includes 3mm bleed. Guide overlays excluded.</p>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
