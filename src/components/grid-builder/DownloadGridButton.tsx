import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EXPORT_SIZES, type ExportSize, type GridLayout, type GridCellData, type CanvasFormat, CANVAS_FORMATS } from './types';
import type { TextLayer } from './text-overlay-types';
import type { DesignElement } from './element-types';
import type { LogoLayer } from './LogoOverlay';
import type { BackgroundStyle } from './BackgroundStyler';
import { renderGridToCanvas } from './export-utils';
import { toast } from 'sonner';

interface Props {
  gridRef: React.RefObject<HTMLDivElement | null>;
  cells: GridCellData[];
  layout: GridLayout;
  textLayers?: TextLayer[];
  elements?: DesignElement[];
  logo?: LogoLayer | null;
  background?: BackgroundStyle;
  format?: CanvasFormat;
}

export default function DownloadGridButton({ gridRef, cells, layout, textLayers = [], elements = [], logo = null, background, format }: Props) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const activeFormat = format || CANVAS_FORMATS[0];

  const exportGrid = async (size: ExportSize) => {
    setExporting(true);
    setProgress(10);
    try {
      const canvasRatio = layout.canvasRatio || activeFormat.ratio;
      const exportW = size.width;
      const exportH = Math.round(exportW / canvasRatio);
      const progressTimer = setInterval(() => {
        setProgress(prev => Math.min(prev + 8, 75));
      }, 200);
      const canvas = await renderGridToCanvas(layout, cells, exportW, exportH, textLayers, elements, logo, background);
      clearInterval(progressTimer);
      setProgress(85);
      const link = document.createElement('a');
      link.download = `grid-${exportW}x${exportH}.png`;
      link.href = canvas.toDataURL('image/png');
      setProgress(95);
      link.click();
      setProgress(100);
      toast.success(`Exported at ${exportW}×${exportH} — lossless PNG`);
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Export failed — try again');
    } finally {
      setTimeout(() => { setExporting(false); setProgress(0); }, 500);
    }
  };

  const exportNative = async () => {
    setExporting(true);
    setProgress(10);
    try {
      const progressTimer = setInterval(() => {
        setProgress(prev => Math.min(prev + 8, 75));
      }, 200);
      const canvas = await renderGridToCanvas(layout, cells, activeFormat.exportWidth, activeFormat.exportHeight, textLayers, elements, logo, background);
      clearInterval(progressTimer);
      setProgress(85);
      const link = document.createElement('a');
      link.download = `grid-${activeFormat.exportWidth}x${activeFormat.exportHeight}.png`;
      link.href = canvas.toDataURL('image/png');
      setProgress(95);
      link.click();
      setProgress(100);
      toast.success(`Exported at ${activeFormat.exportWidth}×${activeFormat.exportHeight} — lossless PNG`);
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Export failed — try again');
    } finally {
      setTimeout(() => { setExporting(false); setProgress(0); }, 500);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" disabled={exporting} className="gap-1.5 text-[10px]">
          <Download className="h-3 w-3" />
          {exporting ? 'Exporting…' : 'Download'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-48">
        <DropdownMenuItem
          onClick={exportNative}
          className="text-xs tracking-wide font-medium"
        >
          {activeFormat.label} — {activeFormat.exportWidth}×{activeFormat.exportHeight}
        </DropdownMenuItem>
        {EXPORT_SIZES.map((s) => (
          <DropdownMenuItem
            key={s.label}
            onClick={() => exportGrid(s)}
            className="text-xs tracking-wide"
          >
            {s.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
