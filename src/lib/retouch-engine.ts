import type { RefynToolValues } from '@/components/refyn/refyn-types';
import type { RefynFilter } from '@/components/refyn/refyn-filters';

export interface ExportPreset {
  name: string;
  label: string;
  description: string;
  maxWidth?: number;
  maxHeight?: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number;
}

export const EXPORT_PRESETS: ExportPreset[] = [
  { name: 'original', label: 'Full Quality', description: 'Original resolution · 95% quality', format: 'image/jpeg', quality: 0.95 },
  { name: 'instagram', label: 'Instagram Quality', description: '1080 × 1350 · Optimized', maxWidth: 1080, maxHeight: 1350, format: 'image/jpeg', quality: 0.90 },
  { name: 'web', label: 'Web Optimized', description: 'Max 2048px · Compressed', maxWidth: 2048, maxHeight: 2048, format: 'image/jpeg', quality: 0.85 },
  { name: 'print', label: 'Print Ready', description: 'Original resolution · PNG lossless', format: 'image/png', quality: 1.0 },
];

export function buildCanvasFilter(
  v: RefynToolValues,
  overrides?: RefynFilter['cssOverrides']
): string {
  const freq = v.frequency / 100;
  const lum = v.lumina / 100;
  const sculpt = v.sculpt / 100;
  const tex = v.layerTexture / 100;
  const tone = v.layerTone / 100;
  const outfitV = v.outfit / 100;
  const jewelV = v.jewellery / 100;
  const hairV = v.hair / 100;

  let brightness = 1 + 0.06 * lum + 0.03 * sculpt + 0.02 * tone + 0.02 * outfitV + 0.015 * jewelV;
  let contrast = 1 + 0.1 * sculpt + 0.05 * tex + 0.04 * freq + 0.06 * outfitV + 0.04 * hairV;
  let saturate = 1 + 0.12 * tone + 0.05 * lum + 0.08 * outfitV + 0.04 * jewelV + 0.03 * hairV;
  const blur = freq > 0 ? freq * 0.3 : 0;
  let sepia = lum * 0.04 + jewelV * 0.02;
  const sharpness = 1 + 0.05 * outfitV + 0.04 * hairV + 0.03 * jewelV;
  let hueRotate = 0;

  if (overrides) {
    if (overrides.brightness) brightness *= overrides.brightness;
    if (overrides.contrast) contrast *= overrides.contrast;
    if (overrides.saturate) saturate *= overrides.saturate;
    if (overrides.sepia) sepia += overrides.sepia;
    if (overrides.hueRotate) hueRotate = overrides.hueRotate;
  }

  return `brightness(${brightness.toFixed(4)}) contrast(${(contrast * sharpness).toFixed(4)}) saturate(${saturate.toFixed(4)}) blur(${blur.toFixed(2)}px) sepia(${sepia.toFixed(4)}) hue-rotate(${hueRotate}deg)`;
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cw: number,
  ch: number
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const imgRatio = iw / ih;
  const canvasRatio = cw / ch;

  let sx = 0, sy = 0, sw = iw, sh = ih;

  if (imgRatio > canvasRatio) {
    sw = ih * canvasRatio;
    sx = (iw - sw) / 2;
  } else {
    sh = iw / canvasRatio;
    sy = (ih - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
}

export class RetouchEngine {
  private img: HTMLImageElement | null = null;
  private fullWidth = 0;
  private fullHeight = 0;
  private noiseCache: Map<string, HTMLCanvasElement> = new Map();

  async loadImage(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.img = img;
        this.fullWidth = img.naturalWidth;
        this.fullHeight = img.naturalHeight;
        this.noiseCache.clear();
        resolve({ width: this.fullWidth, height: this.fullHeight });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  renderPreview(
    canvas: HTMLCanvasElement,
    values: RefynToolValues,
    overrides?: RefynFilter['cssOverrides']
  ): void {
    if (!this.img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw source image with pixel-modifying canvas filters
    ctx.filter = buildCanvasFilter(values, overrides);
    drawImageCover(ctx, this.img, w, h);
    ctx.filter = 'none';

    // Bloom/glow via screen-blend of brightened blurred copy
    if (values.ghostLight > 0) {
      this.applyGlow(ctx, w, h, values.ghostLight / 100);
    }

    // Film grain
    if (values.grain.strength > 0) {
      this.applyGrain(ctx, w, h, values.grain);
    }
  }

  private applyGlow(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    amount: number
  ): void {
    // Capture current canvas state
    const temp = document.createElement('canvas');
    temp.width = w;
    temp.height = h;
    const tCtx = temp.getContext('2d')!;
    tCtx.drawImage(ctx.canvas, 0, 0);

    // Bloom: screen-blend a brightened, blurred copy
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = amount * 0.15;
    ctx.filter = `brightness(1.5) blur(${Math.round(amount * 8)}px)`;
    ctx.drawImage(temp, 0, 0);
    ctx.restore();
  }

  private getNoiseCanvas(w: number, h: number, style: string): HTMLCanvasElement {
    const key = `${w}x${h}_${style}`;
    if (this.noiseCache.has(key)) return this.noiseCache.get(key)!;

    const nc = document.createElement('canvas');
    nc.width = w;
    nc.height = h;
    const nCtx = nc.getContext('2d')!;
    const imageData = nCtx.createImageData(w, h);
    const data = imageData.data;

    const intensity = style === 'film' ? 0.5 : style === 'texture' ? 0.35 : 0.7;

    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 255 * intensity;
      data[i] = 128 + n;
      data[i + 1] = 128 + n;
      data[i + 2] = 128 + n;
      data[i + 3] = 255;
    }
    nCtx.putImageData(imageData, 0, 0);
    this.noiseCache.set(key, nc);
    return nc;
  }

  private applyGrain(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    grain: RefynToolValues['grain']
  ): void {
    const nc = this.getNoiseCanvas(w, h, grain.style);

    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = (grain.strength / 100) * 0.25;

    if (grain.shadowsOnly) {
      const temp = document.createElement('canvas');
      temp.width = w;
      temp.height = h;
      const tCtx = temp.getContext('2d')!;
      tCtx.drawImage(nc, 0, 0);
      tCtx.globalCompositeOperation = 'destination-in';
      const grad = tCtx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.3, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,1)');
      tCtx.fillStyle = grad;
      tCtx.fillRect(0, 0, w, h);
      ctx.drawImage(temp, 0, 0);
    } else {
      ctx.drawImage(nc, 0, 0);
    }

    ctx.restore();
  }

  async exportBlob(
    values: RefynToolValues,
    overrides: RefynFilter['cssOverrides'] | undefined,
    preset: ExportPreset,
    onProgress?: (p: number) => void
  ): Promise<Blob> {
    if (!this.img) throw new Error('No image loaded');

    onProgress?.(0.1);

    // Calculate export dimensions
    let w = this.fullWidth;
    let h = this.fullHeight;

    if (preset.maxWidth && preset.maxHeight) {
      const ratio = Math.min(preset.maxWidth / w, preset.maxHeight / h, 1);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    onProgress?.(0.2);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Apply pixel-modifying filters
    ctx.filter = buildCanvasFilter(values, overrides);
    ctx.drawImage(this.img, 0, 0, w, h);
    ctx.filter = 'none';

    onProgress?.(0.5);

    if (values.ghostLight > 0) {
      this.applyGlow(ctx, w, h, values.ghostLight / 100);
    }

    onProgress?.(0.7);

    if (values.grain.strength > 0) {
      // Use fresh noise at export resolution
      const savedCache = this.noiseCache;
      this.noiseCache = new Map();
      this.applyGrain(ctx, w, h, values.grain);
      this.noiseCache = savedCache;
    }

    onProgress?.(0.9);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onProgress?.(1.0);
            resolve(blob);
          } else {
            reject(new Error('Failed to export'));
          }
        },
        preset.format,
        preset.quality
      );
    });
  }

  getSourceDimensions() {
    return { width: this.fullWidth, height: this.fullHeight };
  }

  isLoaded() {
    return this.img !== null;
  }

  dispose() {
    this.img = null;
    this.noiseCache.clear();
  }
}
