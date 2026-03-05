/**
 * Premium Instagram Grid Planner
 * Uses semantic design tokens from index.css throughout.
 * Supports: Single Feed, 3-Post Panorama, 6-Post Story, 9-Post Hero,
 * Editorial Rows, Mixed Feed. Export as 1080×1080 JPG ZIP.
 */

import { useState, useEffect } from 'react';
import {
  X, Download, Grid3X3, LayoutGrid, Plus, Trash2, ZoomIn, ZoomOut,
  Move, ChevronDown, MoreHorizontal, Heart,
  MessageCircle, Send, Bookmark, ArrowLeft, Rows3, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

/* ─── Types ─── */

interface GridTile {
  id: string;
  imageUrl: string | null;
  cropX: number;
  cropY: number;
  cropZoom: number;
}

interface LayoutPreset {
  type: string;
  label: string;
  description: string;
  icon: typeof Grid3X3;
  tileCount: number;
  rows: number;
}

interface InstagramGridPlannerProps {
  photos: string[];
  username?: string;
  onClose: () => void;
}

/* ─── Constants ─── */

const PRESETS: LayoutPreset[] = [
  { type: 'single-feed', label: 'Single Feed', description: 'Individual posts for a balanced feed', icon: Grid3X3, tileCount: 9, rows: 3 },
  { type: 'panorama-3', label: '3-Post Panorama', description: 'One wide image across 3 posts', icon: Rows3, tileCount: 3, rows: 1 },
  { type: 'story-6', label: '6-Post Story', description: 'Large image across 6 tiles (3×2)', icon: Layers, tileCount: 6, rows: 2 },
  { type: 'hero-9', label: '9-Post Hero', description: 'One image split into 9 tiles (3×3)', icon: LayoutGrid, tileCount: 9, rows: 3 },
  { type: 'editorial-row', label: 'Editorial Rows', description: 'Themed rows of 3 posts each', icon: Rows3, tileCount: 9, rows: 3 },
  { type: 'mixed', label: 'Mixed Feed', description: 'Singles and panoramas combined', icon: Layers, tileCount: 9, rows: 3 },
];

const TILE_PX = 1080;

function makeTile(): GridTile {
  return { id: crypto.randomUUID(), imageUrl: null, cropX: 0.5, cropY: 0.5, cropZoom: 1 };
}

function makeTiles(n: number): GridTile[] {
  return Array.from({ length: n }, makeTile);
}

/* ─── Canvas helpers ─── */

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

function renderSplit(url: string, idx: number, total: number, rows: number, sz: number): Promise<HTMLCanvasElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = sz;
      const ctx = c.getContext('2d')!;
      const cols = 3;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const sw = img.width / cols;
      const sh = img.height / rows;
      ctx.drawImage(img, col * sw, row * sh, sw, sh, 0, 0, sz, sz);
      res(c);
    };
    img.onerror = rej;
    img.src = url;
  });
}

/* ─── Crop Editor ─── */

function CropEditor({ tile, onUpdate, onClose }: {
  tile: GridTile;
  onUpdate: (u: Partial<GridTile>) => void;
  onClose: () => void;
}) {
  if (!tile.imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <p className="text-foreground text-sm font-medium">Adjust Crop</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-background mx-auto" style={{ maxWidth: 320 }}>
            <img
              src={tile.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full"
              style={{
                objectFit: 'cover',
                objectPosition: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
                transform: `scale(${tile.cropZoom})`,
                transformOrigin: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
              }}
            />
            <div className="absolute inset-0 border-2 border-primary/20 rounded-lg pointer-events-none" />
            <div className="absolute top-2 left-2 bg-background/60 backdrop-blur-sm rounded px-2 py-0.5">
              <span className="text-muted-foreground text-[10px]">Safe Crop Zone</span>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-4">
          <div>
            <label className="editorial-label mb-2 block">Position</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground text-[10px]">Horizontal</span>
                <input type="range" min={0} max={100} value={tile.cropX * 100}
                  onChange={e => onUpdate({ cropX: +e.target.value / 100 })}
                  className="w-full accent-[hsl(var(--primary))] h-1" />
              </div>
              <div>
                <span className="text-muted-foreground text-[10px]">Vertical</span>
                <input type="range" min={0} max={100} value={tile.cropY * 100}
                  onChange={e => onUpdate({ cropY: +e.target.value / 100 })}
                  className="w-full accent-[hsl(var(--primary))] h-1" />
              </div>
            </div>
          </div>

          <div>
            <label className="editorial-label mb-2 block">Zoom</label>
            <div className="flex items-center gap-3">
              <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" />
              <input type="range" min={100} max={300} value={tile.cropZoom * 100}
                onChange={e => onUpdate({ cropZoom: +e.target.value / 100 })}
                className="flex-1 accent-[hsl(var(--primary))] h-1" />
              <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="editorial-label mb-2 block">Quick Position</label>
            <div className="flex gap-1.5">
              {[
                { l: 'Center', x: 0.5, y: 0.5 },
                { l: 'Top', x: 0.5, y: 0.2 },
                { l: 'Bottom', x: 0.5, y: 0.8 },
                { l: 'Left', x: 0.2, y: 0.5 },
                { l: 'Right', x: 0.8, y: 0.5 },
              ].map(p => (
                <button key={p.l} onClick={() => onUpdate({ cropX: p.x, cropY: p.y })}
                  className="flex-1 py-1.5 rounded bg-secondary hover:bg-accent/20 text-muted-foreground text-[10px] transition-colors">
                  {p.l}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={onClose} className="w-full">Done</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Tile View ─── */

function TileCell({ tile, index, isDragTarget, splitMode, splitUrl, splitIdx, splitTotal, splitRows, onDragStart, onDragOver, onDrop, onEdit, onRemove }: {
  tile: GridTile;
  index: number;
  isDragTarget: boolean;
  splitMode: boolean;
  splitUrl?: string;
  splitIdx: number;
  splitTotal: number;
  splitRows: number;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!splitMode || !splitUrl) { setPreview(null); return; }
    let cancel = false;
    renderSplit(splitUrl, splitIdx, splitTotal, splitRows, 360)
      .then(c => { if (!cancel) setPreview(c.toDataURL()); });
    return () => { cancel = true; };
  }, [splitMode, splitUrl, splitIdx, splitTotal, splitRows]);

  const hasImg = splitMode ? !!splitUrl : !!tile.imageUrl;
  const src = splitMode ? preview : tile.imageUrl;

  return (
    <div
      draggable={hasImg && !splitMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={e => { e.preventDefault(); onDrop(); }}
      onClick={hasImg ? onEdit : undefined}
      className={`relative aspect-square overflow-hidden cursor-pointer group transition-all duration-200
        ${isDragTarget ? 'ring-2 ring-primary/60' : ''}
        ${!hasImg ? 'bg-secondary/30 border border-dashed border-border' : ''}
      `}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full"
          style={splitMode ? { objectFit: 'cover' } : {
            objectFit: 'cover',
            objectPosition: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
            transform: `scale(${tile.cropZoom})`,
            transformOrigin: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
          }}
        />
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center gap-1">
          <Plus className="h-4 w-4 text-muted-foreground/30" />
          <span className="text-muted-foreground/30 text-[9px]">{index + 1}</span>
        </div>
      )}

      {hasImg && !splitMode && (
        <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button onClick={e => { e.stopPropagation(); onEdit(); }}
            className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-foreground hover:bg-primary/30">
            <Move className="h-3 w-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onRemove(); }}
            className="h-7 w-7 rounded-full bg-destructive/20 flex items-center justify-center text-destructive hover:bg-destructive/30">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="absolute bottom-0.5 right-0.5 bg-background/60 rounded px-1 py-0.5">
        <span className="text-muted-foreground text-[8px] font-mono">{String(index + 1).padStart(2, '0')}</span>
      </div>
    </div>
  );
}

/* ─── Photo Pool ─── */

function Pool({ photos, onSelect }: { photos: string[]; onSelect: (u: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
      {photos.map((u, i) => (
        <button key={i} onClick={() => onSelect(u)} draggable
          onDragStart={e => e.dataTransfer.setData('text/plain', u)}
          className="aspect-square rounded overflow-hidden hover:ring-2 ring-primary/60 transition-all">
          <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" />
        </button>
      ))}
      {photos.length === 0 && (
        <p className="col-span-4 text-muted-foreground text-[11px] text-center py-8">No photos available</p>
      )}
    </div>
  );
}

/* ─── Post Preview ─── */

function PostView({ tile, username }: { tile: GridTile; username: string }) {
  if (!tile.imageUrl) return null;
  return (
    <div className="bg-card rounded-2xl border border-border max-w-[320px] mx-auto overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-2">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary via-accent to-destructive p-[1.5px]">
          <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
            <span className="text-foreground text-[8px] font-bold">{username[0]?.toUpperCase()}</span>
          </div>
        </div>
        <p className="text-foreground text-[12px] font-semibold flex-1">{username}</p>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="aspect-square">
        <img src={tile.imageUrl} alt="" className="h-full w-full"
          style={{
            objectFit: 'cover',
            objectPosition: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
            transform: `scale(${tile.cropZoom})`,
            transformOrigin: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
          }}
        />
      </div>
      <div className="flex items-center px-3 pt-2 pb-1">
        <div className="flex items-center gap-3.5 flex-1">
          <Heart className="h-5 w-5 text-foreground" />
          <MessageCircle className="h-5 w-5 text-foreground" style={{ transform: 'scaleX(-1)' }} />
          <Send className="h-4 w-4 text-foreground -rotate-12" />
        </div>
        <Bookmark className="h-5 w-5 text-foreground" />
      </div>
      <div className="px-3 pt-0.5 pb-3">
        <p className="text-muted-foreground text-[11px]">0 likes</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */

export default function InstagramGridPlanner({ photos, username = 'photographer', onClose }: InstagramGridPlannerProps) {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [tiles, setTiles] = useState<GridTile[]>(makeTiles(9));
  const [splitUrl, setSplitUrl] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [view, setView] = useState<'grid' | 'post'>('grid');
  const [selIdx, setSelIdx] = useState(0);
  const [showPresets, setShowPresets] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isSplit = ['panorama-3', 'story-6', 'hero-9'].includes(preset.type);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { editId ? setEditId(null) : onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editId, onClose]);

  const switchPreset = (p: LayoutPreset) => {
    setPreset(p);
    setTiles(makeTiles(p.tileCount));
    setSplitUrl(null);
    setShowPresets(false);
    setSelIdx(0);
  };

  const updateTile = (id: string, u: Partial<GridTile>) =>
    setTiles(prev => prev.map(t => t.id === id ? { ...t, ...u } : t));

  const assignPhoto = (idx: number, url: string) => {
    if (isSplit) { setSplitUrl(url); return; }
    setTiles(prev => prev.map((t, i) => i === idx ? { ...t, imageUrl: url, cropX: 0.5, cropY: 0.5, cropZoom: 1 } : t));
  };

  const removeTile = (i: number) =>
    setTiles(prev => prev.map((t, idx) => idx === i ? { ...t, imageUrl: null } : t));

  const handleDrop = (target: number, e?: React.DragEvent) => {
    const url = e?.dataTransfer?.getData('text/plain');
    if (url?.startsWith('http')) { assignPhoto(target, url); setDragFrom(null); setDragOver(null); return; }
    if (dragFrom !== null && dragFrom !== target) {
      setTiles(prev => {
        const n = [...prev]; const tmp = n[dragFrom]; n[dragFrom] = n[target]; n[target] = tmp; return n;
      });
    }
    setDragFrom(null);
    setDragOver(null);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      const items = isSplit
        ? tiles.map((_, i) => i)
        : tiles.map((t, i) => t.imageUrl ? i : -1).filter(i => i >= 0);

      for (const i of items) {
        let canvas: HTMLCanvasElement;
        if (isSplit && splitUrl) {
          canvas = await renderSplit(splitUrl, i, preset.tileCount, preset.rows, TILE_PX);
        } else {
          const t = tiles[i];
          if (!t.imageUrl) continue;
          canvas = await renderCrop(t.imageUrl, t.cropX, t.cropY, t.cropZoom, TILE_PX);
        }
        const blob = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), 'image/jpeg', 0.95));
        zip.file(`${String(i + 1).padStart(2, '0')}_post.jpg`, blob);
      }

      zip.file('POSTING_GUIDE.txt',
        `Instagram Grid Posting Guide\n${'='.repeat(30)}\n\nPost images in this order for correct grid appearance:\n\n` +
        items.map(i => `${i + 1}. ${String(i + 1).padStart(2, '0')}_post.jpg`).join('\n') +
        `\n\nPost the LAST numbered file first, then work backwards.\n\nLayout: ${preset.label}\nTile Size: ${TILE_PX}×${TILE_PX}px\nFormat: JPG`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `instagram-grid-${preset.type}.zip`);
      toast.success('Grid exported successfully');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const filled = isSplit ? (splitUrl ? preset.tileCount : 0) : tiles.filter(t => t.imageUrl).length;
  const editTile = tiles.find(t => t.id === editId);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ maxWidth: '100vw' }}>
      {/* ─── Header ─── */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-foreground text-sm font-semibold tracking-wide" style={{ fontFamily: 'var(--editorial-body)' }}>
            Instagram Grid Planner
          </h1>
          <p className="editorial-label mt-0.5">
            {preset.label} · {filled}/{preset.tileCount} tiles
          </p>
        </div>

        <div className="flex bg-secondary rounded-full p-0.5">
          <button onClick={() => setView('grid')}
            className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
            Grid
          </button>
          <button onClick={() => setView('post')}
            className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all ${view === 'post' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
            Post
          </button>
        </div>

        <Button size="sm" onClick={handleExport} disabled={exporting || filled === 0} className="gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" />
          {exporting ? 'Exporting…' : 'Export ZIP'}
        </Button>
      </header>

      {/* ─── Body ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── Sidebar ─── */}
        <aside className="w-64 shrink-0 border-r border-border flex flex-col overflow-hidden">
          {/* Layout selector */}
          <div className="p-3 border-b border-border">
            <button onClick={() => setShowPresets(!showPresets)}
              className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-secondary hover:bg-accent/20 transition-colors">
              <div className="text-left">
                <p className="text-foreground text-[11px] font-medium">{preset.label}</p>
                <p className="text-muted-foreground text-[9px]">{preset.description}</p>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showPresets ? 'rotate-180' : ''}`} />
            </button>

            {showPresets && (
              <div className="mt-2 space-y-1">
                {PRESETS.map(p => (
                  <button key={p.type} onClick={() => switchPreset(p)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-[11px] flex items-center gap-2 ${
                      preset.type === p.type ? 'bg-primary/15 text-primary' : 'hover:bg-secondary text-muted-foreground'
                    }`}>
                    <p.icon className="h-3.5 w-3.5 shrink-0" />
                    <div>
                      <p className="font-medium">{p.label}</p>
                      <p className="text-[9px] opacity-60 mt-0.5">{p.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Photo pool */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-3 py-2">
              <p className="editorial-label">{isSplit ? 'Select Source Image' : 'Drag Photos to Grid'}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: 'thin' }}>
              <Pool photos={photos} onSelect={url => {
                if (isSplit) { setSplitUrl(url); }
                else {
                  const emptyIdx = tiles.findIndex(t => !t.imageUrl);
                  if (emptyIdx >= 0) assignPhoto(emptyIdx, url);
                }
              }} />
            </div>
          </div>

          {/* Posting guide */}
          <div className="p-3 border-t border-border">
            <div className="bg-primary/10 rounded-lg p-2.5">
              <p className="text-primary text-[10px] font-medium mb-1">📋 Posting Order</p>
              <p className="text-primary/60 text-[9px] leading-relaxed">
                Post images in reverse order (last file first) for correct grid appearance.
              </p>
            </div>
          </div>
        </aside>

        {/* ─── Main Canvas ─── */}
        <main className="flex-1 overflow-auto flex items-start justify-center p-6">
          {view === 'grid' ? (
            <div className="w-full max-w-md">
              {/* Profile header mock */}
              <div className="mb-4 px-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary via-accent to-destructive p-[2px] shrink-0">
                    <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                      <span className="text-foreground text-lg font-bold">{username[0]?.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex gap-5 flex-1 justify-center">
                    {[
                      { v: String(filled), l: 'posts' },
                      { v: '2.4k', l: 'followers' },
                      { v: '186', l: 'following' },
                    ].map(s => (
                      <div key={s.l} className="text-center">
                        <p className="text-foreground text-[14px] font-bold">{s.v}</p>
                        <p className="text-muted-foreground text-[10px]">{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-foreground text-[12px] font-semibold">{username}</p>
                <p className="text-muted-foreground text-[10px] mt-0.5">Photographer ✦ Visual Stories</p>
              </div>

              {/* Grid tabs */}
              <div className="flex border-t border-b border-border mb-[2px]">
                <div className="flex-1 py-2 flex justify-center border-b-2 border-foreground">
                  <Grid3X3 className="h-4 w-4 text-foreground" />
                </div>
                <div className="flex-1 py-2 flex justify-center">
                  <LayoutGrid className="h-4 w-4 text-muted-foreground/40" />
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-3 gap-[2px]">
                {tiles.map((t, i) => (
                  <TileCell key={t.id} tile={t} index={i}
                    isDragTarget={dragOver === i}
                    splitMode={isSplit} splitUrl={splitUrl || undefined}
                    splitIdx={i} splitTotal={preset.tileCount} splitRows={preset.rows}
                    onDragStart={() => setDragFrom(i)}
                    onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                    onDrop={() => handleDrop(i)}
                    onEdit={() => { setSelIdx(i); if (!isSplit && t.imageUrl) setEditId(t.id); }}
                    onRemove={() => removeTile(i)}
                  />
                ))}
              </div>

              <div className="mt-4 text-center">
                <p className="text-muted-foreground/40 text-[9px] tracking-wider uppercase">
                  {TILE_PX}×{TILE_PX}px · {preset.label} · {preset.tileCount} tiles
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md">
              <div className="flex items-center justify-center gap-2 mb-6">
                <button onClick={() => setSelIdx(Math.max(0, selIdx - 1))} disabled={selIdx === 0}
                  className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <p className="text-muted-foreground text-[11px] font-medium px-3">
                  Tile {selIdx + 1} of {tiles.length}
                </p>
                <button onClick={() => setSelIdx(Math.min(tiles.length - 1, selIdx + 1))} disabled={selIdx >= tiles.length - 1}
                  className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                  style={{ transform: 'scaleX(-1)' }}>
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
              <PostView tile={tiles[selIdx]} username={username} />
              {!tiles[selIdx]?.imageUrl && !isSplit && (
                <p className="text-muted-foreground text-[10px] text-center mt-6">No image assigned to this tile</p>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Crop editor */}
      {editTile && (
        <CropEditor tile={editTile}
          onUpdate={u => updateTile(editTile.id, u)}
          onClose={() => setEditId(null)} />
      )}
    </div>
  );
}
