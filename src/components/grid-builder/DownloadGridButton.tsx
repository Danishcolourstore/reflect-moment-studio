import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EXPORT_SIZES, type ExportSize, type GridLayout, type GridCellData, type CanvasFormat, type FreePosition, CANVAS_FORMATS } from './types';
import type { TextLayer } from './text-overlay-types';
import type { DesignElement } from './element-types';
import type { LogoLayer } from './LogoOverlay';
import type { BackgroundStyle } from './BackgroundStyler';
import { renderGridToCanvas } from './export-utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  gridRef: React.RefObject<HTMLDivElement | null>;
  cells: GridCellData[];
  layout: GridLayout;
  textLayers?: TextLayer[];
  elements?: DesignElement[];
  logo?: LogoLayer | null;
  background?: BackgroundStyle;
  format?: CanvasFormat;
  freePositions?: FreePosition[] | null;
  mobileFullWidth?: boolean;
  disabled?: boolean;
  label?: string;
}

export default function DownloadGridButton({
  gridRef: _gridRef,
  cells,
  layout,
  textLayers = [],
  elements = [],
  logo = null,
  background,
  format,
  freePositions = null,
  mobileFullWidth = false,
  disabled = false,
  label = 'Download',
}: Props) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const activeFormat = format || CANVAS_FORMATS[0];
  const filledCount = cells.filter((c) => c.imageUrl).length;
  const isDisabled = disabled || exporting || filledCount === 0;

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
      const canvas = await renderGridToCanvas(
        layout, cells, exportW, exportH,
        textLayers, elements, logo, background,
        freePositions,
      );
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
      toast.error('Could not export — try again');
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
      const canvas = await renderGridToCanvas(
        layout, cells, activeFormat.exportWidth, activeFormat.exportHeight,
        textLayers, elements, logo, background,
        freePositions,
      );
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
      toast.error('Could not export — try again');
    } finally {
      setTimeout(() => { setExporting(false); setProgress(0); }, 500);
    }
  };

  const triggerClass = cn(
    mobileFullWidth
      ? 'w-full gap-2 px-6 py-4 font-sans text-[11px] uppercase tracking-[0.12em] border-0 rounded-none'
      : 'gap-1.5 text-[10px] min-w-[100px]',
    mobileFullWidth && (isDisabled
      ? 'bg-grid-surface text-[#333333] pointer-events-none'
      : 'bg-grid-ivory text-grid-noir hover:bg-grid-ivory/90'),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size={mobileFullWidth ? 'lg' : 'sm'}
          disabled={isDisabled}
          variant={mobileFullWidth ? 'ghost' : 'default'}
          className={cn('relative overflow-hidden', triggerClass)}
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{progress < 100 ? `${progress}%` : 'Done!'}</span>
              <div
                className="absolute bottom-0 left-0 h-[2px] bg-grid-gold/40 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </>
          ) : (
            <>
              <Download className={mobileFullWidth ? 'h-4 w-4' : 'h-3 w-3'} />
              {label}
            </>
          )}
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
