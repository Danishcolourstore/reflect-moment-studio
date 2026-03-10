import { useRef, useCallback } from "react";
import type { GridLayout, GridCellData } from "@/components/grid-builder/types";
import type { TextLayer } from "@/components/grid-builder/text-overlay-types";
import GridCell from "@/components/grid-builder/GridCell";
import TextOverlay from "@/components/grid-builder/TextOverlay";
import { ALBUM_SIZES, type AlbumSize } from "./types";
import { ImageIcon } from "lucide-react";

interface Props {
  layout: GridLayout | null;
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
  layout,
  cells,
  onCellsChange,
  textLayers,
  onTextLayersChange,
  selectedTextId,
  onSelectText,
  albumSize,
  zoom,
  onZoomChange,
  spreadView,
  showBleed,
  showSafeMargin,
  showSpine,
  bgColor,
  onDropPhoto,
  currentPageNumber,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const dim = ALBUM_SIZES[albumSize];

  const isCover = currentPageNumber === 0;
  const showAsSpread = spreadView && !isCover;
  const aspectRatio = showAsSpread ? (dim.widthIn * 2) / dim.heightIn : dim.widthIn / dim.heightIn;

  const updateCell = useCallback(
    (index: number, patch: Partial<GridCellData>) => {
      const updated = cells.map((c, i) => (i === index ? { ...c, ...patch } : c));
      onCellsChange(updated);
    },
    [cells, onCellsChange],
  );

  const handleImageAdd = useCallback(
    (index: number, file: File) => {
      const url = URL.createObjectURL(file);
      updateCell(index, { imageUrl: url, file, offsetX: 0, offsetY: 0, scale: 1 });
    },
    [updateCell],
  );

  const handleImageRemove = useCallback(
    (index: number) => {
      const old = cells[index];
      if (old?.imageUrl?.startsWith("blob:")) URL.revokeObjectURL(old.imageUrl);
      updateCell(index, { imageUrl: null, file: null, offsetX: 0, offsetY: 0, scale: 1 });
    },
    [cells, updateCell],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent, cellIndex: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/album-photo");
    if (!data) return;
    try {
      const photo = JSON.parse(data);
      onDropPhoto(photo, cellIndex);
    } catch {
      console.warn("Invalid photo drag data");
    }
  };

  const updateTextLayer = useCallback(
    (id: string, patch: Partial<TextLayer>) => {
      onTextLayersChange(textLayers.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    },
    [textLayers, onTextLayersChange],
  );

  const deleteTextLayer = useCallback(
    (id: string) => {
      onTextLayersChange(textLayers.filter((l) => l.id !== id));
      onSelectText(null);
    },
    [textLayers, onTextLayersChange, onSelectText],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        const next = Math.max(25, Math.min(200, zoom + delta));
        onZoomChange(next);
      }
    },
    [zoom, onZoomChange],
  );

  const bleedPct = (dim.bleedMm / (dim.widthIn * 25.4)) * 100;
  const safePct = (dim.safeMarginMm / (dim.widthIn * 25.4)) * 100;

  // FIX: safely handle null/undefined layout
  const layoutCells = layout?.cells ?? [];
  const hasLayout = layoutCells.length > 0;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center overflow-auto bg-muted/30 p-8"
      onWheel={handleWheel}
      style={{ minHeight: 0 }}
    >
      <div
        ref={canvasRef}
        className="relative rounded-sm overflow-visible shadow-2xl transition-transform duration-200"
        style={{
          aspectRatio,
          width: `${Math.min(900, 600 * (zoom / 100))}px`,
          maxWidth: "90%",
          maxHeight: "85vh",
          minWidth: "280px",
          minHeight: "200px",
          background: bgColor,
        }}
      >
        {showBleed && (
          <div
            className="absolute pointer-events-none z-40"
            style={{ inset: `-${bleedPct}%`, border: "2px dashed rgba(239,68,68,0.5)" }}
          />
        )}

        {showSafeMargin && (
          <div
            className="absolute pointer-events-none z-40"
            style={{ inset: `${safePct}%`, border: "1.5px dashed rgba(59,130,246,0.5)" }}
          />
        )}

        {showSpine && showAsSpread && (
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-foreground/20 z-40 pointer-events-none" />
        )}

        {/* FIX: show helpful placeholder when no layout selected */}
        {!hasLayout ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground select-none">
            <ImageIcon className="h-10 w-10 opacity-30" />
            <p className="text-sm font-medium opacity-50">Select a layout from the right panel</p>
          </div>
        ) : (
          <div
            className="w-full h-full relative"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${layout!.gridCols}, 1fr)`,
              gridTemplateRows: `repeat(${layout!.gridRows}, 1fr)`,
              gap: "3px",
              padding: "3px",
            }}
          >
            {layoutCells.map((area, i) => {
              const cell = cells[i] || {
                id: `cell-${i}`,
                imageUrl: null,
                file: null,
                offsetX: 0,
                offsetY: 0,
                scale: 1,
              };
              return (
                <div
                  key={cell.id}
                  style={{ gridArea: `${area[0]} / ${area[1]} / ${area[2]} / ${area[3]}` }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, i)}
                >
                  <GridCell
                    cell={cell}
                    gridArea=""
                    onImageAdd={(f) => handleImageAdd(i, f)}
                    onImageRemove={() => handleImageRemove(i)}
                    onOffsetChange={(x, y) => updateCell(i, { offsetX: x, offsetY: y })}
                  />
                </div>
              );
            })}
          </div>
        )}

        {textLayers.map((layer) => (
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
