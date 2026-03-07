import { useState, useRef } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EXPORT_SIZES, type ExportSize } from './types';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

interface Props {
  gridRef: React.RefObject<HTMLDivElement | null>;
}

export default function DownloadGridButton({ gridRef }: Props) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportGrid = async (size: ExportSize) => {
    if (!gridRef.current) return;
    setExporting(true);
    setOpen(false);

    try {
      const dataUrl = await toPng(gridRef.current, {
        width: size.width,
        height: size.height,
        pixelRatio: 1,
        style: {
          width: `${size.width}px`,
          height: `${size.height}px`,
        },
      });

      const link = document.createElement('a');
      link.download = `grid-${size.width}x${size.height}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(`Exported at ${size.label}`);
    } catch {
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
        <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
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
      )}
    </div>
  );
}
