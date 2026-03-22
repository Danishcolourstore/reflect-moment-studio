/**
 * Canvas Effects Renderer — applies retouching effects via Canvas 2D API.
 * No CSS filters on DOM elements. All processing is ctx.filter + compositing.
 */

export interface RetouchParams {
  // Retouch sub-tools
  texture: number;    // skin_texture_preservation
  smooth: number;     // smoothing_radius (retouch sub)
  sharp: number;      // texture_sharpness
  blend: number;      // blend_uniformity
  glow: number;       // skin_luminosity

  // Standalone tools
  freqSep: number;    // frequency separation intensity
  smoothStr: number;  // skin smoothing strength

  // Dodge & Burn
  highlights: number;
  shadows: number;
  contour: number;

  // Others
  sharpenAmt: number;
  eyeClarity: number;
  teethWhiten: number;

  // Brush tools (sizes only — no real-time canvas effect from slider alone)
  healSize: number;
  liqSize: number;
  hairSize: number;
}

/** Create an offscreen canvas copy of the source */
function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = source.width;
  c.height = source.height;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(source, 0, 0);
  return c;
}

/** Apply a blur to a canvas and return the result */
function blurCanvas(source: HTMLCanvasElement, radius: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = source.width;
  c.height = source.height;
  const ctx = c.getContext('2d')!;
  if (radius > 0) {
    ctx.filter = `blur(${radius}px)`;
  }
  ctx.drawImage(source, 0, 0);
  ctx.filter = 'none';
  return c;
}

/** Apply brightness/contrast filter and return canvas */
function filterCanvas(
  source: HTMLCanvasElement,
  filter: string
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = source.width;
  c.height = source.height;
  const ctx = c.getContext('2d')!;
  ctx.filter = filter;
  ctx.drawImage(source, 0, 0);
  ctx.filter = 'none';
  return c;
}

/**
 * Main rendering function. Reads params and applies effects to outputCanvas.
 * sourceCanvas must contain the original unedited image.
 */
export function applyRetouchEffects(
  sourceCanvas: HTMLCanvasElement,
  params: Record<string, number>,
  outputCanvas: HTMLCanvasElement
): void {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  if (w === 0 || h === 0) return;

  outputCanvas.width = w;
  outputCanvas.height = h;
  const ctx = outputCanvas.getContext('2d')!;

  // Start with the source
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(sourceCanvas, 0, 0);

  const get = (key: string) => params[key] ?? 0;

  // ─── 1. FREQUENCY SEPARATION ───
  const freqInt = get('freqSep');
  const smoothRadius = get('smooth'); // retouch sub-tool
  const textureVal = get('texture');
  const blendVal = get('blend');

  const effectiveBlur = Math.max(freqInt, smoothRadius) * 0.15; // 0–15px

  if (effectiveBlur > 0.3) {
    // Low frequency (blurred) layer
    const lowFreq = blurCanvas(outputCanvas, effectiveBlur);

    // Blend low frequency (smoothing) at proportional opacity
    const smoothOpacity = Math.max(freqInt, smoothRadius) / 100;
    ctx.globalAlpha = smoothOpacity * 0.6; // keep subtle
    ctx.drawImage(lowFreq, 0, 0);
    ctx.globalAlpha = 1;

    // Texture preservation: blend back original detail
    if (textureVal > 0) {
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = (textureVal / 100) * 0.3;
      ctx.drawImage(sourceCanvas, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  // Blend uniformity: very subtle extra blur for color smoothing
  if (blendVal > 5) {
    const blendBlur = blurCanvas(outputCanvas, blendVal * 0.02);
    ctx.globalAlpha = (blendVal / 100) * 0.15;
    ctx.drawImage(blendBlur, 0, 0);
    ctx.globalAlpha = 1;
  }

  // ─── 2. SKIN SMOOTHING (standalone) ───
  const smoothStr = get('smoothStr');
  if (smoothStr > 2) {
    const blurRadius = smoothStr * 0.12;
    const blurred = blurCanvas(outputCanvas, blurRadius);
    ctx.globalAlpha = (smoothStr / 100) * 0.5;
    ctx.drawImage(blurred, 0, 0);
    ctx.globalAlpha = 1;
  }

  // ─── 3. DODGE & BURN ───
  const hlBoost = get('highlights');
  if (hlBoost > 2) {
    const bright = filterCanvas(outputCanvas, `brightness(${1 + hlBoost * 0.005})`);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = hlBoost / 200;
    ctx.drawImage(bright, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  const shadowSculpt = get('shadows');
  if (shadowSculpt > 2) {
    const dark = filterCanvas(outputCanvas, `brightness(${1 - shadowSculpt * 0.004})`);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = shadowSculpt / 200;
    ctx.drawImage(dark, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  const contourStr = get('contour');
  if (contourStr > 2) {
    const contrasted = filterCanvas(outputCanvas, `contrast(${1 + contourStr * 0.003})`);
    ctx.globalAlpha = (contourStr / 100) * 0.4;
    ctx.drawImage(contrasted, 0, 0);
    ctx.globalAlpha = 1;
  }

  // ─── 4. SHARPENING ───
  const sharpenAmt = get('sharpenAmt');
  const sharpFromRetouch = get('sharp');
  const totalSharpen = Math.max(sharpenAmt, sharpFromRetouch);
  if (totalSharpen > 2) {
    // Unsharp mask simulation: subtract blur, add contrast
    const current = cloneCanvas(outputCanvas);
    const blurred = blurCanvas(current, 1);
    // Apply as contrast increase to simulate sharpening
    const sharpened = filterCanvas(current, `contrast(${1 + totalSharpen * 0.004})`);
    ctx.globalAlpha = (totalSharpen / 100) * 0.5;
    ctx.drawImage(sharpened, 0, 0);
    ctx.globalAlpha = 1;
  }

  // ─── 5. EYE ENHANCEMENT ───
  const eyeClarity = get('eyeClarity');
  if (eyeClarity > 2) {
    // Global subtle clarity (contrast + saturation boost)
    // TODO: add face detection for targeted eye enhancement
    const enhanced = filterCanvas(
      outputCanvas,
      `contrast(${1 + eyeClarity * 0.002}) saturate(${1 + eyeClarity * 0.001})`
    );
    ctx.globalAlpha = (eyeClarity / 100) * 0.3;
    ctx.drawImage(enhanced, 0, 0);
    ctx.globalAlpha = 1;
  }

  // ─── 6. TEETH WHITENING ───
  const teethWhiten = get('teethWhiten');
  if (teethWhiten > 5) {
    // Desaturate yellows globally
    // TODO: add face detection for targeted teeth whitening
    const desatAmt = teethWhiten / 100;
    try {
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        // Detect yellowish pixels
        if (r > 150 && g > 150 && b < 120) {
          const avg = (r + g + b) / 3;
          d[i] = Math.round(r + (avg - r) * desatAmt * 0.4);
          d[i + 1] = Math.round(g + (avg - g) * desatAmt * 0.4);
          d[i + 2] = Math.round(b + (avg - b) * desatAmt * 0.3 + teethWhiten * 0.1);
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } catch {
      // CORS or security error — skip pixel manipulation
    }
  }

  // ─── 7. GLOW / LUMINOSITY ───
  const glowVal = get('glow');
  if (glowVal > 2) {
    const bright = filterCanvas(outputCanvas, `brightness(${1 + glowVal * 0.003})`);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = glowVal / 300;
    ctx.drawImage(bright, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}
