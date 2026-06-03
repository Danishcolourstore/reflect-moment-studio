/**
 * Canvas-based export utilities for Grid Builder.
 * Renders grids + frames + text overlays + design elements + logos using original image data — zero compression, lossless PNG output.
 */

import type { GridLayout, GridCellData } from './types';
import type { TextLayer } from './text-overlay-types';
import type { DesignElement } from './element-types';
import type { LogoLayer } from './LogoOverlay';
import type { BackgroundStyle } from './BackgroundStyler';

/** Load an image element from a URL (blob/object URL or data URL) */
export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Draw a rounded rectangle path */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

let grainPatternCache: CanvasPattern | null = null;

function getGrainPattern(ctx: CanvasRenderingContext2D): CanvasPattern {
  if (grainPatternCache) return grainPatternCache;

  const size = 256;
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = size;
  noiseCanvas.height = size;
  const nctx = noiseCanvas.getContext('2d')!;
  const imageData = nctx.createImageData(size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    imageData.data[i] = v;
    imageData.data[i + 1] = v;
    imageData.data[i + 2] = v;
    imageData.data[i + 3] = 128;
  }
  nctx.putImageData(imageData, 0, 0);
  grainPatternCache = ctx.createPattern(noiseCanvas, 'repeat')!;
  return grainPatternCache;
}

function drawGrainOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = getGrainPattern(ctx);
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawCellImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cell: GridCellData,
  x: number,
  y: number,
  cw: number,
  ch: number,
  offsetScale: number,
) {
  const fitMode = cell.fitMode ?? 'cover';
  const ox = cell.offsetX * offsetScale;
  const oy = cell.offsetY * offsetScale;

  if (fitMode === 'fill') {
    ctx.drawImage(img, x + ox, y + oy, cw, ch);
    return;
  }

  if (fitMode === 'contain') {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(x, y, cw, ch);
    const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight) * cell.scale;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, x + (cw - dw) / 2 + ox, y + (ch - dh) / 2 + oy, dw, dh);
    return;
  }

  const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight) * cell.scale;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, x + (cw - dw) / 2 + ox, y + (ch - dh) / 2 + oy, dw, dh);
}

function transformText(text: string, textTransform: TextLayer['textTransform']) {
  if (textTransform === 'uppercase') return text.toUpperCase();
  if (textTransform === 'lowercase') return text.toLowerCase();
  return text;
}

function setTextFill(ctx: CanvasRenderingContext2D, layer: TextLayer, fontSizePx: number) {
  const hasGradient = layer.gradientColors && layer.gradientColors.length === 2;
  if (hasGradient) {
    const grad = ctx.createLinearGradient(0, -fontSizePx / 2, fontSizePx, fontSizePx / 2);
    grad.addColorStop(0, layer.gradientColors![0]);
    grad.addColorStop(1, layer.gradientColors![1]);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = layer.color;
  }
}

function measureLineWidth(ctx: CanvasRenderingContext2D, line: string, letterSpacingPx: number) {
  if (letterSpacingPx <= 0 || line.length === 0) {
    return ctx.measureText(line).width;
  }
  let totalW = 0;
  for (let ci = 0; ci < line.length; ci++) {
    totalW += ctx.measureText(line[ci]).width + (ci < line.length - 1 ? letterSpacingPx : 0);
  }
  return totalW;
}

function drawTextLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  lineY: number,
  layer: TextLayer,
  scale: number,
  startX: number,
) {
  const letterSpacingPx = layer.letterSpacing > 0 ? layer.letterSpacing * scale : 0;
  const fontSizePx = layer.fontSize * scale;
  const highlightPadX = 6 * scale;
  const highlightPadY = 2 * scale;

  const drawChars = (x: number, y: number) => {
    if (letterSpacingPx > 0) {
      let curX = x;
      ctx.textAlign = 'left';
      for (let ci = 0; ci < line.length; ci++) {
        const ch = line[ci];
        if (layer.stroke) {
          ctx.lineWidth = layer.stroke.width * scale;
          ctx.strokeStyle = layer.stroke.color;
          ctx.strokeText(ch, curX, y);
        }
        ctx.fillText(ch, curX, y);
        curX += ctx.measureText(ch).width + letterSpacingPx;
      }
    } else {
      if (layer.stroke) {
        ctx.lineWidth = layer.stroke.width * scale;
        ctx.strokeStyle = layer.stroke.color;
        ctx.strokeText(line, x, y);
      }
      ctx.fillText(line, x, y);
    }
  };

  if (layer.bgHighlight) {
    const lineW = measureLineWidth(ctx, line, letterSpacingPx);
    const boxW = lineW + highlightPadX * 2;
    const boxH = fontSizePx * layer.lineHeight + highlightPadY * 2;
    const boxX = startX - highlightPadX;
    const boxY = lineY - boxH / 2;
    ctx.save();
    ctx.fillStyle = layer.bgHighlight;
    roundRect(ctx, boxX, boxY, boxW, boxH, 3 * scale);
    ctx.fill();
    ctx.restore();
    setTextFill(ctx, layer, fontSizePx);
  }

  drawChars(startX, lineY);

  if (layer.underline) {
    const lineW = measureLineWidth(ctx, line, letterSpacingPx);
    const underlineY = lineY + fontSizePx * 0.35;
    ctx.save();
    ctx.strokeStyle = layer.gradientColors?.[0] ?? layer.color;
    ctx.lineWidth = Math.max(1, scale);
    ctx.beginPath();
    ctx.moveTo(startX, underlineY);
    ctx.lineTo(startX + lineW, underlineY);
    ctx.stroke();
    ctx.restore();
  }
}

function drawTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer, width: number, height: number) {
  const scale = width / 440;

  ctx.save();

  const tx = (layer.x / 100) * width;
  const ty = (layer.y / 100) * height;

  ctx.translate(tx, ty);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  ctx.scale(layer.scale, layer.scale);
  ctx.globalAlpha = layer.opacity;

  const fontSizePx = layer.fontSize * scale;
  const fontStyle = layer.fontStyle === 'italic' ? 'italic' : '';
  ctx.font = `${fontStyle} ${layer.fontWeight} ${fontSizePx}px '${layer.fontFamily}'`;
  ctx.textBaseline = 'middle';

  if (layer.shadow) {
    ctx.shadowOffsetX = layer.shadow.x * scale;
    ctx.shadowOffsetY = layer.shadow.y * scale;
    ctx.shadowBlur = layer.shadow.blur * scale;
    ctx.shadowColor = layer.shadow.color;
  }

  setTextFill(ctx, layer, fontSizePx);

  const text = transformText(layer.text, layer.textTransform);
  const lines = text.split('\n');
  const lineHeightPx = fontSizePx * layer.lineHeight;
  const totalHeight = lines.length * lineHeightPx;
  const startY = -(totalHeight / 2) + lineHeightPx / 2;
  const letterSpacingPx = layer.letterSpacing > 0 ? layer.letterSpacing * scale : 0;

  for (let li = 0; li < lines.length; li++) {
    const lineY = startY + li * lineHeightPx;
    const line = lines[li];
    const lineW = measureLineWidth(ctx, line, letterSpacingPx);

    let startX = 0;
    if (layer.alignment === 'center') startX = -lineW / 2;
    else if (layer.alignment === 'right') startX = -lineW;

    ctx.shadowColor = layer.shadow?.color ?? 'transparent';
    drawTextLine(ctx, line, lineY, layer, scale, startX);
  }

  ctx.restore();
}

/**
 * Render the full grid to a canvas at the specified resolution.
 */
export async function renderGridToCanvas(
  layout: GridLayout,
  cells: GridCellData[],
  width: number,
  height: number,
  textLayers: TextLayer[] = [],
  elements: DesignElement[] = [],
  logo: LogoLayer | null = null,
  background?: BackgroundStyle,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const frame = layout.frame;

  // Background
  if (background && !frame) {
    if (background.type === 'gradient' && background.gradientTo) {
      const angle = ((background.gradientAngle || 180) * Math.PI) / 180;
      const x0 = width / 2 - Math.sin(angle) * (width / 2);
      const y0 = height / 2 - Math.cos(angle) * (height / 2);
      const x1 = width / 2 + Math.sin(angle) * (width / 2);
      const y1 = height / 2 + Math.cos(angle) * (height / 2);
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, background.color);
      grad.addColorStop(1, background.gradientTo);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = background.color;
    }
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = frame?.background || '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  if (background?.type === 'grain' && !frame) {
    drawGrainOverlay(ctx, width, height);
  }

  // Calculate image area based on frame padding
  let areaX = 0;
  let areaY = 0;
  let areaW = width;
  let areaH = height;

  if (frame) {
    const pt = (frame.padding[0] / 100) * width;
    const pr = (frame.padding[1] / 100) * width;
    const pb = (frame.padding[2] / 100) * width;
    const pl = (frame.padding[3] / 100) * width;
    areaX = pl;
    areaY = pt;
    areaW = width - pl - pr;
    areaH = height - pt - pb;

    if (frame.shadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = Math.round(width * 0.03);
      ctx.shadowOffsetY = Math.round(width * 0.008);
      ctx.fillStyle = '#ffffff';
      const sr = (frame.imageRadius / 440) * width;
      roundRect(ctx, areaX, areaY, areaW, areaH, sr);
      ctx.fill();
      ctx.restore();
    }

    if (frame.borderWidth) {
      ctx.save();
      const bw = (frame.borderWidth / 440) * width;
      ctx.strokeStyle = frame.borderColor;
      ctx.lineWidth = bw;
      const sr = (frame.imageRadius / 440) * width;
      roundRect(ctx, areaX, areaY, areaW, areaH, sr);
      ctx.stroke();
      ctx.restore();
    }
  }

  const gap = frame ? 0 : Math.round(width * 0.007);
  const pad = frame ? 0 : gap;

  const innerW = areaW - pad * 2 - gap * (layout.gridCols - 1);
  const innerH = areaH - pad * 2 - gap * (layout.gridRows - 1);
  const colW = innerW / layout.gridCols;
  const rowH = innerH / layout.gridRows;

  const displaySize = 440;
  const offsetScale = width / displaySize;

  for (let i = 0; i < layout.cells.length; i++) {
    const [rs, cs, re, ce] = layout.cells[i];
    const cell = cells[i];

    const x = areaX + pad + (cs - 1) * (colW + gap);
    const y = areaY + pad + (rs - 1) * (rowH + gap);
    const cw = (ce - cs) * colW + (ce - cs - 1) * gap;
    const ch = (re - rs) * rowH + (re - rs - 1) * gap;

    if (!cell.imageUrl) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(x, y, cw, ch);
      continue;
    }

    const img = await loadImageElement(cell.imageUrl);

    ctx.save();

    if (frame?.imageRadius) {
      const sr = (frame.imageRadius / 440) * width;
      roundRect(ctx, x, y, cw, ch, sr);
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(x, y, cw, ch);
      ctx.clip();
    }

    drawCellImage(ctx, img, cell, x, y, cw, ch, offsetScale);
    ctx.restore();
  }

  // ─── Render design elements ───────────────────
  if (elements.length > 0) {
    const scale = width / displaySize;

    for (const el of elements) {
      ctx.save();

      const ex = (el.x / 100) * width;
      const ey = (el.y / 100) * height;
      const ew = el.width * scale;
      const eh = el.height * scale;

      ctx.translate(ex, ey);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.globalAlpha = el.opacity;

      if (el.type === 'circle') {
        ctx.beginPath();
        ctx.ellipse(0, 0, ew / 2, eh / 2, 0, 0, Math.PI * 2);
        if (el.filled) {
          ctx.fillStyle = el.color;
          ctx.fill();
        }
        if (el.borderWidth) {
          ctx.strokeStyle = el.borderColor;
          ctx.lineWidth = el.borderWidth * scale;
          ctx.stroke();
        }
      } else {
        const br = el.borderRadius * scale;
        roundRect(ctx, -ew / 2, -eh / 2, ew, eh, br);
        if (el.filled) {
          ctx.fillStyle = el.color;
          ctx.fill();
        }
        if (el.borderWidth) {
          ctx.strokeStyle = el.borderColor;
          ctx.lineWidth = el.borderWidth * scale;
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }

  // ─── Render logo ──────────────────────────────
  if (logo) {
    try {
      const logoImg = await loadImageElement(logo.imageUrl);
      const scale = width / displaySize;
      const lw = logo.width * scale;
      const lh = (logoImg.naturalHeight / logoImg.naturalWidth) * lw;

      const lx = (logo.x / 100) * width;
      const ly = (logo.y / 100) * height;

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate((logo.rotation * Math.PI) / 180);
      ctx.globalAlpha = logo.opacity;
      ctx.drawImage(logoImg, -lw / 2, -lh / 2, lw, lh);
      ctx.restore();
    } catch {
      // Logo failed to load, skip
    }
  }

  // ─── Render text overlays ───────────────────
  for (const layer of textLayers) {
    drawTextLayer(ctx, layer, width, height);
  }

  return canvas;
}

/** Draw a single cell image for carousel slice export (respects fit mode). */
export function drawCellToCanvas(
  ctx: CanvasRenderingContext2D,
  cell: GridCellData,
  img: HTMLImageElement,
  w: number,
  h: number,
) {
  const offsetScale = w / 440;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  drawCellImage(ctx, img, cell, 0, 0, w, h, offsetScale);
  ctx.restore();
}
