import { useState, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GridLayout, GridCellData } from './types';
import { createCellsForLayout } from './types';
import GridCell from './GridCell';
import SmartFillUploader from './SmartFillUploader';
import DownloadGridButton from './DownloadGridButton';
import CarouselExporter from './CarouselExporter';

interface Props {
  layout: GridLayout;
  onBack: () => void;
}

export default function GridEditor({ layout, onBack }: Props) {
  const [cells, setCells] = useState<GridCellData[]>(() => createCellsForLayout(layout));
  const gridRef = useRef<HTMLDivElement>(null);

  /** Create an object URL from raw file — zero compression, original bytes */
  const fileToUrl = (file: File): string => URL.createObjectURL(file);

  const updateCell = useCallback((index: number, patch: Partial<GridCellData>) => {
    setCells((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }, []);

  const handleImageAdd = useCallback((index: number, file: File) => {
    // Revoke old URL to free memory
    setCells((prev) => {
      const old = prev[index];
      if (old.imageUrl) URL.revokeObjectURL(old.imageUrl);
      return prev;
    });
    const url = fileToUrl(file);
    updateCell(index, { imageUrl: url, file, offsetX: 0, offsetY: 0, scale: 1 });
  }, [updateCell]);

  const handleImageRemove = useCallback((index: number) => {
    setCells((prev) => {
      const old = prev[index];
      if (old.imageUrl) URL.revokeObjectURL(old.imageUrl);
      return prev;
    });
    updateCell(index, { imageUrl: null, file: null, offsetX: 0, offsetY: 0, scale: 1 });
  }, [updateCell]);

  const handleOffsetChange = useCallback((index: number, x: number, y: number) => {
    updateCell(index, { offsetX: x, offsetY: y });
  }, [updateCell]);

  const handleSmartFill = useCallback((files: File[]) => {
    setCells((prev) => {
      // Revoke old URLs
      prev.forEach((c) => { if (c.imageUrl) URL.revokeObjectURL(c.imageUrl); });
      return prev.map((c, i) => {
        if (i < files.length) {
          return { ...c, imageUrl: fileToUrl(files[i]), file: files[i], offsetX: 0, offsetY: 0, scale: 1 };
        }
        return { ...c, imageUrl: null, file: null, offsetX: 0, offsetY: 0, scale: 1 };
      });
    });
  }, []);

  const handleReset = useCallback(() => {
    setCells((prev) => {
      prev.forEach((c) => { if (c.imageUrl) URL.revokeObjectURL(c.imageUrl); });
      return createCellsForLayout(layout);
    });
  }, [layout]);

  const filledCount = cells.filter((c) => c.imageUrl).length;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs tracking-wider uppercase font-medium">{layout.name}</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <SmartFillUploader totalCells={cells.length} onFiles={handleSmartFill} />
          </div>
        </div>
      </div>

      {/* Grid canvas */}
      <div className="flex-1 flex items-start justify-center px-4 pt-5 pb-40">
        <div
          ref={gridRef}
          className="w-full aspect-square max-w-[440px] rounded-2xl overflow-hidden bg-card border border-border shadow-sm"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
            gap: '3px',
            padding: '3px',
          }}
        >
          {layout.cells.map((area, i) => (
            <GridCell
              key={cells[i].id}
              cell={cells[i]}
              gridArea={`${area[0]} / ${area[1]} / ${area[2]} / ${area[3]}`}
              onImageAdd={(f) => handleImageAdd(i, f)}
              onImageRemove={() => handleImageRemove(i)}
              onOffsetChange={(x, y) => handleOffsetChange(i, x, y)}
            />
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border px-4 py-3 safe-area-pb">
        <div className="max-w-[480px] mx-auto flex items-center justify-between">
          <p className="text-[10px] tracking-wider uppercase text-muted-foreground">
            {filledCount}/{cells.length} filled
          </p>
          <div className="flex items-center gap-2">
            <CarouselExporter layout={layout} cells={cells} gridRef={gridRef} />
            <DownloadGridButton gridRef={gridRef} cells={cells} layout={layout} />
          </div>
        </div>
      </div>
    </div>
  );
}
