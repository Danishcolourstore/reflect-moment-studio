import { useState } from 'react';
import { LayoutGrid, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { renderGridToCanvas, loadImageElement } from './export-utils';
import type { GridLayout, GridCellData } from './types';
import type { TextLayer } from './text-overlay-types';

interface Props {
  layout: GridLayout;
  cells: GridCellData[];
  gridRef: React.RefObject<HTMLDivElement | null>;
  textLayers?: TextLayer[];
}

export default function CarouselExporter({ layout, cells, gridRef, textLayers = [] }: Props) {
  const [exporting, setExporting] = useState(false);
  const filledCount = cells.filter((c) => c.imageUrl).length;

  const exportCombined = async () => {
    setExporting(true);
    try {
      const canvas = await renderGridToCanvas(layout, cells, 1080, 1080, textLayers);
      const link = document.createElement('a');
      link.download = 'grid-combined-1080x1080.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Combined grid exported — lossless PNG');
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

        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d')!;

        // Use original image — no compression
        const img = await loadImageElement(cell.imageUrl);

        // Draw with cover behavior at full resolution
        const scale = Math.max(1080 / img.naturalWidth, 1080 / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.drawImage(img, (1080 - w) / 2 + cell.offsetX * (1080 / 440), (1080 - h) / 2 + cell.offsetY * (1080 / 440), w, h);

        const link = document.createElement('a');
        link.download = `slide-${i + 1}-1080x1080.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        await new Promise((r) => setTimeout(r, 300));
      }
      toast.success(`${filledCount} slides exported — lossless PNG`);
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
