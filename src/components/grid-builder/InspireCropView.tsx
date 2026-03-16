/**
 * InspireCropView — extracted crop-and-analyze step for Grid Inspire.
 * Clean, focused crop interface with dark workspace aesthetic.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Crop, Sparkles } from 'lucide-react';
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
      const m = 0.1;
      setCrop({ x: x + w * m, y: y + h * m, w: w * (1 - 2 * m), h: h * (1 - 2 * m) });
    }
  }, [crop]);

  useEffect(() => {
    if (!containerRef.current || !imgRef.current) return;
    const obs = new ResizeObserver(() => { if (imgRef.current) updateImgDisplay(imgRef.current); });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [updateImgDisplay]);

  const getPointerPos = (e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const isInResizeHandle = (pos: { x: number; y: number }) => {
    if (!crop) return false;
    const s = 20;
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
    const base64 = await getCroppedBase64();
    await onAnalyze(base64);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0b] flex flex-col">
      <div className="px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-white/50 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <p className="text-[10px] text-white/40 flex items-center gap-1.5">
          <Crop className="h-3 w-3" /> Drag to select the grid area
        </p>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-crosshair select-none mx-4 mb-4 rounded-xl bg-white/[0.02]"
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
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              <defs>
                <mask id="inspire-crop-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} fill="black" />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#inspire-crop-mask)" />
            </svg>
            <div
              className="absolute border-2 border-primary pointer-events-none"
              style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h, zIndex: 2 }}
            >
              <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-primary rounded-full border-2 border-[#0a0a0b]" />
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border border-primary/15" />)}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="px-5 pb-8 pt-2 flex gap-3 max-w-sm mx-auto w-full">
        <Button variant="outline" className="flex-1 border-white/10 text-white/70 hover:bg-white/5" onClick={onBack}>
          Re-upload
        </Button>
        <Button className="flex-1 gap-2" onClick={handleAnalyze}>
          <Sparkles className="h-3.5 w-3.5" /> Detect Layout
        </Button>
      </div>
    </div>
  );
}
