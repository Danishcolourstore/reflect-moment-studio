/**
 * InspireCropView — Premium crop-and-analyze step for Grid Inspire.
 * Dark workspace aesthetic with rule-of-thirds overlay and smooth interactions.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Crop, Sparkles, Maximize2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CropRect { x: number; y: number; w: number; h: number; }

interface Props {
  imageSrc: string;
  onBack: () => void;
  onAnalyze: (base64: string) => Promise<void>;
}

export default function InspireCropView({ imageSrc, onBack, onAnalyze }: Props) {
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [dragging, setDragging] = useState<'none' | 'create' | 'move' | 'resize'>('none');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCropStart, setDragCropStart] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [analyzing, setAnalyzing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgDisplay, setImgDisplay] = useState({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => { imgRef.current = img; updateImgDisplay(img); };
    img.src = imageSrc;
  }, [imageSrc]);

  const updateImgDisplay = useCallback((img: HTMLImageElement) => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth, ch = container.clientHeight;
    const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    const x = (cw - w) / 2, y = (ch - h) / 2;
    setImgDisplay({ x, y, w, h });
    if (!crop) {
      const m = 0.08;
      setCrop({ x: x + w * m, y: y + h * m, w: w * (1 - 2 * m), h: h * (1 - 2 * m) });
    }
  }, [crop]);

  useEffect(() => {
    if (!containerRef.current || !imgRef.current) return;
    const obs = new ResizeObserver(() => { if (imgRef.current) updateImgDisplay(imgRef.current); });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [updateImgDisplay]);

  const resetCrop = useCallback(() => {
    if (!imgRef.current) return;
    const { x, y, w, h } = imgDisplay;
    const m = 0.08;
    setCrop({ x: x + w * m, y: y + h * m, w: w * (1 - 2 * m), h: h * (1 - 2 * m) });
  }, [imgDisplay]);

  const selectAll = useCallback(() => {
    setCrop({ x: imgDisplay.x, y: imgDisplay.y, w: imgDisplay.w, h: imgDisplay.h });
  }, [imgDisplay]);

  const getPointerPos = (e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const isInResizeHandle = (pos: { x: number; y: number }) => {
    if (!crop) return false;
    const s = 24;
    return pos.x >= crop.x + crop.w - s && pos.x <= crop.x + crop.w + s && pos.y >= crop.y + crop.h - s && pos.y <= crop.y + crop.h + s;
  };

  const isInCrop = (pos: { x: number; y: number }) => {
    if (!crop) return false;
    return pos.x >= crop.x && pos.x <= crop.x + crop.w && pos.y >= crop.y && pos.y <= crop.y + crop.h;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const pos = getPointerPos(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (crop && isInResizeHandle(pos)) { setDragging('resize'); setDragStart(pos); setDragCropStart({ ...crop }); }
    else if (crop && isInCrop(pos)) { setDragging('move'); setDragStart(pos); setDragCropStart({ ...crop }); }
    else { setDragging('create'); setDragStart(pos); setCrop({ x: pos.x, y: pos.y, w: 0, h: 0 }); }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragging === 'none') return;
    const pos = getPointerPos(e);
    const dx = pos.x - dragStart.x, dy = pos.y - dragStart.y;
    if (dragging === 'create') {
      setCrop({ x: Math.min(pos.x, dragStart.x), y: Math.min(pos.y, dragStart.y), w: Math.abs(pos.x - dragStart.x), h: Math.abs(pos.y - dragStart.y) });
    } else if (dragging === 'move') {
      setCrop({
        x: Math.max(imgDisplay.x, Math.min(imgDisplay.x + imgDisplay.w - dragCropStart.w, dragCropStart.x + dx)),
        y: Math.max(imgDisplay.y, Math.min(imgDisplay.y + imgDisplay.h - dragCropStart.h, dragCropStart.y + dy)),
        w: dragCropStart.w, h: dragCropStart.h,
      });
    } else if (dragging === 'resize') {
      setCrop({ ...dragCropStart, w: Math.max(40, dragCropStart.w + dx), h: Math.max(40, dragCropStart.h + dy) });
    }
  };

  const getCroppedBase64 = useCallback(async (): Promise<string> => {
    const img = imgRef.current!, c = crop!;
    const sx = ((c.x - imgDisplay.x) / imgDisplay.w) * img.naturalWidth;
    const sy = ((c.y - imgDisplay.y) / imgDisplay.h) * img.naturalHeight;
    const sw = (c.w / imgDisplay.w) * img.naturalWidth;
    const sh = (c.h / imgDisplay.h) * img.naturalHeight;
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1024 / Math.max(sw, sh));
    canvas.width = Math.round(sw * scale); canvas.height = Math.round(sh * scale);
    canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, [crop, imgDisplay]);

  const handleAnalyze = async () => {
    if (!crop || crop.w < 20 || crop.h < 20) { toast.error('Select a grid area first'); return; }
    setAnalyzing(true);
    try {
      const base64 = await getCroppedBase64();
      await onAnalyze(base64);
    } catch {
      setAnalyzing(false);
    }
  };

  const cropArea = crop && crop.w > 5 && crop.h > 5 ? Math.round((crop.w * crop.h) / (imgDisplay.w * imgDisplay.h) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/30">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Crop className="h-3 w-3 text-primary" /> Select Grid Area
          </p>
          {cropArea > 0 && (
            <p className="text-[9px] text-muted-foreground mt-0.5">{cropArea}% selected</p>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={resetCrop} className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="Reset crop">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button onClick={selectAll} className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="Select all">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-crosshair select-none mx-3 mb-3 rounded-xl bg-secondary/30"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDragging('none')}
        style={{ touchAction: 'none' }}
      >
        <img
          src={imageSrc}
          className="absolute pointer-events-none"
          style={{ left: imgDisplay.x, top: imgDisplay.y, width: imgDisplay.w, height: imgDisplay.h }}
          draggable={false} alt="Screenshot"
        />
        {crop && crop.w > 0 && crop.h > 0 && (
          <>
            {/* Dark overlay outside crop */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              <defs>
                <mask id="inspire-crop-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} fill="black" rx="4" />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="hsl(var(--background) / 0.7)" mask="url(#inspire-crop-mask)" />
            </svg>

            {/* Crop border */}
            <div
              className="absolute border-2 border-primary rounded pointer-events-none"
              style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h, zIndex: 2 }}
            >
              {/* Corner handles */}
              {[
                { top: -4, left: -4 },
                { top: -4, right: -4 },
                { bottom: -4, left: -4 },
                { bottom: -4, right: -4 },
              ].map((pos, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-primary rounded-sm shadow-md shadow-primary/30"
                  style={pos as any}
                />
              ))}

              {/* Rule of thirds grid */}
              <div className="absolute inset-0 pointer-events-none">
                {[1, 2].map(n => (
                  <div key={`h${n}`} className="absolute left-0 right-0 border-t border-primary/15" style={{ top: `${(n / 3) * 100}%` }} />
                ))}
                {[1, 2].map(n => (
                  <div key={`v${n}`} className="absolute top-0 bottom-0 border-l border-primary/15" style={{ left: `${(n / 3) * 100}%` }} />
                ))}
              </div>

              {/* Resize handle (bottom-right) */}
              <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-primary rounded-full border-2 border-background shadow-lg shadow-primary/30 cursor-se-resize" />

              {/* Dimension label */}
              {crop.w > 60 && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-card border border-border rounded-md px-2 py-0.5 text-[9px] text-muted-foreground font-mono whitespace-nowrap">
                  {Math.round(crop.w)} × {Math.round(crop.h)}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-5 pt-2 flex gap-2.5 max-w-sm mx-auto w-full" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
        <Button variant="outline" className="flex-1 h-12" onClick={onBack}>
          Re-upload
        </Button>
        <Button className="flex-1 h-12 gap-2 shadow-lg shadow-primary/20" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? (
            <><div className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Analyzing…</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Detect Layout</>
          )}
        </Button>
      </div>
    </div>
  );
}
