import { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EXPORT_SIZES, type ExportSize, type GridLayout, type GridCellData } from './types';
import type { TextLayer } from './text-overlay-types';
import { renderGridToCanvas } from './export-utils';
import { toast } from 'sonner';

interface Props {
  gridRef: React.RefObject<HTMLDivElement | null>;
  cells: GridCellData[];
  layout: GridLayout;
  textLayers?: TextLayer[];
}

export default function DownloadGridButton({ gridRef, cells, layout, textLayers = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportGrid = async (size: ExportSize) => {
    setExporting(true);
    setOpen(false);

    try {
      const canvas = await renderGridToCanvas(layout, cells, size.width, size.height, textLayers);
      const link = document.createElement('a');
      link.download = `grid-${size.width}x${size.height}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success(`Exported at ${size.label} — lossless PNG`);
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Export failed — try again');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <Button
        size="sm"
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className="gap-2"
      >
        <Download className="h-3.5 w-3.5" />
        {exporting ? 'Exporting…' : 'Download'}
        <ChevronDown className="h-3 w-3" />
      </Button>

      {open && (
        <>
          {/* Backdrop to close */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-full mb-2 w-44 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
            {EXPORT_SIZES.map((s) => (
              <button
                key={s.label}
                onClick={() => exportGrid(s)}
                className="w-full text-left px-4 py-2.5 text-xs tracking-wide hover:bg-muted/50 transition-colors text-foreground"
              >
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
