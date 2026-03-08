/**
 * Instagram Feed Planner — 3×3 and 6×3 grid planners
 * with drag-to-reorder, crop editing, and 1080px tile export.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Download, Grid3X3, LayoutGrid, Plus, Trash2,
  ZoomIn, ZoomOut, Move, GripVertical, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

/* ─── Tokens ─── */
const IG = {
  bg: '#000000', surface: '#121212', surface2: '#1C1C1C',
  border: '#262626', text: '#FAFAFA', textSecondary: '#A8A8A8',
  blue: '#0095F6', font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
} as const;

/* ─── Types ─── */
interface Tile {
  id: string;
  imageUrl: string | null;
  cropX: number;
  cropY: number;
  cropZoom: number;
}

type GridSize = '3x3' | '6x3';

const GRID_CONFIGS: Record<GridSize, { rows: number; cols: number; total: number; label: string }> = {
  '3x3': { rows: 3, cols: 3, total: 9, label: '3 × 3 (9 posts)' },
  '6x3': { rows: 6, cols: 3, total: 18, label: '6 × 3 (18 posts)' },
};

const TILE_PX = 1080;

function makeTile(): Tile {
  return { id: crypto.randomUUID(), imageUrl: null, cropX: 0.5, cropY: 0.5, cropZoom: 1 };
}

/* ─── Crop modal ─── */
function CropModal({ tile, onUpdate, onClose }: {
  tile: Tile;
  onUpdate: (u: Partial<Tile>) => void;
  onClose: () => void;
}) {
  if (!tile.imageUrl) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="rounded-2xl max-w-sm w-full overflow-hidden bg-card border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <p className="text-sm font-medium text-foreground">Adjust Crop</p>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4">
          <div className="relative w-full aspect-square rounded-lg overflow-hidden mx-auto" style={{ maxWidth: 280 }}>
            <img src={tile.imageUrl} alt="" className="absolute inset-0 w-full h-full"
              style={{
                objectFit: 'cover',
                objectPosition: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
                transform: `scale(${tile.cropZoom})`,
                transformOrigin: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
              }} />
          </div>
        </div>
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-muted-foreground">Horizontal</span>
              <input type="range" min={0} max={100} value={tile.cropX * 100}
                onChange={e => onUpdate({ cropX: +e.target.value / 100 })} className="w-full h-1 accent-primary" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">Vertical</span>
              <input type="range" min={0} max={100} value={tile.cropY * 100}
                onChange={e => onUpdate({ cropY: +e.target.value / 100 })} className="w-full h-1 accent-primary" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" />
            <input type="range" min={100} max={300} value={tile.cropZoom * 100}
              onChange={e => onUpdate({ cropZoom: +e.target.value / 100 })} className="flex-1 h-1 accent-primary" />
            <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <Button onClick={onClose} className="w-full" size="sm">Done</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Canvas render ─── */
function renderCrop(url: string, cx: number, cy: number, zoom: number, sz: number): Promise<HTMLCanvasElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = sz;
      const ctx = c.getContext('2d')!;
      const min = Math.min(img.width, img.height);
      const crop = min / zoom;
      const mx = img.width - crop;
      const my = img.height - crop;
      ctx.drawImage(img, Math.max(0, cx * mx), Math.max(0, cy * my), crop, crop, 0, 0, sz, sz);
      res(c);
    };
    img.onerror = rej;
    img.src = url;
  });
}

/* ─── Main ─── */
interface Props {
  photos: string[];
  username?: string;
  onClose: () => void;
}

export default function InstagramFeedPlanner({ photos, username = 'photographer', onClose }: Props) {
  const [gridSize, setGridSize] = useState<GridSize>('3x3');
  const [tiles, setTiles] = useState<Tile[]>(() => Array.from({ length: 9 }, makeTile));
  const [editId, setEditId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const assignTarget = useRef<number>(0);

  const config = GRID_CONFIGS[gridSize];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const switchGrid = (size: GridSize) => {
    setGridSize(size);
    setTiles(Array.from({ length: GRID_CONFIGS[size].total }, makeTile));
  };

  const updateTile = (id: string, u: Partial<Tile>) =>
    setTiles(prev => prev.map(t => t.id === id ? { ...t, ...u } : t));

  const assignPhoto = (idx: number, url: string) => {
    setTiles(prev => prev.map((t, i) => i === idx ? { ...t, imageUrl: url, cropX: 0.5, cropY: 0.5, cropZoom: 1 } : t));
  };

  const removeTile = (idx: number) => {
    setTiles(prev => prev.map((t, i) => i === idx ? { ...t, imageUrl: null } : t));
  };

  // Drag reorder
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (targetIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    // Check if it's a photo URL from the pool
    const url = e.dataTransfer.getData('text/plain');
    if (url?.startsWith('http') || url?.startsWith('blob:') || url?.startsWith('data:')) {
      assignPhoto(targetIdx, url);
    } else if (dragIdx !== null && dragIdx !== targetIdx) {
      setTiles(prev => {
        const n = [...prev];
        const tmp = n[dragIdx];
        n[dragIdx] = n[targetIdx];
        n[targetIdx] = tmp;
        return n;
      });
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleFileSelect = (idx: number) => {
    assignTarget.current = idx;
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    assignPhoto(assignTarget.current, url);
    e.target.value = '';
  };

  // Auto-fill from photos pool
  const autoFill = () => {
    setTiles(prev => prev.map((t, i) => {
      if (i < photos.length) return { ...t, imageUrl: photos[i], cropX: 0.5, cropY: 0.5, cropZoom: 1 };
      return t;
    }));
    toast.success(`Filled ${Math.min(photos.length, config.total)} tiles`);
  };

  // Export
  const handleExport = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      const filled = tiles.filter(t => t.imageUrl);
      if (filled.length === 0) { toast.error('No images to export'); return; }

      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        if (!t.imageUrl) continue;
        const canvas = await renderCrop(t.imageUrl, t.cropX, t.cropY, t.cropZoom, TILE_PX);
        const blob = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), 'image/jpeg', 0.95));
        zip.file(`${String(i + 1).padStart(2, '0')}_post.jpg`, blob);
      }

      zip.file('POSTING_GUIDE.txt',
        `Instagram Feed Planner — Posting Guide\n${'='.repeat(40)}\n\nGrid: ${config.label}\n\n` +
        `Post images in REVERSE order (last numbered file first).\n\n` +
        tiles.map((t, i) => t.imageUrl ? `${i + 1}. ${String(i + 1).padStart(2, '0')}_post.jpg` : `${i + 1}. (empty)`).join('\n') +
        `\n\nTile Size: ${TILE_PX}×${TILE_PX}px\nFormat: JPG (95% quality)`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `instagram-feed-${gridSize}.zip`);
      toast.success('Feed grid exported!');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const filled = tiles.filter(t => t.imageUrl).length;
  const editTile = tiles.find(t => t.id === editId);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-semibold tracking-wider uppercase text-foreground">Feed Planner</h1>
              <p className="text-[10px] text-muted-foreground">{config.label} · {filled}/{config.total} tiles</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Grid size toggle */}
            <div className="flex bg-muted/50 rounded-full p-0.5">
              {(Object.keys(GRID_CONFIGS) as GridSize[]).map(s => (
                <button
                  key={s}
                  onClick={() => switchGrid(s)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wider transition-colors ${
                    gridSize === s ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {photos.length > 0 && (
              <Button size="sm" variant="outline" onClick={autoFill} className="text-[10px] h-7">
                Auto Fill
              </Button>
            )}
            <Button size="sm" onClick={handleExport} disabled={exporting || filled === 0} className="gap-1.5 text-[10px] h-7">
              <Download className="h-3 w-3" />
              {exporting ? 'Exporting…' : 'Export'}
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 flex items-start justify-center px-4 pt-5 pb-24 overflow-auto">
        <div className="w-full max-w-[390px]">
          {/* Instagram profile header mock */}
          <div className="mb-3 flex items-center gap-4">
            <div className="h-16 w-16 rounded-full shrink-0 p-[2px]"
              style={{ background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)' }}>
              <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                <span className="text-foreground text-lg font-bold">{username[0]?.toUpperCase()}</span>
              </div>
            </div>
            <div className="flex gap-5 flex-1 justify-center">
              {[
                { v: String(filled), l: 'posts' },
                { v: '—', l: 'followers' },
                { v: '—', l: 'following' },
              ].map(s => (
                <div key={s.l} className="text-center">
                  <p className="text-foreground text-sm font-bold">{s.v}</p>
                  <p className="text-muted-foreground text-[11px]">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Grid tabs */}
          <div className="flex border-t border-b border-border mb-[2px]">
            <div className="flex-1 py-2 flex justify-center border-b-2 border-foreground">
              <Grid3X3 className="h-4 w-4 text-foreground" />
            </div>
            <div className="flex-1 py-2 flex justify-center">
              <LayoutGrid className="h-4 w-4 text-muted-foreground/30" />
            </div>
          </div>

          {/* Tile grid */}
          <div className="grid grid-cols-3" style={{ gap: '2px' }}>
            {tiles.map((t, i) => (
              <div
                key={t.id}
                draggable={!!t.imageUrl}
                onDragStart={() => handleDragStart(i)}
                onDragOver={e => handleDragOver(i, e)}
                onDrop={e => handleDrop(i, e)}
                className={`relative aspect-square overflow-hidden cursor-pointer group transition-all ${
                  dragOverIdx === i ? 'ring-2 ring-primary' : ''
                }`}
                style={{ background: t.imageUrl ? undefined : 'hsl(var(--muted))' }}
              >
                {t.imageUrl ? (
                  <>
                    <img src={t.imageUrl} alt="" className="h-full w-full"
                      style={{
                        objectFit: 'cover',
                        objectPosition: `${t.cropX * 100}% ${t.cropY * 100}%`,
                        transform: `scale(${t.cropZoom})`,
                        transformOrigin: `${t.cropX * 100}% ${t.cropY * 100}%`,
                      }} />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center gap-1.5">
                      <button onClick={() => setEditId(t.id)}
                        className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-white">
                        <Move className="h-3 w-3" />
                      </button>
                      <button onClick={() => removeTile(i)}
                        className="h-7 w-7 rounded-full bg-red-500/30 flex items-center justify-center text-red-300">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    {/* Drag handle */}
                    <div className="absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-70 transition-opacity">
                      <GripVertical className="h-3 w-3 text-white drop-shadow" />
                    </div>
                  </>
                ) : (
                  <button onClick={() => handleFileSelect(i)}
                    className="h-full w-full flex flex-col items-center justify-center gap-0.5">
                    <Plus className="h-4 w-4 text-muted-foreground/30" />
                    <span className="text-[8px] text-muted-foreground/30">{i + 1}</span>
                  </button>
                )}
                {/* Index badge */}
                <div className="absolute bottom-0.5 right-0.5 rounded px-1 py-0.5 bg-black/50">
                  <span className="text-[7px] font-mono text-white/60">{String(i + 1).padStart(2, '0')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Photo pool from event */}
          {photos.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                Drag photos to grid
              </p>
              <div className="grid grid-cols-5 gap-1 max-h-32 overflow-y-auto rounded-lg">
                {photos.map((url, i) => (
                  <button key={i} draggable
                    onDragStart={e => e.dataTransfer.setData('text/plain', url)}
                    onClick={() => {
                      const emptyIdx = tiles.findIndex(t => !t.imageUrl);
                      if (emptyIdx >= 0) assignPhoto(emptyIdx, url);
                    }}
                    className="aspect-square rounded overflow-hidden hover:ring-2 hover:ring-primary transition-all">
                    <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-center mt-3 text-[9px] text-muted-foreground/40 uppercase tracking-widest">
            {TILE_PX}×{TILE_PX}px · Post in reverse order
          </p>
        </div>
      </div>

      {/* Crop editor */}
      {editTile && (
        <CropModal tile={editTile}
          onUpdate={u => updateTile(editTile.id, u)}
          onClose={() => setEditId(null)} />
      )}
    </div>
  );
}
