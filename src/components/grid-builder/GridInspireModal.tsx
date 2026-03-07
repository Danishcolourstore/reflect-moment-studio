import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Crop, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { GridLayout } from './types';
import type { TextLayer } from './text-overlay-types';
import { createTextLayer, FONTS } from './text-overlay-types';

interface Props {
  onClose: () => void;
  onLayoutGenerated: (layout: GridLayout, textLayers: TextLayer[]) => void;
}

type Step = 'upload' | 'crop' | 'analyzing';

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DetectedTextBlock {
  text: string;
  fontGroup: 'serif' | 'sans' | 'script';
  fontWeight: number;
  fontSize: number;
  color: string;
  letterSpacing: number;
  lineHeight: number;
  alignment: 'left' | 'center' | 'right';
  textTransform: 'none' | 'uppercase' | 'lowercase';
  fontStyle: 'normal' | 'italic';
  x: number;
  y: number;
  hasShadow: boolean;
}

/** Map detected fontGroup to the best matching font from our library */
function mapFontFamily(group: 'serif' | 'sans' | 'script'): string {
  const defaults: Record<string, string> = {
    serif: 'Cormorant Garamond',
    sans: 'Montserrat',
    script: 'Great Vibes',
  };
  return defaults[group] || 'Cormorant Garamond';
}

/** Snap weight to the nearest available weight for the chosen font */
function snapWeight(family: string, weight: number): number {
  const font = FONTS.find(f => f.family === family);
  if (!font) return 400;
  return font.weights.reduce((prev, curr) =>
    Math.abs(curr - weight) < Math.abs(prev - weight) ? curr : prev
  );
}

/** Convert detected text blocks to TextLayer objects */
function textBlocksToLayers(blocks: DetectedTextBlock[]): TextLayer[] {
  return blocks.map((block) => {
    const fontFamily = mapFontFamily(block.fontGroup);
    const fontWeight = snapWeight(fontFamily, block.fontWeight);

    return createTextLayer({
      text: block.text,
      fontFamily,
      fontWeight,
      fontSize: Math.max(8, Math.min(60, block.fontSize)),
      color: block.color || '#ffffff',
      letterSpacing: Math.max(0, Math.min(20, block.letterSpacing)),
      lineHeight: Math.max(0.8, Math.min(3, block.lineHeight)),
      alignment: block.alignment,
      textTransform: block.textTransform,
      fontStyle: block.fontStyle,
      x: Math.max(5, Math.min(95, block.x)),
      y: Math.max(5, Math.min(95, block.y)),
      opacity: 1,
      rotation: 0,
      scale: 1,
      shadow: block.hasShadow
        ? { x: 0, y: 2, blur: 10, color: 'rgba(0,0,0,0.45)' }
        : null,
    });
  });
}

export default function GridInspireModal({ onClose, onLayoutGenerated }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [dragging, setDragging] = useState<'none' | 'create' | 'move' | 'resize'>('none');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCropStart, setDragCropStart] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
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

  useEffect(() => {
    if (!containerRef.current || !imgRef.current) return;
    const obs = new ResizeObserver(() => {
      if (imgRef.current) updateImgDisplay(imgRef.current);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [updateImgDisplay]);

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
      setCrop({
        x: Math.min(pos.x, dragStart.x),
        y: Math.min(pos.y, dragStart.y),
        w: Math.abs(pos.x - dragStart.x),
        h: Math.abs(pos.y - dragStart.y),
      });
    } else if (dragging === 'move') {
      setCrop({
        x: Math.max(imgDisplay.x, Math.min(imgDisplay.x + imgDisplay.w - dragCropStart.w, dragCropStart.x + dx)),
        y: Math.max(imgDisplay.y, Math.min(imgDisplay.y + imgDisplay.h - dragCropStart.h, dragCropStart.y + dy)),
        w: dragCropStart.w,
        h: dragCropStart.h,
      });
    } else if (dragging === 'resize') {
      setCrop({ ...dragCropStart, w: Math.max(40, dragCropStart.w + dx), h: Math.max(40, dragCropStart.h + dy) });
    }
  };

  const handlePointerUp = () => setDragging('none');

  const getCroppedBase64 = useCallback(async (): Promise<string> => {
    const img = imgRef.current!;
    const c = crop!;
    const sx = ((c.x - imgDisplay.x) / imgDisplay.w) * img.naturalWidth;
    const sy = ((c.y - imgDisplay.y) / imgDisplay.h) * img.naturalHeight;
    const sw = (c.w / imgDisplay.w) * img.naturalWidth;
    const sh = (c.h / imgDisplay.h) * img.naturalHeight;
    const canvas = document.createElement('canvas');
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

      const { layout, textBlocks } = await resp.json();
      if (!layout || !layout.cells || layout.cells.length === 0) {
        throw new Error('Could not detect a grid layout');
      }

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

      // Convert detected text blocks to editable TextLayer objects
      const detectedTextLayers = textBlocks && Array.isArray(textBlocks) && textBlocks.length > 0
        ? textBlocksToLayers(textBlocks)
        : [];

      const textCount = detectedTextLayers.length;
      toast.success(
        textCount > 0
          ? `Layout + ${textCount} text block${textCount > 1 ? 's' : ''} detected!`
          : 'Layout detected! Opening in Grid Builder…'
      );

      onLayoutGenerated(generated, detectedTextLayers);
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
              <p className="text-xs text-muted-foreground mt-1">
                Drop an image or tap to select
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-3">
                Layout + typography will be detected automatically
              </p>
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
              Drag to select the grid area. Text + layout will be detected.
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

            {crop && crop.w > 0 && crop.h > 0 && (
              <>
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                  <defs>
                    <mask id="crop-mask">
                      <rect width="100%" height="100%" fill="white" />
                      <rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} fill="black" />
                    </mask>
                  </defs>
                  <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#crop-mask)" />
                </svg>

                <div
                  className="absolute border-2 border-primary pointer-events-none"
                  style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h, zIndex: 2 }}
                >
                  <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-primary rounded-full border-2 border-background" />
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-primary/20" />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

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
            <p className="text-sm font-medium text-foreground">Analyzing layout & typography…</p>
            <p className="text-xs text-muted-foreground mt-1">AI is detecting grid structure and text elements</p>
          </div>
        </div>
      )}
    </div>
  );
}
