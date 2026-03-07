/**
 * Export each grid cell as an individual 1080×1080 slide, packaged into a ZIP.
 */

import { useState } from 'react';
import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { loadImageElement } from './export-utils';
import type { GridCellData } from './types';

interface Props {
  cells: GridCellData[];
}

export default function CarouselSliceExporter({ cells }: Props) {
  const [exporting, setExporting] = useState(false);
  const filledCells = cells.filter((c) => c.imageUrl);

  if (filledCells.length < 2) return null;

  const exportSlices = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      const size = 1080;

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (!cell.imageUrl) continue;

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        const img = await loadImageElement(cell.imageUrl);

        // Cover fit
        const scale = Math.max(size / img.naturalWidth, size / img.naturalHeight) * cell.scale;
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        const offsetScale = size / 440;
        ctx.drawImage(
          img,
          (size - w) / 2 + cell.offsetX * offsetScale,
          (size - h) / 2 + cell.offsetY * offsetScale,
          w, h
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
      toast.error('Export failed — try again');
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
