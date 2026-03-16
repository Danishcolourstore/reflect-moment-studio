import { useRef, useCallback, useState } from "react";
import { SPREAD_SIZES, type AlbumSize, type SpreadFrame } from "./types";
import { Layers, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Photo Frame Component ─── */

function PhotoFrame({
  frame,
  index,
  onUpdate,
  onDrop,
  isUploading,
}: {
  frame: SpreadFrame;
  index: number;
  onUpdate: (index: number, patch: Partial<SpreadFrame>) => void;
  onDrop: (index: number, e: React.DragEvent) => void;
  isUploading: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!frame.imageUrl) return;
    e.preventDefault();
    e.stopPropagation();
    dragStart.current = { x: e.clientX, y: e.clientY, panX: frame.panX, panY: frame.panY };
    setDragging(true);

    const handleMove = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = ev.clientX - dragStart.current.x;
      const dy = ev.clientY - dragStart.current.y;
      onUpdate(index, {
        panX: dragStart.current.panX + dx,
        panY: dragStart.current.panY + dy,
      });
    };
    const handleUp = () => {
      dragStart.current = null;
      setDragging(false);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }, [frame, index, onUpdate]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!frame.imageUrl) return;
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newZoom = Math.max(1, Math.min(4, frame.zoom + delta));
    onUpdate(index, { zoom: newZoom });
  }, [frame, index, onUpdate]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(index, { panX: 0, panY: 0, zoom: 1 });
  };

  return (
    <div
      ref={frameRef}
      className={cn(
        "absolute overflow-hidden bg-[hsl(var(--muted))]/30 transition-shadow duration-200",
        dragging ? "cursor-grabbing" : frame.imageUrl ? "cursor-grab" : "cursor-default",
        !frame.imageUrl && "border border-dashed border-[hsl(var(--border))]",
      )}
      style={{
        left: `${frame.x}%`,
        top: `${frame.y}%`,
        width: `${frame.w}%`,
        height: `${frame.h}%`,
      }}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={(e) => onDrop(index, e)}
    >
      {frame.imageUrl ? (
        <>
          <img
            src={frame.imageUrl}
            alt=""
            draggable={false}
            className="absolute select-none pointer-events-none"
            style={{
              width: `${frame.zoom * 100}%`,
              height: `${frame.zoom * 100}%`,
              objectFit: "cover",
              left: `calc(50% - ${frame.zoom * 50}% + ${frame.panX}px)`,
              top: `calc(50% - ${frame.zoom * 50}% + ${frame.panY}px)`,
            }}
          />
          {/* Reset crop button */}
          {(frame.panX !== 0 || frame.panY !== 0 || frame.zoom !== 1) && (
            <button
              onClick={handleReset}
              className="absolute top-1 right-1 z-10 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
              title="Reset crop"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-muted-foreground/40">
            <Layers className="h-5 w-5 mx-auto mb-1" />
            <p className="text-[9px]">Drop photo</p>
          </div>
        </div>
      )}
      {isUploading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}

/* ─── Canvas Props ─── */

interface Props {
  frames: SpreadFrame[];
  onFramesChange: (frames: SpreadFrame[]) => void;
  albumSize: AlbumSize;
  zoom: number;
  onZoomChange: (z: number) => void;
  showBleed: boolean;
  showSafeMargin: boolean;
  showGrid: boolean;
  bgColor: string;
  onDropPhoto: (photo: { url: string }, frameIndex: number) => void;
  uploadingCells: Set<number>;
  spreadLabel: string;
}

export default function AlbumCanvas({
  frames,
  onFramesChange,
  albumSize,
  zoom,
  onZoomChange,
  showBleed,
  showSafeMargin,
  showGrid,
  bgColor,
  onDropPhoto,
  uploadingCells,
  spreadLabel,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dim = SPREAD_SIZES[albumSize];
  const aspectRatio = dim.aspectRatio;

  const handleFrameUpdate = useCallback(
    (index: number, patch: Partial<SpreadFrame>) => {
      const updated = frames.map((f, i) => (i === index ? { ...f, ...patch } : f));
      onFramesChange(updated);
    },
    [frames, onFramesChange]
  );

  const handleDrop = useCallback(
    (index: number, e: React.DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer.getData("application/album-photo");
      if (!data) return;
      try {
        const photo = JSON.parse(data);
        onDropPhoto(photo, index);
      } catch {
        console.warn("Invalid drag data");
      }
    },
    [onDropPhoto]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        onZoomChange(Math.max(25, Math.min(300, zoom + delta)));
      }
    },
    [zoom, onZoomChange]
  );

  const bleedPct = (dim.bleedMm / (dim.spreadWidthIn * 25.4)) * 100;
  const safePct = (dim.safeMarginMm / (dim.spreadWidthIn * 25.4)) * 100;

  // Scale canvas to fit workspace
  const baseWidth = 800;
  const scaledWidth = baseWidth * (zoom / 100);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center overflow-auto"
      style={{
        minHeight: 0,
        padding: "32px",
        background: "hsl(0 0% 12%)",
      }}
      onWheel={handleWheel}
    >
      {/* Spread label */}
      <div className="mb-3 text-[11px] font-medium text-white/40 tracking-wider uppercase">
        {spreadLabel}
      </div>

      <div
        ref={canvasRef}
        className="relative flex-shrink-0 group"
        style={{
          aspectRatio,
          width: `${scaledWidth}px`,
          maxWidth: "calc(100% - 64px)",
          background: bgColor,
          boxShadow: "0 30px 60px -15px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* Bleed guide (red dashed) */}
        {showBleed && (
          <div
            className="absolute pointer-events-none z-40"
            style={{
              inset: `-${bleedPct}%`,
              border: "1.5px dashed rgba(239,68,68,0.6)",
            }}
          >
            <span className="absolute top-0 left-1 text-[8px] text-red-500/60">BLEED 3mm</span>
          </div>
        )}

        {/* Safe margin (blue dashed) */}
        {showSafeMargin && (
          <div
            className="absolute pointer-events-none z-40"
            style={{
              inset: `${safePct}%`,
              border: "1px dashed rgba(59,130,246,0.5)",
            }}
          >
            <span className="absolute bottom-0 right-1 text-[8px] text-blue-500/50">SAFE</span>
          </div>
        )}

        {/* Center spine line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10 z-30 pointer-events-none" />

        {/* Grid overlay */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none z-30"
            style={{
              backgroundSize: "10% 10%",
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
            }}
          />
        )}

        {/* Frames */}
        {frames.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/30 select-none">
            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <Layers className="h-8 w-8 opacity-30" />
            </div>
            <p className="text-sm font-medium">Select a layout preset</p>
            <p className="text-xs opacity-50">Or drag photos from the panel</p>
          </div>
        ) : (
          frames.map((frame, i) => (
            <PhotoFrame
              key={frame.id}
              frame={frame}
              index={i}
              onUpdate={handleFrameUpdate}
              onDrop={handleDrop}
              isUploading={uploadingCells.has(i)}
            />
          ))
        )}
      </div>
    </div>
  );
}
