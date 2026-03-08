import { useRef, useCallback } from 'react';
import type { GridLayout, GridCellData } from '@/components/grid-builder/types';
import type { TextLayer } from '@/components/grid-builder/text-overlay-types';
import GridCell from '@/components/grid-builder/GridCell';
import TextOverlay from '@/components/grid-builder/TextOverlay';
import { ALBUM_SIZES, type AlbumSize } from './types';

interface Props {
  layout: GridLayout;
  cells: GridCellData[];
  onCellsChange: (cells: GridCellData[]) => void;
  textLayers: TextLayer[];
  onTextLayersChange: (layers: TextLayer[]) => void;
  selectedTextId: string | null;
  onSelectText: (id: string | null) => void;
  albumSize: AlbumSize;
  zoom: number;
  onZoomChange: (z: number) => void;
  spreadView: boolean;
  showBleed: boolean;
  showSafeMargin: boolean;
  showSpine: boolean;
  bgColor: string;
  onDropPhoto: (photo: any, cellIndex: number) => void;
  currentPageNumber: number;
}

export default function AlbumCanvas({
  layout, cells, onCellsChange, textLayers, onTextLayersChange,
  selectedTextId, onSelectText, albumSize, zoom, onZoomChange, spreadView,
  showBleed, showSafeMargin, showSpine, bgColor, onDropPhoto, currentPageNumber,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dim = ALBUM_SIZES[albumSize];

  // Cover (page 0) always single; spread doubles width for content pages
  const isCover = currentPageNumber === 0;
  const showAsSpread = spreadView && !isCover;
  const aspectRatio = showAsSpread ? (dim.widthIn * 2) / dim.heightIn : dim.widthIn / dim.heightIn;

  const updateCell = useCallback((index: number, patch: Partial<GridCellData>) => {
    onCellsChange(cells.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }, [cells, onCellsChange]);

  const handleImageAdd = useCallback((index: number, file: File) => {
    const url = URL.createObjectURL(file);
    updateCell(index, { imageUrl: url, file, offsetX: 0, offsetY: 0, scale: 1 });
  }, [updateCell]);

  const handleImageRemove = useCallback((index: number) => {
    const old = cells[index];
    if (old.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(old.imageUrl);
    updateCell(index, { imageUrl: null, file: null, offsetX: 0, offsetY: 0, scale: 1 });
  }, [cells, updateCell]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };

  const handleDrop = (e: React.DragEvent, cellIndex: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/album-photo');
    if (data) {
      try { onDropPhoto(JSON.parse(data), cellIndex); } catch {}
    }
  };

  const updateTextLayer = useCallback((id: string, patch: Partial<TextLayer>) => {
    onTextLayersChange(textLayers.map(l => l.id === id ? { ...l, ...patch } : l));
  }, [textLayers, onTextLayersChange]);

  const deleteTextLayer = useCallback((id: string) => {
    onTextLayersChange(textLayers.filter(l => l.id !== id));
    onSelectText(null);
  }, [textLayers, onTextLayersChange, onSelectText]);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      onZoomChange(Math.max(25, Math.min(200, zoom + delta)));
    }
  }, [zoom, onZoomChange]);

  // Bleed/safe calcs
  const bleedPx = (dim.bleedMm / (dim.widthIn * 25.4)) * 100;
  const safePx = (dim.safeMarginMm / (dim.widthIn * 25.4)) * 100;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center overflow-auto bg-muted/30 p-8"
      onWheel={handleWheel}
    >
      <div
        ref={canvasRef}
        className="relative rounded-sm overflow-visible shadow-2xl transition-transform duration-200"
        style={{
          aspectRatio,
          width: `${Math.min(800, 600 * (zoom / 100))}px`,
          maxWidth: '90%',
          maxHeight: '85vh',
          background: bgColor,
        }}
      >
        {/* Bleed guide */}
        {showBleed && (
          <div className="absolute pointer-events-none z-40" style={{
            inset: `-${bleedPx}%`,
            border: '2px dashed rgba(239,68,68,0.5)',
            borderRadius: '2px',
          }}>
            <span className="absolute -top-5 left-1 text-[9px] text-red-500/70 font-medium">BLEED 3mm</span>
          </div>
        )}

        {/* Safe margin guide */}
        {showSafeMargin && (
          <div className="absolute pointer-events-none z-40" style={{
            inset: `${safePx}%`,
            border: '1.5px dashed rgba(59,130,246,0.5)',
            borderRadius: '1px',
          }}>
            <span className="absolute -top-4 left-1 text-[9px] text-blue-500/60 font-medium">SAFE 5mm</span>
          </div>
        )}

        {/* Spine guide - only in spread view */}
        {showSpine && showAsSpread && (
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-px w-0 z-40 pointer-events-none"
            style={{ borderLeft: '1.5px dashed rgba(var(--foreground), 0.25)' }}>
            <span className="absolute -top-4 left-1 text-[9px] text-foreground/40 font-medium whitespace-nowrap">SPINE</span>
          </div>
        )}

        {/* Grid */}
        <div className="w-full h-full relative" style={{ padding: '3px' }}>
          <div
            className="w-full h-full overflow-hidden relative"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
              gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
              gap: '3px',
            }}
          >
            {layout.cells.map((area, i) => (
              <div
                key={cells[i]?.id || i}
                style={{ gridArea: `${area[0]} / ${area[1]} / ${area[2]} / ${area[3]}` }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, i)}
              >
                <GridCell
                  cell={cells[i] || { id: `cell-${i}`, imageUrl: null, file: null, offsetX: 0, offsetY: 0, scale: 1 }}
                  gridArea=""
                  onImageAdd={(f) => handleImageAdd(i, f)}
                  onImageRemove={() => handleImageRemove(i)}
                  onOffsetChange={(x, y) => updateCell(i, { offsetX: x, offsetY: y })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Text layers */}
        {textLayers.map(layer => (
          <TextOverlay
            key={layer.id}
            layer={layer}
            selected={layer.id === selectedTextId}
            containerRef={canvasRef}
            onUpdate={(patch) => updateTextLayer(layer.id, patch)}
            onSelect={() => onSelectText(layer.id)}
            onDelete={() => deleteTextLayer(layer.id)}
          />
        ))}
      </div>
    </div>
  );
}
