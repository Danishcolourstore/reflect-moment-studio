import { useState } from 'react';
import { Download } from 'lucide-react';
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

  const exportGrid = async (size: ExportSize) => {
    setExporting(true);
    try {
      const canvas = await renderGridToCanvas(layout, cells, size.width, size.height, textLayers, elements, logo, background);
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" disabled={exporting} className="gap-1.5 text-[10px]">
          <Download className="h-3 w-3" />
          {exporting ? 'Exporting…' : 'Download'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-44">
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
