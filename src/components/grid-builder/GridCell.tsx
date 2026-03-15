import { useRef, useState, useCallback } from "react";
import { Plus, X, RefreshCw, Maximize, Expand } from "lucide-react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fitMode, setFitMode] = useState<"fill" | "fit">("fill");

  // Track active pointers for pinch detection
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gestureRef = useRef<{
    origX: number;
    origY: number;
    origScale: number;
    startDist: number;
    startMidX: number;
    startMidY: number;
    isPinch: boolean;
  } | null>(null);

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

  const getDist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const getMid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!cell.imageUrl) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-cell-controls]")) return;

      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const pts = Array.from(pointersRef.current.values());

      if (pts.length === 2) {
        // Start pinch
        const dist = getDist(pts[0], pts[1]);
        const mid = getMid(pts[0], pts[1]);
        gestureRef.current = {
          origX: cell.offsetX,
          origY: cell.offsetY,
          origScale: cell.scale,
          startDist: dist,
          startMidX: mid.x,
          startMidY: mid.y,
          isPinch: true,
        };
      } else if (pts.length === 1) {
        // Start drag
        gestureRef.current = {
          origX: cell.offsetX,
          origY: cell.offsetY,
          origScale: cell.scale,
          startDist: 0,
          startMidX: e.clientX,
          startMidY: e.clientY,
          isPinch: false,
        };
        setDragging(true);
      }
    },
    [cell],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!gestureRef.current) return;

      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pts = Array.from(pointersRef.current.values());

      if (pts.length >= 2 && gestureRef.current.isPinch) {
        // Pinch zoom + pan
        const dist = getDist(pts[0], pts[1]);
        const mid = getMid(pts[0], pts[1]);
        const scaleRatio = dist / gestureRef.current.startDist;
        const newScale = Math.max(0.5, Math.min(5, gestureRef.current.origScale * scaleRatio));
        const dx = mid.x - gestureRef.current.startMidX;
        const dy = mid.y - gestureRef.current.startMidY;
        onOffsetChange(gestureRef.current.origX + dx, gestureRef.current.origY + dy, newScale);
      } else if (pts.length === 1 && !gestureRef.current.isPinch) {
        // Single finger drag
        const dx = e.clientX - gestureRef.current.startMidX;
        const dy = e.clientY - gestureRef.current.startMidY;
        onOffsetChange(gestureRef.current.origX + dx, gestureRef.current.origY + dy, cell.scale);
      }
    },
    [onOffsetChange, cell.scale],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      pointersRef.current.delete(e.pointerId);

      if (pointersRef.current.size < 2 && gestureRef.current?.isPinch) {
        // Transition from pinch to single-finger drag
        const remaining = Array.from(pointersRef.current.values());
        if (remaining.length === 1) {
          gestureRef.current = {
            origX: cell.offsetX,
            origY: cell.offsetY,
            origScale: cell.scale,
            startDist: 0,
            startMidX: remaining[0].x,
            startMidY: remaining[0].y,
            isPinch: false,
          };
          return;
        }
      }

      if (pointersRef.current.size === 0) {
        gestureRef.current = null;
        setDragging(false);
      }
    },
    [cell],
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!cell.imageUrl) return;
      e.preventDefault();
      const zoomIntensity = 0.0015;
      let newScale = cell.scale - e.deltaY * zoomIntensity;
      newScale = Math.max(0.5, Math.min(5, newScale));
      onOffsetChange(cell.offsetX, cell.offsetY, newScale);
    },
    [cell, onOffsetChange],
  );

  const handleFit = useCallback(() => {
    setFitMode("fit");
    // Scale down to show entire image; reset position
    onOffsetChange(0, 0, 0.65);
  }, [onOffsetChange]);

  const handleFill = useCallback(() => {
    setFitMode("fill");
    onOffsetChange(0, 0, 1);
  }, [onOffsetChange]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden group transition-colors duration-200 ${cell.imageUrl ? "" : "bg-[hsl(var(--muted)/0.3)]"}`}
      style={{
        gridArea,
        minHeight: "44px",
        touchAction: "none",
        border: cell.imageUrl ? "none" : "1px dashed hsl(var(--muted-foreground)/0.3)",
      }}
    >
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} tabIndex={-1} />

      {cell.imageUrl ? (
        <>
          <img
            src={cell.imageUrl}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full select-none"
            style={{
              objectFit: fitMode === "fit" ? "contain" : "cover",
              transform: `translate(${cell.offsetX}px, ${cell.offsetY}px) scale(${cell.scale})`,
              cursor: dragging ? "grabbing" : "grab",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
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

          {/* Bottom: Fit / Fill toggle */}
          <div
            data-cell-controls
            className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-full bg-black/60 backdrop-blur-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-0.5"
          >
            <button
              type="button"
              onClick={handleFit}
              className={`h-7 px-2.5 rounded-full flex items-center gap-1 text-[10px] font-medium tracking-wide uppercase transition-colors ${fitMode === "fit" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"}`}
              title="Fit — show full image"
            >
              <Maximize className="h-3 w-3" />
              Fit
            </button>
            <button
              type="button"
              onClick={handleFill}
              className={`h-7 px-2.5 rounded-full flex items-center gap-1 text-[10px] font-medium tracking-wide uppercase transition-colors ${fitMode === "fill" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"}`}
              title="Fill — cover entire cell"
            >
              <Expand className="h-3 w-3" />
              Fill
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest("[data-text-overlay]") || target.closest("[data-text-edit]")) return;
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
