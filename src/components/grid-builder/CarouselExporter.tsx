import { useState } from 'react';
import { LayoutGrid, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import type { GridLayout, GridCellData } from './types';

interface Props {
  layout: GridLayout;
  cells: GridCellData[];
  gridRef: React.RefObject<HTMLDivElement | null>;
}

export default function CarouselExporter({ layout, cells, gridRef }: Props) {
  const [exporting, setExporting] = useState(false);
  const filledCount = cells.filter((c) => c.imageUrl).length;

  const exportCombined = async () => {
    if (!gridRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(gridRef.current, {
        width: 1080,
        height: 1080,
        pixelRatio: 1,
        style: { width: '1080px', height: '1080px' },
      });
      const link = document.createElement('a');
      link.download = 'grid-combined-1080x1080.png';
      link.href = dataUrl;
      link.click();
      toast.success('Combined grid exported');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const exportSlides = async () => {
    setExporting(true);
    try {
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (!cell.imageUrl) continue;

        // Create a temporary canvas to export individual cell
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = cell.imageUrl!;
        });

        // Draw centered/cover
        const scale = Math.max(1080 / img.width, 1080 / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (1080 - w) / 2, (1080 - h) / 2, w, h);

        const link = document.createElement('a');
        link.download = `slide-${i + 1}-1080x1080.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Small delay between downloads
        await new Promise((r) => setTimeout(r, 300));
      }
      toast.success(`${filledCount} slides exported`);
    } catch {
      toast.error('Slide export failed');
    } finally {
      setExporting(false);
    }
  };

  if (filledCount === 0) return null;

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportCombined} disabled={exporting} className="gap-1.5 text-[10px]">
        <Image className="h-3 w-3" />
        Combined
      </Button>
      <Button variant="outline" size="sm" onClick={exportSlides} disabled={exporting} className="gap-1.5 text-[10px]">
        <LayoutGrid className="h-3 w-3" />
        {filledCount} Slides
      </Button>
    </div>
  );
}
