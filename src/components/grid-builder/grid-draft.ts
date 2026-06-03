/**
 * Grid Builder draft autosave.
 * Persists the working session to localStorage so a photographer can leave
 * and resume. Frame images are downscaled to keep within storage quota.
 */
import type { GridCellData, CellFitMode } from "./types";
import type { TextLayer } from "./text-overlay-types";
import type { BackgroundStyle } from "./BackgroundStyler";

const KEY = "mirror_grid_draft_v1";
const MAX_DIM = 1024;
const JPEG_Q = 0.7;

const cache = new Map<string, string>();

interface DraftCell {
  imageUrl: string | null;
  offsetX: number;
  offsetY: number;
  scale: number;
  fitMode?: CellFitMode;
}

export interface GridDraft {
  layoutId: string;
  savedAt: number;
  cells: DraftCell[];
  textLayers: TextLayer[];
  background: BackgroundStyle;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function downscale(url: string): Promise<string | null> {
  if (cache.has(url)) return cache.get(url)!;
  try {
    const img = await loadImg(url);
    const ratio = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * ratio);
    const h = Math.round(img.naturalHeight * ratio);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d")!.drawImage(img, 0, 0, w, h);
    const data = c.toDataURL("image/jpeg", JPEG_Q);
    cache.set(url, data);
    return data;
  } catch {
    return null;
  }
}

export async function saveDraft(input: {
  layoutId: string;
  cells: GridCellData[];
  textLayers: TextLayer[];
  background: BackgroundStyle;
}): Promise<void> {
  const cells: DraftCell[] = await Promise.all(
    input.cells.map(async (c) => ({
      imageUrl: c.imageUrl
        ? c.imageUrl.startsWith("data:")
          ? c.imageUrl
          : await downscale(c.imageUrl)
        : null,
      offsetX: c.offsetX,
      offsetY: c.offsetY,
      scale: c.scale,
      fitMode: c.fitMode,
    })),
  );

  const draft: GridDraft = {
    layoutId: input.layoutId,
    savedAt: Date.now(),
    cells,
    textLayers: input.textLayers,
    background: input.background,
  };

  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Quota exceeded — store metadata without image bytes
    try {
      const lite: GridDraft = { ...draft, cells: cells.map((c) => ({ ...c, imageUrl: null })) };
      localStorage.setItem(KEY, JSON.stringify(lite));
    } catch {
      /* give up silently */
    }
  }
}

export function loadDraft(): GridDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GridDraft) : null;
  } catch {
    return null;
  }
}

export function hasDraft(): boolean {
  const d = loadDraft();
  return !!(d && Array.isArray(d.cells) && d.cells.some((c) => c.imageUrl));
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
