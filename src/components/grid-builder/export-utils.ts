/**
 * Canvas-based export utilities for Grid Builder.
 * Renders grids using original image data — zero compression, lossless PNG output.
 */

import type { GridLayout, GridCellData } from './types';

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

/**
 * Render the full grid to a canvas at the specified resolution.
 * Uses original image data with cover-fit placement — no quality loss.
 */
export async function renderGridToCanvas(
  layout: GridLayout,
  cells: GridCellData[],
  width: number,
  height: number,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const gap = Math.round(width * 0.007); // proportional gap
  const pad = gap;

  const innerW = width - pad * 2 - gap * (layout.gridCols - 1);
  const innerH = height - pad * 2 - gap * (layout.gridRows - 1);
  const colW = innerW / layout.gridCols;
  const rowH = innerH / layout.gridRows;

  // CSS grid preview uses ~440px as display width
  const displaySize = 440;

  for (let i = 0; i < layout.cells.length; i++) {
    const [rs, cs, re, ce] = layout.cells[i];
    const cell = cells[i];

    // Calculate cell position and size
    const x = pad + (cs - 1) * (colW + gap);
    const y = pad + (rs - 1) * (rowH + gap);
    const cw = (ce - cs) * colW + (ce - cs - 1) * gap;
    const ch = (re - rs) * rowH + (re - rs - 1) * gap;

    if (!cell.imageUrl) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(x, y, cw, ch);
      continue;
    }

    const img = await loadImageElement(cell.imageUrl);

    // Cover-fit: scale to fill cell, then apply user offset
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight) * cell.scale;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;

    // Scale offset from display coordinates to export coordinates
    const offsetScale = width / displaySize;
    const ox = cell.offsetX * offsetScale;
    const oy = cell.offsetY * offsetScale;

    // Clip to cell bounds
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, cw, ch);
    ctx.clip();

    ctx.drawImage(
      img,
      x + (cw - dw) / 2 + ox,
      y + (ch - dh) / 2 + oy,
      dw,
      dh,
    );

    ctx.restore();
  }

  return canvas;
}
