/**
 * Premium Instagram Grid Planner
 * Editor panels: MirrorAI Pixieset-Minimal tokens (light, no radius, no shadow)
 * Preview areas (grid, post): Instagram exact design system (kept intentionally)
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

/* ─── Instagram Design Tokens (preview chrome — KEEP) ─── */

const IG = {
  bg: '#000000',
  surface: '#121212',
  surface2: '#1C1C1C',
  border: '#262626',
  text: '#FAFAFA',
  textSecondary: '#A8A8A8',
  blue: '#0095F6',
  blueHover: '#1877F2',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
} as const;

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

/* ─── Crop Editor (MirrorAI Pixieset-Minimal) ─── */

function CropEditor({ tile, onUpdate, onClose }: {
  tile: GridTile;
  onUpdate: (u: Partial<GridTile>) => void;
  onClose: () => void;
}) {
  if (!tile.imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[rgba(0,0,0,0.5)] [backdrop-filter:blur(8px)]">
      <div className="max-w-md w-full overflow-hidden bg-white border border-[var(--rule)]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--rule)]">
          <p className="text-sm font-medium text-[var(--ink)]">Adjust crop</p>
          <button onClick={onClose} className="text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative w-full aspect-square overflow-hidden mx-auto max-w-[320px] bg-[var(--wash)]">
            <img
              src={tile.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                objectPosition: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
                transform: `scale(${tile.cropZoom})`,
                transformOrigin: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
              }}
            />
            <div className="absolute inset-0 pointer-events-none border border-[var(--rule-strong)]" />
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 [backdrop-filter:blur(4px)]">
              <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-[2px]">Safe crop</span>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-4">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[2px] text-[var(--ink-muted)]">Position</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-[var(--ink-muted)]">Horizontal</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={tile.cropX * 100}
                  onChange={e => onUpdate({ cropX: +e.target.value / 100 })}
                  className="w-full h-1 [accent-color:var(--ink)]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[var(--ink-muted)]">Vertical</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={tile.cropY * 100}
                  onChange={e => onUpdate({ cropY: +e.target.value / 100 })}
                  className="w-full h-1 [accent-color:var(--ink)]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[2px] text-[var(--ink-muted)]">Zoom</label>
            <div className="flex items-center gap-3">
              <ZoomOut className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
              <input
                type="range"
                min={100}
                max={300}
                value={tile.cropZoom * 100}
                onChange={e => onUpdate({ cropZoom: +e.target.value / 100 })}
                className="flex-1 h-1 [accent-color:var(--ink)]"
              />
              <ZoomIn className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[2px] text-[var(--ink-muted)]">Quick position</label>
            <div className="flex gap-1.5">
              {[
                { l: 'Center', x: 0.5, y: 0.5 },
                { l: 'Top', x: 0.5, y: 0.2 },
                { l: 'Bottom', x: 0.5, y: 0.8 },
                { l: 'Left', x: 0.2, y: 0.5 },
                { l: 'Right', x: 0.8, y: 0.5 },
              ].map(p => (
                <button
                  key={p.l}
                  onClick={() => onUpdate({ cropX: p.x, cropY: p.y })}
                  className="flex-1 py-1.5 text-[10px] bg-[var(--wash)] text-[var(--ink-muted)] hover:bg-[var(--rule)] hover:text-[var(--ink)] transition-colors"
                >
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

/* ─── Tile View (Instagram styled grid cell — KEEP IG palette) ─── */

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
      className="relative aspect-square overflow-hidden cursor-pointer group transition-all duration-200"
      style={{
        outline: isDragTarget ? `2px solid ${IG.blue}` : 'none',
        background: !hasImg ? IG.surface2 : IG.surface,
        border: !hasImg ? `1px dashed ${IG.border}` : 'none',
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          style={splitMode ? undefined : {
            objectPosition: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
            transform: `scale(${tile.cropZoom})`,
            transformOrigin: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
          }}
        />
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center gap-1">
          <Plus className="h-4 w-4" style={{ color: `${IG.textSecondary}40` }} />
          <span style={{ color: `${IG.textSecondary}40`, fontSize: '9px', fontFamily: IG.font }}>{index + 1}</span>
        </div>
      )}

      {hasImg && !splitMode && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 bg-[rgba(0,0,0,0.5)]">
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            className="h-7 w-7 rounded-full flex items-center justify-center"
            style={{ background: `${IG.blue}40`, color: IG.text }}
          >
            <Move className="h-3 w-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className="h-7 w-7 rounded-full flex items-center justify-center bg-[rgba(237,73,86,0.3)] text-[#ED4956]"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 bg-[rgba(0,0,0,0.6)]">
        <span style={{ color: IG.textSecondary, fontSize: '8px', fontFamily: 'monospace' }}>{String(index + 1).padStart(2, '0')}</span>
      </div>
    </div>
  );
}

/* ─── Photo Pool (MirrorAI Pixieset-Minimal) ─── */

function Pool({ photos, onSelect }: { photos: string[]; onSelect: (u: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto [scrollbar-width:thin]">
      {photos.map((u, i) => (
        <button
          key={i}
          onClick={() => onSelect(u)}
          draggable
          onDragStart={e => e.dataTransfer.setData('text/plain', u)}
          className="aspect-square overflow-hidden transition-all outline-none hover:[outline:1px_solid_var(--ink)]"
        >
          <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" />
        </button>
      ))}
      {photos.length === 0 && (
        <p className="col-span-4 text-center py-8 text-[11px] text-[var(--ink-muted)]">No photos available</p>
      )}
    </div>
  );
}

/* ─── Post Preview (Instagram styled — KEEP IG palette + brand gradient) ─── */

function PostView({ tile, username }: { tile: GridTile; username: string }) {
  if (!tile.imageUrl) return null;
  return (
    <div className="rounded-2xl max-w-[320px] mx-auto overflow-hidden" style={{ background: IG.bg, border: `1px solid ${IG.border}` }}>
      <div className="flex items-center gap-2.5 px-3 py-2">
        <div className="h-7 w-7 rounded-full p-[1.5px]" style={{ background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)' }}>
          <div className="h-full w-full rounded-full flex items-center justify-center" style={{ background: IG.bg }}>
            <span style={{ color: IG.text, fontSize: '8px', fontWeight: 700, fontFamily: IG.font }}>{username[0]?.toUpperCase()}</span>
          </div>
        </div>
        <p className="flex-1" style={{ color: IG.text, fontSize: '14px', fontWeight: 600, fontFamily: IG.font }}>{username}</p>
        <MoreHorizontal className="h-4 w-4" style={{ color: IG.text }} />
      </div>
      <div className="aspect-square overflow-hidden">
        <img
          src={tile.imageUrl}
          alt=""
          className="h-full w-full object-cover"
          style={{
            objectPosition: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
            transform: `scale(${tile.cropZoom})`,
            transformOrigin: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
          }}
        />
      </div>
      <div className="flex items-center px-3 pt-2 pb-1">
        <div className="flex items-center gap-3.5 flex-1">
          <Heart className="h-5 w-5" style={{ color: IG.text }} />
          <MessageCircle className="h-5 w-5 -scale-x-100" style={{ color: IG.text }} />
          <Send className="h-4 w-4 -rotate-12" style={{ color: IG.text }} />
        </div>
        <Bookmark className="h-5 w-5" style={{ color: IG.text }} />
      </div>
      <div className="px-3 pt-0.5 pb-3">
        <p style={{ color: IG.textSecondary, fontSize: '12px', fontFamily: IG.font }}>0 likes</p>
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
      toast.success('Grid exported');
    } catch {
      toast.error('Could not export');
    } finally {
      setExporting(false);
    }
  };

  const filled = isSplit ? (splitUrl ? preset.tileCount : 0) : tiles.filter(t => t.imageUrl).length;
  const editTile = tiles.find(t => t.id === editId);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white max-w-[100vw]">
      {/* ─── Header (MirrorAI Pixieset-Minimal) ─── */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-[var(--rule)]">
        <button
          onClick={onClose}
          className="text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold tracking-[0.5px] text-[var(--ink)]">
            Instagram Grid Planner
          </h1>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--ink-muted)]">
            {preset.label} · {filled}/{preset.tileCount} tiles
          </p>
        </div>

        {/* View toggle (Instagram styled) */}
        <div className="flex rounded-full p-0.5" style={{ background: IG.surface2 }}>
          <button
            onClick={() => setView('grid')}
            className="px-3 py-1 rounded-full text-[11px] font-medium transition-all"
            style={{ background: view === 'grid' ? IG.text : 'transparent', color: view === 'grid' ? IG.bg : IG.textSecondary, fontFamily: IG.font }}
          >
            Grid
          </button>
          <button
            onClick={() => setView('post')}
            className="px-3 py-1 rounded-full text-[11px] font-medium transition-all"
            style={{ background: view === 'post' ? IG.text : 'transparent', color: view === 'post' ? IG.bg : IG.textSecondary, fontFamily: IG.font }}
          >
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
        {/* ─── Sidebar (MirrorAI Pixieset-Minimal) ─── */}
        <aside className="w-64 shrink-0 flex flex-col overflow-hidden border-r border-[var(--rule)] bg-[var(--wash)]">
          {/* Layout selector */}
          <div className="p-3 border-b border-[var(--rule)]">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="w-full flex items-center justify-between py-2 px-3 bg-white border border-[var(--rule)] hover:border-[var(--rule-strong)] transition-colors"
            >
              <div className="text-left">
                <p className="text-[11px] font-medium text-[var(--ink)]">{preset.label}</p>
                <p className="text-[9px] text-[var(--ink-muted)]">{preset.description}</p>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform text-[var(--ink-muted)] ${showPresets ? 'rotate-180' : ''}`} />
            </button>

            {showPresets && (
              <div className="mt-2 space-y-1">
                {PRESETS.map(p => {
                  const active = preset.type === p.type;
                  return (
                    <button
                      key={p.type}
                      onClick={() => switchPreset(p)}
                      className={`w-full text-left px-3 py-2 transition-colors text-[11px] flex items-center gap-2 ${
                        active
                          ? 'bg-[var(--ink)] text-white'
                          : 'text-[var(--ink-muted)] hover:bg-white hover:text-[var(--ink)]'
                      }`}
                    >
                      <p.icon className="h-3.5 w-3.5 shrink-0" />
                      <div>
                        <p className="font-medium">{p.label}</p>
                        <p className="text-[9px] opacity-70 mt-0.5">{p.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Photo pool */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[2px] text-[var(--ink-muted)]">
                {isSplit ? 'Select source image' : 'Drag photos to grid'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-3 [scrollbar-width:thin]">
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
          <div className="p-3 border-t border-[var(--rule)]">
            <div className="p-2.5 bg-white border border-[var(--rule)]">
              <p className="mb-1 text-[10px] font-medium text-[var(--ink)]">Posting order</p>
              <p className="text-[9px] leading-[14px] text-[var(--ink-muted)]">
                Post images in reverse order (last file first) for correct grid appearance.
              </p>
            </div>
          </div>
        </aside>

        {/* ─── Main Canvas (Instagram styled preview) ─── */}
        <main className="flex-1 overflow-auto flex items-start justify-center p-6" style={{ background: IG.bg }}>
          {view === 'grid' ? (
            <div className="w-full max-w-md">
              {/* Instagram Profile header */}
              <div className="mb-4 px-2">
                <div className="flex items-center gap-6 mb-3">
                  <div
                    className="h-20 w-20 rounded-full shrink-0 p-[3px]"
                    style={{ background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)' }}
                  >
                    <div className="h-full w-full rounded-full flex items-center justify-center" style={{ background: IG.bg }}>
                      <span style={{ color: IG.text, fontSize: '24px', fontWeight: 700, fontFamily: IG.font }}>{username[0]?.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex gap-6 flex-1 justify-center">
                    {[
                      { v: String(filled), l: 'posts' },
                      { v: '2.4k', l: 'followers' },
                      { v: '186', l: 'following' },
                    ].map(s => (
                      <div key={s.l} className="text-center">
                        <p style={{ color: IG.text, fontSize: '16px', fontWeight: 700, fontFamily: IG.font }}>{s.v}</p>
                        <p style={{ color: IG.textSecondary, fontSize: '13px', fontFamily: IG.font }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <p style={{ color: IG.text, fontSize: '14px', fontWeight: 600, fontFamily: IG.font }}>{username}</p>
                <p className="mt-0.5" style={{ color: IG.textSecondary, fontSize: '14px', fontFamily: IG.font }}>Photographer ✦ Visual Stories</p>

                {/* Edit profile buttons */}
                <div className="flex gap-1.5 mt-3">
                  <div className="flex-1 rounded-lg py-1.5 text-center" style={{ background: IG.surface2 }}>
                    <span style={{ color: IG.text, fontSize: '13px', fontWeight: 600, fontFamily: IG.font }}>Edit profile</span>
                  </div>
                  <div className="flex-1 rounded-lg py-1.5 text-center" style={{ background: IG.surface2 }}>
                    <span style={{ color: IG.text, fontSize: '13px', fontWeight: 600, fontFamily: IG.font }}>Share profile</span>
                  </div>
                </div>
              </div>

              {/* Grid tabs */}
              <div className="flex mb-[2px]" style={{ borderTop: `1px solid ${IG.border}`, borderBottom: `1px solid ${IG.border}` }}>
                <div className="flex-1 py-2 flex justify-center" style={{ borderBottom: `2px solid ${IG.text}` }}>
                  <Grid3X3 className="h-4 w-4" style={{ color: IG.text }} />
                </div>
                <div className="flex-1 py-2 flex justify-center">
                  <LayoutGrid className="h-4 w-4" style={{ color: `${IG.textSecondary}60` }} />
                </div>
              </div>

              {/* Grid — 2px gap */}
              <div className="grid grid-cols-3 gap-[2px]">
                {tiles.map((t, i) => (
                  <TileCell
                    key={t.id}
                    tile={t}
                    index={i}
                    isDragTarget={dragOver === i}
                    splitMode={isSplit}
                    splitUrl={splitUrl || undefined}
                    splitIdx={i}
                    splitTotal={preset.tileCount}
                    splitRows={preset.rows}
                    onDragStart={() => setDragFrom(i)}
                    onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                    onDrop={() => handleDrop(i)}
                    onEdit={() => { setSelIdx(i); if (!isSplit && t.imageUrl) setEditId(t.id); }}
                    onRemove={() => removeTile(i)}
                  />
                ))}
              </div>

              <div className="mt-4 text-center">
                <p style={{ color: `${IG.textSecondary}60`, fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: IG.font }}>
                  {TILE_PX}×{TILE_PX}px · {preset.label} · {preset.tileCount} tiles
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md">
              <div className="flex items-center justify-center gap-2 mb-6">
                <button
                  onClick={() => setSelIdx(Math.max(0, selIdx - 1))}
                  disabled={selIdx === 0}
                  className="h-8 w-8 rounded-full flex items-center justify-center disabled:opacity-30 transition-colors"
                  style={{ background: IG.surface2, color: IG.textSecondary }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <p className="px-3" style={{ color: IG.textSecondary, fontSize: '13px', fontWeight: 500, fontFamily: IG.font }}>
                  Tile {selIdx + 1} of {tiles.length}
                </p>
                <button
                  onClick={() => setSelIdx(Math.min(tiles.length - 1, selIdx + 1))}
                  disabled={selIdx >= tiles.length - 1}
                  className="h-8 w-8 rounded-full flex items-center justify-center disabled:opacity-30 transition-colors -scale-x-100"
                  style={{ background: IG.surface2, color: IG.textSecondary }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
              <PostView tile={tiles[selIdx]} username={username} />
              {!tiles[selIdx]?.imageUrl && !isSplit && (
                <p className="text-center mt-6" style={{ color: IG.textSecondary, fontSize: '12px', fontFamily: IG.font }}>No image assigned to this tile</p>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Crop editor */}
      {editTile && (
        <CropEditor
          tile={editTile}
          onUpdate={u => updateTile(editTile.id, u)}
          onClose={() => setEditId(null)}
        />
      )}
    </div>
  );
}
