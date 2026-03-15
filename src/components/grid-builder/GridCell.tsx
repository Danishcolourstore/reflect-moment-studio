import { useRef, useState, useCallback } from "react";
import { Plus, X, RefreshCw, Maximize, ZoomIn, ZoomOut } from "lucide-react";
import type { GridCellData } from "./types";

interface Props {
  cell: GridCellData;
  gridArea: string;
  onImageAdd: (file: File) => void;
  onImageRemove: () => void;
  onOffsetChange: (x: number, y: number, scale?: number) => void;
}

export default function GridCell({ cell, gridArea, onImageAdd, onImageRemove, onOffsetChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const [dragging, setDragging] = useState(false);
  const [showZoomBar, setShowZoomBar] = useState(false);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onImageAdd(file);
      e.target.value = "";
    },
    [onImageAdd],
  );

  const triggerPicker = useCallback(() => {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    setTimeout(() => inputRef.current?.click(), 10);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!cell.imageUrl) return;
      const target = e.target as HTMLElement;
      if (target.closest('[data-text-overlay]') || target.closest('[data-text-edit]') || target.closest('[data-cell-controls]')) return;

      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: cell.offsetX,
        origY: cell.offsetY,
      };
      setDragging(true);
    },
    [cell],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      onOffsetChange(dragRef.current.origX + dx, dragRef.current.origY + dy, cell.scale);
    },
    [onOffsetChange, cell.scale],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!cell.imageUrl) return;
      e.preventDefault();
      const zoomIntensity = 0.0015;
      let newScale = cell.scale - e.deltaY * zoomIntensity;
      newScale = Math.max(1, Math.min(3, newScale));
      onOffsetChange(cell.offsetX, cell.offsetY, newScale);
    },
    [cell, onOffsetChange],
  );

  const handleFit = useCallback(() => {
    onOffsetChange(0, 0, 1);
  }, [onOffsetChange]);

  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(3, cell.scale + 0.15);
    onOffsetChange(cell.offsetX, cell.offsetY, newScale);
  }, [cell, onOffsetChange]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(1, cell.scale - 0.15);
    onOffsetChange(cell.offsetX, cell.offsetY, newScale);
  }, [cell, onOffsetChange]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newScale = parseFloat(e.target.value);
      onOffsetChange(cell.offsetX, cell.offsetY, newScale);
    },
    [cell.offsetX, cell.offsetY, onOffsetChange],
  );

  return (
    <div
      className={`relative overflow-hidden group transition-colors duration-200 ${cell.imageUrl ? '' : 'bg-[hsl(var(--muted)/0.3)]'}`}
      style={{
        gridArea,
        minHeight: "44px",
        touchAction: "none",
        border: cell.imageUrl ? 'none' : '1px dashed hsl(var(--muted-foreground)/0.3)',
      }}
      onMouseEnter={() => cell.imageUrl && setShowZoomBar(true)}
      onMouseLeave={() => setShowZoomBar(false)}
    >
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} tabIndex={-1} />

      {cell.imageUrl ? (
        <>
          <img
            src={cell.imageUrl}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover select-none"
            style={{
              transform: `translate(${cell.offsetX}px, ${cell.offsetY}px) scale(${cell.scale})`,
              cursor: dragging ? "grabbing" : "grab",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={onWheel}
          />

          {/* Top-right: replace & remove */}
          <div
            data-cell-controls
            className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
          >
            <button
              type="button"
              onClick={triggerPicker}
              className="h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all duration-150"
              title="Replace photo"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onImageRemove}
              className="h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-red-400 hover:bg-black/70 transition-all duration-150"
              title="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Bottom: zoom/fit bar */}
          <div
            data-cell-controls
            className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm z-10 transition-all duration-200 ${showZoomBar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'}`}
          >
            <button
              type="button"
              onClick={handleFit}
              className="h-6 w-6 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              title="Fit to cell"
            >
              <Maximize className="h-3 w-3" />
            </button>
            <div className="w-px h-3.5 bg-white/20" />
            <button
              type="button"
              onClick={handleZoomOut}
              className="h-6 w-6 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="h-3 w-3" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={cell.scale}
              onChange={handleSliderChange}
              className="w-16 h-1 accent-white appearance-none bg-white/20 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
              title={`Zoom: ${Math.round(cell.scale * 100)}%`}
            />
            <button
              type="button"
              onClick={handleZoomIn}
              className="h-6 w-6 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="h-3 w-3" />
            </button>
            <span className="text-[10px] text-white/60 min-w-[28px] text-center tabular-nums">
              {Math.round(cell.scale * 100)}%
            </span>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('[data-text-overlay]') || target.closest('[data-text-edit]')) return;
            triggerPicker();
          }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground/40 cursor-pointer hover:text-muted-foreground/60 transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span className="text-[9px] tracking-wider uppercase font-medium">Add photo</span>
        </button>
      )}
    </div>
  );
}