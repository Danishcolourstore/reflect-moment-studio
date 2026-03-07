/**
 * Canvas-based export utilities for Grid Builder.
 * Renders grids + frames + text overlays + design elements + logos using original image data — zero compression, lossless PNG output.
 */

import type { GridLayout, GridCellData } from './types';
import type { TextLayer } from './text-overlay-types';
import type { DesignElement } from './element-types';
import type { LogoLayer } from './LogoOverlay';
import type { BackgroundStyle } from './BackgroundStyler';
import { bgToCss } from './BackgroundStyler';

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
      const angle = (background.gradientAngle || 180) * Math.PI / 180;
      const x0 = width / 2 - Math.sin(angle) * width / 2;
      const y0 = height / 2 - Math.cos(angle) * height / 2;
      const x1 = width / 2 + Math.sin(angle) * width / 2;
      const y1 = height / 2 + Math.cos(angle) * height / 2;
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

  // Calculate image area based on frame padding
  let areaX = 0, areaY = 0, areaW = width, areaH = height;

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

  // Calculate grid within image area
  const gap = frame ? 0 : Math.round(width * 0.007);
  const pad = frame ? 0 : gap;

  const innerW = areaW - pad * 2 - gap * (layout.gridCols - 1);
  const innerH = areaH - pad * 2 - gap * (layout.gridRows - 1);
  const colW = innerW / layout.gridCols;
  const rowH = innerH / layout.gridRows;

  const displaySize = 440;

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

    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight) * cell.scale;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;

    const offsetScale = width / displaySize;
    const ox = cell.offsetX * offsetScale;
    const oy = cell.offsetY * offsetScale;

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

    ctx.drawImage(img, x + (cw - dw) / 2 + ox, y + (ch - dh) / 2 + oy, dw, dh);
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
  if (textLayers.length > 0) {
    const scale = width / displaySize;

    for (const layer of textLayers) {
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
      ctx.fillStyle = layer.color;
      ctx.textAlign = layer.alignment;
      ctx.textBaseline = 'middle';

      if (layer.shadow) {
        ctx.shadowOffsetX = layer.shadow.x * scale;
        ctx.shadowOffsetY = layer.shadow.y * scale;
        ctx.shadowBlur = layer.shadow.blur * scale;
        ctx.shadowColor = layer.shadow.color;
      }

      let text = layer.text;
      if (layer.textTransform === 'uppercase') text = text.toUpperCase();
      else if (layer.textTransform === 'lowercase') text = text.toLowerCase();

      const lines = text.split('\n');
      const lineHeightPx = fontSizePx * layer.lineHeight;
      const totalHeight = lines.length * lineHeightPx;
      const startY = -(totalHeight / 2) + lineHeightPx / 2;

      if (layer.letterSpacing > 0) {
        const spacingPx = layer.letterSpacing * scale;

        for (let li = 0; li < lines.length; li++) {
          const lineY = startY + li * lineHeightPx;
          const line = lines[li];

          let totalW = 0;
          for (let ci = 0; ci < line.length; ci++) {
            totalW += ctx.measureText(line[ci]).width + (ci < line.length - 1 ? spacingPx : 0);
          }

          let startX = 0;
          if (layer.alignment === 'center') startX = -totalW / 2;
          else if (layer.alignment === 'right') startX = -totalW;

          let curX = startX;
          ctx.textAlign = 'left';
          for (let ci = 0; ci < line.length; ci++) {
            ctx.fillText(line[ci], curX, lineY);
            curX += ctx.measureText(line[ci]).width + spacingPx;
          }
        }
      } else {
        for (let li = 0; li < lines.length; li++) {
          const lineY = startY + li * lineHeightPx;
          ctx.fillText(lines[li], 0, lineY);
        }
      }

      ctx.restore();
    }
  }

  return canvas;
}
