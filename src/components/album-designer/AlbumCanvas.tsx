import { useRef, useCallback, useState, useEffect } from "react";
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
  enableTouch,
}: {
  frame: SpreadFrame;
  index: number;
  onUpdate: (index: number, patch: Partial<SpreadFrame>) => void;
  onDrop: (index: number, e: React.DragEvent) => void;
  isUploading: boolean;
  enableTouch?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Mouse interactions
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

  // Touch interactions for repositioning inside frame
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!frame.imageUrl || !enableTouch || e.touches.length !== 1) return;
    e.stopPropagation();
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX, y: touch.clientY, panX: frame.panX, panY: frame.panY };
    setDragging(true);
  }, [frame, enableTouch]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragStart.current || e.touches.length !== 1) return;
    e.stopPropagation();
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;
    onUpdate(index, {
      panX: dragStart.current.panX + dx,
      panY: dragStart.current.panY + dy,
    });
  }, [index, onUpdate]);

  const handleTouchEnd = useCallback(() => {
    dragStart.current = null;
    setDragging(false);
  }, []);

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

  const handleReset = (e: React.MouseEvent | React.TouchEvent) => {
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
        // Desktop hover states
        "input-mouse:hover:ring-2 input-mouse:hover:ring-primary/30",
      )}
      style={{
        left: `${frame.x}%`,
        top: `${frame.y}%`,
        width: `${frame.w}%`,
        height: `${frame.h}%`,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
          {/* Reset crop button - visible on hover (mouse) or always visible subtly (touch) */}
          {(frame.panX !== 0 || frame.panY !== 0 || frame.zoom !== 1) && (
            <button
              onClick={handleReset}
              onTouchEnd={(e) => { e.stopPropagation(); handleReset(e); }}
              className={cn(
                "absolute top-1 right-1 z-10 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center transition-opacity",
                "device-phone:opacity-60 device-tablet:opacity-60",
                "device-desktop:opacity-0 device-desktop:group-hover:opacity-100 hover:opacity-100"
              )}
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
  enableTouchGestures?: boolean;
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
  enableTouchGestures,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dim = SPREAD_SIZES[albumSize];
  const aspectRatio = dim.aspectRatio;

  // Pinch-to-zoom support
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => {
    if (!enableTouchGestures || !containerRef.current) return;
    const el = containerRef.current;

    const getTouchDist = (e: TouchEvent) => {
      if (e.touches.length < 2) return 0;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchRef.current = { dist: getTouchDist(e), zoom };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const newDist = getTouchDist(e);
        const scale = newDist / pinchRef.current.dist;
        const newZoom = Math.max(25, Math.min(300, Math.round(pinchRef.current.zoom * scale)));
        onZoomChange(newZoom);
      }
    };
    const onTouchEnd = () => { pinchRef.current = null; };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [enableTouchGestures, zoom, onZoomChange]);

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

  // Responsive base width
  const baseWidth = 800;
  const scaledWidth = baseWidth * (zoom / 100);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center overflow-auto"
      style={{
        minHeight: 0,
        padding: enableTouchGestures ? "16px" : "32px",
        background: "hsl(0 0% 12%)",
      }}
      onWheel={handleWheel}
    >
      {/* Spread label */}
      <div className="mb-2 text-[11px] font-medium text-white/40 tracking-wider uppercase">
        {spreadLabel}
      </div>

      <div
        ref={canvasRef}
        className="relative flex-shrink-0 group"
        style={{
          aspectRatio,
          width: `${scaledWidth}px`,
          maxWidth: enableTouchGestures ? "calc(100% - 16px)" : "calc(100% - 64px)",
          background: bgColor,
          boxShadow: "0 30px 60px -15px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* Bleed guide */}
        {showBleed && (
          <div
            className="absolute pointer-events-none z-40"
            style={{ inset: `-${bleedPct}%`, border: "1.5px dashed rgba(239,68,68,0.6)" }}
          >
            <span className="absolute top-0 left-1 text-[8px] text-red-500/60">BLEED 3mm</span>
          </div>
        )}

        {/* Safe margin */}
        {showSafeMargin && (
          <div
            className="absolute pointer-events-none z-40"
            style={{ inset: `${safePct}%`, border: "1px dashed rgba(59,130,246,0.5)" }}
          >
            <span className="absolute bottom-0 right-1 text-[8px] text-blue-500/50">SAFE</span>
          </div>
        )}

        {/* Center spine */}
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
              enableTouch={enableTouchGestures}
            />
          ))
        )}
      </div>
    </div>
  );
}
