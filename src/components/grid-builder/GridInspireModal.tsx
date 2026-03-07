import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Crop, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { GridLayout } from './types';

interface Props {
  onClose: () => void;
  onLayoutGenerated: (layout: GridLayout) => void;
}

type Step = 'upload' | 'crop' | 'analyzing';

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function GridInspireModal({ onClose, onLayoutGenerated }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [dragging, setDragging] = useState<'none' | 'create' | 'move' | 'resize'>('none');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCropStart, setDragCropStart] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgDisplay, setImgDisplay] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setStep('crop');
    setCrop(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  // Compute image display bounds inside container
  useEffect(() => {
    if (!imageSrc || step !== 'crop') return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      updateImgDisplay(img);
    };
    img.src = imageSrc;
  }, [imageSrc, step]);

  const updateImgDisplay = useCallback((img: HTMLImageElement) => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;
    setImgDisplay({ x, y, w, h });
    // Default crop to 80% center
    if (!crop) {
      const margin = 0.1;
      setCrop({
        x: x + w * margin,
        y: y + h * margin,
        w: w * (1 - 2 * margin),
        h: h * (1 - 2 * margin),
      });
    }
  }, [crop]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current || !imgRef.current) return;
    const obs = new ResizeObserver(() => {
      if (imgRef.current) updateImgDisplay(imgRef.current);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [updateImgDisplay]);

  // Pointer handlers for crop
  const getPointerPos = (e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const isInResizeHandle = (pos: { x: number; y: number }) => {
    if (!crop) return false;
    const hSize = 20;
    return (
      pos.x >= crop.x + crop.w - hSize &&
      pos.x <= crop.x + crop.w + hSize &&
      pos.y >= crop.y + crop.h - hSize &&
      pos.y <= crop.y + crop.h + hSize
    );
  };

  const isInCrop = (pos: { x: number; y: number }) => {
    if (!crop) return false;
    return pos.x >= crop.x && pos.x <= crop.x + crop.w && pos.y >= crop.y && pos.y <= crop.y + crop.h;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const pos = getPointerPos(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (crop && isInResizeHandle(pos)) {
      setDragging('resize');
      setDragStart(pos);
      setDragCropStart({ ...crop });
    } else if (crop && isInCrop(pos)) {
      setDragging('move');
      setDragStart(pos);
      setDragCropStart({ ...crop });
    } else {
      setDragging('create');
      setDragStart(pos);
      setCrop({ x: pos.x, y: pos.y, w: 0, h: 0 });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragging === 'none') return;
    const pos = getPointerPos(e);
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;

    if (dragging === 'create') {
      const x = Math.min(pos.x, dragStart.x);
      const y = Math.min(pos.y, dragStart.y);
      const w = Math.abs(pos.x - dragStart.x);
      const h = Math.abs(pos.y - dragStart.y);
      setCrop({ x, y, w, h });
    } else if (dragging === 'move') {
      setCrop({
        x: Math.max(imgDisplay.x, Math.min(imgDisplay.x + imgDisplay.w - dragCropStart.w, dragCropStart.x + dx)),
        y: Math.max(imgDisplay.y, Math.min(imgDisplay.y + imgDisplay.h - dragCropStart.h, dragCropStart.y + dy)),
        w: dragCropStart.w,
        h: dragCropStart.h,
      });
    } else if (dragging === 'resize') {
      const newW = Math.max(40, dragCropStart.w + dx);
      const newH = Math.max(40, dragCropStart.h + dy);
      setCrop({ ...dragCropStart, w: newW, h: newH });
    }
  };

  const handlePointerUp = () => setDragging('none');

  // Convert crop to image coordinates and export as base64
  const getCroppedBase64 = useCallback(async (): Promise<string> => {
    const img = imgRef.current!;
    const c = crop!;
    // Map from display coordinates to image coordinates
    const sx = ((c.x - imgDisplay.x) / imgDisplay.w) * img.naturalWidth;
    const sy = ((c.y - imgDisplay.y) / imgDisplay.h) * img.naturalHeight;
    const sw = (c.w / imgDisplay.w) * img.naturalWidth;
    const sh = (c.h / imgDisplay.h) * img.naturalHeight;

    const canvas = document.createElement('canvas');
    // Cap export at 1024 for AI
    const maxDim = 1024;
    const scale = Math.min(1, maxDim / Math.max(sw, sh));
    canvas.width = Math.round(sw * scale);
    canvas.height = Math.round(sh * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, [crop, imgDisplay]);

  const handleAnalyze = async () => {
    if (!crop || crop.w < 20 || crop.h < 20) {
      toast.error('Please select a grid area first');
      return;
    }
    setStep('analyzing');
    try {
      const base64 = await getCroppedBase64();

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-grid-layout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ image: base64 }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Analysis failed');
      }

      const { layout } = await resp.json();
      if (!layout || !layout.cells || layout.cells.length === 0) {
        throw new Error('Could not detect a grid layout');
      }

      // Build GridLayout object
      const generated: GridLayout = {
        id: `inspire-${Date.now()}`,
        name: 'Inspired Layout',
        category: 'creative',
        cols: layout.gridCols,
        rows: layout.gridRows,
        cells: layout.cells,
        gridCols: layout.gridCols,
        gridRows: layout.gridRows,
        canvasRatio: layout.canvasRatio || 1,
      };

      toast.success('Layout detected! Opening in Grid Builder…');
      onLayoutGenerated(generated);
    } catch (err: any) {
      console.error('Grid Inspire error:', err);
      toast.error(err.message || 'Failed to analyze layout');
      setStep('crop');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-[480px] mx-auto">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-semibold tracking-wider uppercase text-foreground">Grid Inspire</h1>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <div className="flex-1 flex items-center justify-center px-6">
          <div
            className="w-full max-w-[400px] aspect-square rounded-2xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/40 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFileSelect(file);
              };
              input.click();
            }}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Upload a screenshot</p>
              <p className="text-xs text-muted-foreground mt-1">Drop an image or tap to select</p>
            </div>
          </div>
        </div>
      )}

      {/* Crop Step */}
      {step === 'crop' && imageSrc && (
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2">
            <p className="text-xs text-muted-foreground text-center">
              <Crop className="inline h-3 w-3 mr-1" />
              Drag to select the grid area. Ignore UI elements.
            </p>
          </div>

          <div
            ref={containerRef}
            className="flex-1 relative overflow-hidden cursor-crosshair select-none mx-4 mb-4 rounded-xl bg-black/5"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ touchAction: 'none' }}
          >
            {/* Image */}
            <img
              src={imageSrc}
              className="absolute pointer-events-none"
              style={{
                left: imgDisplay.x,
                top: imgDisplay.y,
                width: imgDisplay.w,
                height: imgDisplay.h,
              }}
              draggable={false}
              alt="Screenshot"
            />

            {/* Dim overlay outside crop */}
            {crop && crop.w > 0 && crop.h > 0 && (
              <>
                {/* SVG mask for dimming */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                  <defs>
                    <mask id="crop-mask">
                      <rect width="100%" height="100%" fill="white" />
                      <rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} fill="black" />
                    </mask>
                  </defs>
                  <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#crop-mask)" />
                </svg>

                {/* Crop border */}
                <div
                  className="absolute border-2 border-primary pointer-events-none"
                  style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h, zIndex: 2 }}
                >
                  {/* Corner handles */}
                  <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-primary rounded-full border-2 border-background" />
                  {/* Grid lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-primary/20" />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 pb-6 pt-2 flex gap-3 max-w-[480px] mx-auto w-full">
            <Button variant="outline" className="flex-1" onClick={() => { setStep('upload'); setImageSrc(null); setCrop(null); }}>
              Re-upload
            </Button>
            <Button className="flex-1 gap-2" onClick={handleAnalyze}>
              <Sparkles className="h-3.5 w-3.5" />
              Detect Layout
            </Button>
          </div>
        </div>
      )}

      {/* Analyzing Step */}
      {step === 'analyzing' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div className="relative">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <Sparkles className="absolute inset-0 m-auto h-4 w-4 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Analyzing layout…</p>
            <p className="text-xs text-muted-foreground mt-1">AI is detecting the grid structure</p>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
