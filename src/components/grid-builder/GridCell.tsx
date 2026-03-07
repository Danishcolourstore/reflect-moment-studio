import { useRef, useState, useCallback } from "react";
import { Plus, X, RefreshCw } from "lucide-react";
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

  const dragRef = useRef<any>(null);
  const pinchRef = useRef<any>(null);

  const [dragging, setDragging] = useState(false);

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

  const getDistance = (t1: Touch, t2: Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!cell.imageUrl) return;

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

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        pinchRef.current = {
          startDist: getDistance(e.touches[0], e.touches[1]),
          startScale: cell.scale,
        };
      }
    },
    [cell.scale],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        const dist = getDistance(e.touches[0], e.touches[1]);

        let newScale = pinchRef.current.startScale * (dist / pinchRef.current.startDist);

        newScale = Math.max(1, Math.min(3, newScale));

        onOffsetChange(cell.offsetX, cell.offsetY, newScale);
      }
    },
    [cell.offsetX, cell.offsetY, onOffsetChange],
  );

  const onTouchEnd = useCallback(() => {
    pinchRef.current = null;
  }, []);

  return (
    <div
      className="relative overflow-hidden bg-muted/30 border border-border/50 group"
      style={{ gridArea, minHeight: "44px" }}
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
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />

          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity z-10">
            <button
              type="button"
              onClick={triggerPicker}
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground/70"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onImageRemove}
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-destructive/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={triggerPicker}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground cursor-pointer"
        >
          <Plus className="h-6 w-6" />

          <span className="text-[10px] tracking-wider uppercase font-medium">Tap to upload</span>
        </button>
      )}
    </div>
  );
}
