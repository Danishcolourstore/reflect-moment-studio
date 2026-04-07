/**
 * Export each grid cell as an individual 1080×1080 slide, packaged into a ZIP.
 */

import { useState } from 'react';
import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { loadImageElement } from './export-utils';
import type { GridCellData, CanvasFormat } from './types';
import { CANVAS_FORMATS } from './types';

interface Props {
  cells: GridCellData[];
  format?: CanvasFormat;
}

export default function CarouselSliceExporter({ cells, format }: Props) {
  const [exporting, setExporting] = useState(false);
  const filledCells = cells.filter((c) => c.imageUrl);
  const activeFormat = format || CANVAS_FORMATS[0];

  if (filledCells.length < 2) return null;

  const exportSlices = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      const w = activeFormat.exportWidth;
      const h = activeFormat.exportHeight;

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (!cell.imageUrl) continue;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;

        const img = await loadImageElement(cell.imageUrl);

        // Cover fit
        const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * cell.scale;
        const iw = img.naturalWidth * scale;
        const ih = img.naturalHeight * scale;
        const offsetScale = w / 440;
        ctx.drawImage(
          img,
          (w - iw) / 2 + cell.offsetX * offsetScale,
          (h - ih) / 2 + cell.offsetY * offsetScale,
          iw, ih
        );

        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/png')
        );
        zip.file(`Slide_${String(i + 1).padStart(2, '0')}.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.download = 'carousel-slides.zip';
      link.href = URL.createObjectURL(zipBlob);
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success(`${filledCells.length} slides exported as ZIP — lossless PNG`);
    } catch (err) {
      console.error('Carousel slice export failed', err);
      toast.error('Could not export — try again');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={exportSlices} disabled={exporting} className="gap-1.5 text-[10px]">
      <Layers className="h-3 w-3" />
      {exporting ? 'Zipping…' : `${filledCells.length} Slides ZIP`}
    </Button>
  );
}
