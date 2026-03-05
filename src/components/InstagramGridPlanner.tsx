import { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Download, Eye, Grid3X3, LayoutGrid, Plus, Trash2, ZoomIn, ZoomOut,
  Move, ChevronDown, Image as ImageIcon, MoreHorizontal, Heart, MessageCircle,
  Send, Bookmark, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

// ─── Types ───

interface GridTile {
  id: string;
  imageUrl: string | null;
  cropX: number;   // 0–1
  cropY: number;   // 0–1
  cropZoom: number; // 1–3
}

interface LayoutPreset {
  type: string;
  label: string;
  description: string;
  tileCount: number;
  rows: number;
}

interface InstagramGridPlannerProps {
  photos: string[];
  username?: string;
  onClose: () => void;
}

// ─── Constants ───

const LAYOUT_PRESETS: LayoutPreset[] = [
  { type: 'single-feed', label: 'Single Feed', description: 'Individual posts for a balanced feed', tileCount: 9, rows: 3 },
  { type: 'panorama-3', label: '3-Post Panorama', description: 'One wide image across 3 posts', tileCount: 3, rows: 1 },
  { type: 'story-6', label: '6-Post Story', description: 'Large image across 6 tiles (3×2)', tileCount: 6, rows: 2 },
  { type: 'hero-9', label: '9-Post Hero', description: 'One image split into 9 tiles (3×3)', tileCount: 9, rows: 3 },
  { type: 'editorial-row', label: 'Editorial Rows', description: 'Themed rows of 3 posts each', tileCount: 9, rows: 3 },
  { type: 'mixed', label: 'Mixed Feed', description: 'Combine singles and panoramas', tileCount: 9, rows: 3 },
];

const TILE_SIZE = 1080;

function createTile(): GridTile {
  return { id: crypto.randomUUID(), imageUrl: null, cropX: 0.5, cropY: 0.5, cropZoom: 1 };
}

function createTiles(count: number): GridTile[] {
  return Array.from({ length: count }, () => createTile());
}

// ─── Crop Canvas Renderer ───

function renderCroppedTile(
  imageUrl: string,
  cropX: number,
  cropY: number,
  cropZoom: number,
  size: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      const minDim = Math.min(img.width, img.height);
      const cropSize = minDim / cropZoom;
      const maxOffsetX = img.width - cropSize;
      const maxOffsetY = img.height - cropSize;
      const sx = Math.max(0, Math.min(maxOffsetX, cropX * maxOffsetX));
      const sy = Math.max(0, Math.min(maxOffsetY, cropY * maxOffsetY));

      ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, size, size);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

// ─── Panorama Splitter ───

function renderPanoramaTile(
  imageUrl: string,
  tileIndex: number,
  totalTiles: number,
  rows: number,
  size: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      const cols = 3;
      const col = tileIndex % cols;
      const row = Math.floor(tileIndex / cols);

      const srcW = img.width / cols;
      const srcH = img.height / rows;
      const sx = col * srcW;
      const sy = row * srcH;

      ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, size, size);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

// ─── Sub Components ───

function TileCropEditor({
  tile,
  onUpdate,
  onClose,
}: {
  tile: GridTile;
  onUpdate: (updates: Partial<GridTile>) => void;
  onClose: () => void;
}) {
  if (!tile.imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-2xl border border-white/10 max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <p className="text-white text-sm font-medium">Adjust Crop</p>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-4">
          <div
            className="relative w-full aspect-square rounded-lg overflow-hidden bg-black mx-auto"
            style={{ maxWidth: 320 }}
          >
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
            {/* Safe zone indicator */}
            <div className="absolute inset-0 border-2 border-white/20 rounded-lg pointer-events-none" />
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-0.5">
              <span className="text-white/70 text-[10px]">Safe Crop Zone</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 pb-4 space-y-4">
          {/* Position */}
          <div>
            <label className="text-white/50 text-[10px] uppercase tracking-wider mb-2 block">Position</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-white/40 text-[10px]">Horizontal</span>
                <input
                  type="range"
                  min={0} max={100} value={tile.cropX * 100}
                  onChange={e => onUpdate({ cropX: Number(e.target.value) / 100 })}
                  className="w-full accent-amber-500 h-1"
                />
              </div>
              <div>
                <span className="text-white/40 text-[10px]">Vertical</span>
                <input
                  type="range"
                  min={0} max={100} value={tile.cropY * 100}
                  onChange={e => onUpdate({ cropY: Number(e.target.value) / 100 })}
                  className="w-full accent-amber-500 h-1"
                />
              </div>
            </div>
          </div>

          {/* Zoom */}
          <div>
            <label className="text-white/50 text-[10px] uppercase tracking-wider mb-2 block">Zoom</label>
            <div className="flex items-center gap-3">
              <ZoomOut className="h-3.5 w-3.5 text-white/40" />
              <input
                type="range"
                min={100} max={300} value={tile.cropZoom * 100}
                onChange={e => onUpdate({ cropZoom: Number(e.target.value) / 100 })}
                className="flex-1 accent-amber-500 h-1"
              />
              <ZoomIn className="h-3.5 w-3.5 text-white/40" />
            </div>
          </div>

          {/* Quick positions */}
          <div>
            <label className="text-white/50 text-[10px] uppercase tracking-wider mb-2 block">Quick Position</label>
            <div className="flex gap-1.5">
              {[
                { label: 'Center', x: 0.5, y: 0.5 },
                { label: 'Top', x: 0.5, y: 0.2 },
                { label: 'Bottom', x: 0.5, y: 0.8 },
                { label: 'Left', x: 0.2, y: 0.5 },
                { label: 'Right', x: 0.8, y: 0.5 },
              ].map(pos => (
                <button
                  key={pos.label}
                  onClick={() => onUpdate({ cropX: pos.x, cropY: pos.y })}
                  className="flex-1 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/60 text-[10px] transition-colors"
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={onClose} className="w-full bg-amber-600 hover:bg-amber-500 text-white">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function GridTileView({
  tile,
  index,
  isActive,
  isDragTarget,
  onDrop,
  onDragStart,
  onDragOver,
  onEdit,
  onRemove,
  splitMode,
  splitImageUrl,
  splitIndex,
  splitTotal,
  splitRows,
}: {
  tile: GridTile;
  index: number;
  isActive: boolean;
  isDragTarget: boolean;
  onDrop: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onEdit: () => void;
  onRemove: () => void;
  splitMode: boolean;
  splitImageUrl?: string;
  splitIndex: number;
  splitTotal: number;
  splitRows: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // For split modes, render the split preview
  useEffect(() => {
    if (!splitMode || !splitImageUrl) { setPreviewUrl(null); return; }
    let cancelled = false;
    renderPanoramaTile(splitImageUrl, splitIndex, splitTotal, splitRows, 360)
      .then(canvas => { if (!cancelled) setPreviewUrl(canvas.toDataURL()); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [splitMode, splitImageUrl, splitIndex, splitTotal, splitRows]);

  const hasImage = splitMode ? !!splitImageUrl : !!tile.imageUrl;
  const displayUrl = splitMode ? previewUrl : tile.imageUrl;

  return (
    <div
      draggable={hasImage && !splitMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={e => { e.preventDefault(); onDrop(); }}
      onClick={hasImage ? onEdit : undefined}
      className={`
        relative aspect-square rounded-sm overflow-hidden cursor-pointer group transition-all
        ${isDragTarget ? 'ring-2 ring-amber-500/60' : ''}
        ${isActive ? 'ring-2 ring-white/40' : ''}
        ${!hasImage ? 'bg-neutral-800/50 border border-dashed border-white/10' : ''}
      `}
    >
      {displayUrl ? (
        <img
          src={displayUrl}
          alt=""
          className="h-full w-full"
          style={
            splitMode
              ? { objectFit: 'cover' }
              : {
                  objectFit: 'cover',
                  objectPosition: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
                  transform: `scale(${tile.cropZoom})`,
                  transformOrigin: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
                }
          }
        />
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center gap-1">
          <Plus className="h-4 w-4 text-white/20" />
          <span className="text-white/20 text-[9px]">{index + 1}</span>
        </div>
      )}

      {/* Overlay on hover */}
      {hasImage && !splitMode && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
          >
            <Move className="h-3 w-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-red-500/60"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Tile number */}
      <div className="absolute bottom-1 right-1 bg-black/60 rounded px-1.5 py-0.5">
        <span className="text-white/50 text-[9px] font-mono">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function PhotoPool({
  photos,
  onSelect,
}: {
  photos: string[];
  onSelect: (url: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
      {photos.map((url, i) => (
        <button
          key={i}
          onClick={() => onSelect(url)}
          draggable
          onDragStart={e => e.dataTransfer.setData('text/plain', url)}
          className="aspect-square rounded overflow-hidden hover:ring-2 ring-amber-500/60 transition-all"
        >
          <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
        </button>
      ))}
      {photos.length === 0 && (
        <p className="col-span-4 text-white/30 text-[11px] text-center py-8">No photos available</p>
      )}
    </div>
  );
}

// ─── Instagram Post Preview ───

function PostPreview({ tile, username }: { tile: GridTile; username: string }) {
  if (!tile.imageUrl) return null;
  return (
    <div className="bg-black rounded-2xl border border-white/10 max-w-[320px] mx-auto overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-2">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 p-[1.5px]">
          <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">{username[0]?.toUpperCase()}</span>
          </div>
        </div>
        <p className="text-white text-[12px] font-semibold flex-1">{username}</p>
        <MoreHorizontal className="h-4 w-4 text-white/60" />
      </div>
      <div className="aspect-square">
        <img
          src={tile.imageUrl}
          alt=""
          className="h-full w-full"
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
          <Heart className="h-5 w-5 text-white" />
          <MessageCircle className="h-5 w-5 text-white" style={{ transform: 'scaleX(-1)' }} />
          <Send className="h-4 w-4 text-white -rotate-12" />
        </div>
        <Bookmark className="h-5 w-5 text-white" />
      </div>
      <div className="px-3 pt-0.5 pb-3">
        <p className="text-white/40 text-[11px]">0 likes</p>
      </div>
    </div>
  );
}

// ─── Main Component ───

export default function InstagramGridPlanner({ photos, username = 'photographer', onClose }: InstagramGridPlannerProps) {
  const [activePreset, setActivePreset] = useState<string>('single-feed');
  const [tiles, setTiles] = useState<GridTile[]>(createTiles(9));
  const [splitImageUrl, setSplitImageUrl] = useState<string | null>(null);
  const [editingTile, setEditingTile] = useState<string | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'post'>('grid');
  const [selectedTileIdx, setSelectedTileIdx] = useState(0);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [exporting, setExporting] = useState(false);

  const preset = LAYOUT_PRESETS.find(p => p.type === activePreset)!;
  const isSplitMode = ['panorama-3', 'story-6', 'hero-9'].includes(activePreset);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingTile) setEditingTile(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [editingTile, onClose]);

  const switchPreset = (type: string) => {
    const p = LAYOUT_PRESETS.find(l => l.type === type)!;
    setActivePreset(type);
    setTiles(createTiles(p.tileCount));
    setSplitImageUrl(null);
    setShowLayoutPicker(false);
    setSelectedTileIdx(0);
  };

  const updateTile = (id: string, updates: Partial<GridTile>) => {
    setTiles(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const assignPhoto = (tileIndex: number, url: string) => {
    if (isSplitMode) {
      setSplitImageUrl(url);
      return;
    }
    setTiles(prev => prev.map((t, i) => i === tileIndex ? { ...t, imageUrl: url, cropX: 0.5, cropY: 0.5, cropZoom: 1 } : t));
  };

  const removeTileImage = (index: number) => {
    setTiles(prev => prev.map((t, i) => i === index ? { ...t, imageUrl: null } : t));
  };

  const handleDrop = (targetIdx: number, e?: React.DragEvent) => {
    // Check if dropping from photo pool
    const url = e?.dataTransfer?.getData('text/plain');
    if (url && url.startsWith('http')) {
      assignPhoto(targetIdx, url);
      setDragFrom(null);
      setDragOver(null);
      return;
    }
    // Reorder
    if (dragFrom !== null && dragFrom !== targetIdx) {
      setTiles(prev => {
        const next = [...prev];
        const temp = next[dragFrom];
        next[dragFrom] = next[targetIdx];
        next[targetIdx] = temp;
        return next;
      });
    }
    setDragFrom(null);
    setDragOver(null);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      const tilesToExport = isSplitMode
        ? tiles.map((_, i) => ({ index: i }))
        : tiles.filter(t => t.imageUrl).map((t, i) => ({ ...t, index: i }));

      for (let i = 0; i < tilesToExport.length; i++) {
        let canvas: HTMLCanvasElement;

        if (isSplitMode && splitImageUrl) {
          canvas = await renderPanoramaTile(
            splitImageUrl, i, preset.tileCount, preset.rows, TILE_SIZE
          );
        } else {
          const tile = tiles[tilesToExport[i].index];
          if (!tile.imageUrl) continue;
          canvas = await renderCroppedTile(
            tile.imageUrl, tile.cropX, tile.cropY, tile.cropZoom, TILE_SIZE
          );
        }

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.95);
        });
        zip.file(`${String(i + 1).padStart(2, '0')}_post.jpg`, blob);
      }

      // Add posting guide
      const guide = `Instagram Grid Posting Guide\n${'='.repeat(30)}\n\nPost images in this order for correct grid appearance:\n\n${
        tilesToExport.map((_, i) => `${i + 1}. ${String(i + 1).padStart(2, '0')}_post.jpg`).join('\n')
      }\n\nPost the LAST numbered file first, then work backwards.\nThis ensures the grid displays correctly on your profile.\n\nLayout: ${preset.label}\nTile Size: ${TILE_SIZE}×${TILE_SIZE}px\nFormat: JPG`;

      zip.file('POSTING_GUIDE.txt', guide);

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `instagram-grid-${activePreset}.zip`);
      toast.success('Grid exported successfully');
    } catch (err) {
      toast.error('Export failed');
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const filledCount = isSplitMode
    ? (splitImageUrl ? preset.tileCount : 0)
    : tiles.filter(t => t.imageUrl).length;

  const editTile = tiles.find(t => t.id === editingTile);

  return (
    <div className="fixed inset-0 z-50 bg-[#0C0B08] flex flex-col">
      {/* ─── Top Bar ─── */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white text-sm font-semibold tracking-wide">Instagram Grid Planner</h1>
          <p className="text-white/30 text-[10px] tracking-wider uppercase mt-0.5">
            {preset.label} · {filledCount}/{preset.tileCount} tiles
          </p>
        </div>

        {/* View toggle */}
        <div className="flex bg-white/5 rounded-full p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all ${viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-white/40'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('post')}
            className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all ${viewMode === 'post' ? 'bg-white/15 text-white' : 'text-white/40'}`}
          >
            Post
          </button>
        </div>

        <Button
          size="sm"
          onClick={handleExport}
          disabled={exporting || filledCount === 0}
          className="gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs"
        >
          <Download className="h-3.5 w-3.5" />
          {exporting ? 'Exporting…' : 'Export ZIP'}
        </Button>
      </header>

      {/* ─── Body ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── Left Panel: Controls ─── */}
        <aside className="w-64 shrink-0 border-r border-white/5 flex flex-col overflow-hidden">
          {/* Layout Selector */}
          <div className="p-3 border-b border-white/5">
            <button
              onClick={() => setShowLayoutPicker(!showLayoutPicker)}
              className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
            >
              <div className="text-left">
                <p className="text-white text-[11px] font-medium">{preset.label}</p>
                <p className="text-white/30 text-[9px]">{preset.description}</p>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-white/40 transition-transform ${showLayoutPicker ? 'rotate-180' : ''}`} />
            </button>

            {showLayoutPicker && (
              <div className="mt-2 space-y-1">
                {LAYOUT_PRESETS.map(lp => (
                  <button
                    key={lp.type}
                    onClick={() => switchPreset(lp.type)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-[11px] ${
                      activePreset === lp.type
                        ? 'bg-amber-600/20 text-amber-400'
                        : 'hover:bg-white/5 text-white/60'
                    }`}
                  >
                    <p className="font-medium">{lp.label}</p>
                    <p className="text-[9px] opacity-60 mt-0.5">{lp.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Photo Pool */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-3 py-2">
              <p className="text-white/40 text-[9px] uppercase tracking-wider font-semibold">
                {isSplitMode ? 'Select Source Image' : 'Drag Photos to Grid'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: 'thin' }}>
              <PhotoPool
                photos={photos}
                onSelect={(url) => {
                  if (isSplitMode) {
                    setSplitImageUrl(url);
                  } else {
                    const emptyIdx = tiles.findIndex(t => !t.imageUrl);
                    if (emptyIdx >= 0) assignPhoto(emptyIdx, url);
                  }
                }}
              />
            </div>
          </div>

          {/* Posting Guide */}
          <div className="p-3 border-t border-white/5">
            <div className="bg-amber-600/10 rounded-lg p-2.5">
              <p className="text-amber-400/80 text-[10px] font-medium mb-1">📋 Posting Order</p>
              <p className="text-amber-400/50 text-[9px] leading-relaxed">
                Post images in reverse order (last file first) for correct grid appearance.
              </p>
            </div>
          </div>
        </aside>

        {/* ─── Main Canvas ─── */}
        <main className="flex-1 overflow-auto flex items-start justify-center p-6">
          {viewMode === 'grid' ? (
            <div className="w-full max-w-md">
              {/* Instagram Profile Header Mock */}
              <div className="mb-4 px-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 p-[2px] shrink-0">
                    <div className="h-full w-full rounded-full bg-[#0C0B08] flex items-center justify-center">
                      <span className="text-white text-lg font-bold">{username[0]?.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex gap-5 flex-1 justify-center">
                    <div className="text-center">
                      <p className="text-white text-[14px] font-bold">{filledCount}</p>
                      <p className="text-white/40 text-[10px]">posts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white text-[14px] font-bold">2.4k</p>
                      <p className="text-white/40 text-[10px]">followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white text-[14px] font-bold">186</p>
                      <p className="text-white/40 text-[10px]">following</p>
                    </div>
                  </div>
                </div>
                <p className="text-white text-[12px] font-semibold">{username}</p>
                <p className="text-white/40 text-[10px] mt-0.5">Photographer ✦ Visual Stories</p>
              </div>

              {/* Grid tabs */}
              <div className="flex border-t border-b border-white/10 mb-0.5">
                <div className="flex-1 py-2 flex justify-center border-b border-white">
                  <Grid3X3 className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 py-2 flex justify-center">
                  <LayoutGrid className="h-4 w-4 text-white/30" />
                </div>
              </div>

              {/* The Grid */}
              <div className="grid grid-cols-3 gap-[2px]">
                {tiles.map((tile, i) => (
                  <GridTileView
                    key={tile.id}
                    tile={tile}
                    index={i}
                    isActive={selectedTileIdx === i}
                    isDragTarget={dragOver === i}
                    onDrop={() => handleDrop(i)}
                    onDragStart={() => setDragFrom(i)}
                    onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                    onEdit={() => {
                      setSelectedTileIdx(i);
                      if (!isSplitMode && tile.imageUrl) setEditingTile(tile.id);
                    }}
                    onRemove={() => removeTileImage(i)}
                    splitMode={isSplitMode}
                    splitImageUrl={splitImageUrl || undefined}
                    splitIndex={i}
                    splitTotal={preset.tileCount}
                    splitRows={preset.rows}
                  />
                ))}
              </div>

              {/* Grid info */}
              <div className="mt-4 text-center">
                <p className="text-white/20 text-[9px] tracking-wider uppercase">
                  {TILE_SIZE}×{TILE_SIZE}px · {preset.label} · {preset.tileCount} tiles
                </p>
              </div>
            </div>
          ) : (
            /* ─── Post View ─── */
            <div className="w-full max-w-md">
              <div className="flex items-center justify-center gap-2 mb-6">
                <button
                  onClick={() => setSelectedTileIdx(Math.max(0, selectedTileIdx - 1))}
                  disabled={selectedTileIdx === 0}
                  className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <p className="text-white/50 text-[11px] font-medium px-3">
                  Tile {selectedTileIdx + 1} of {tiles.length}
                </p>
                <button
                  onClick={() => setSelectedTileIdx(Math.min(tiles.length - 1, selectedTileIdx + 1))}
                  disabled={selectedTileIdx >= tiles.length - 1}
                  className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30"
                  style={{ transform: 'scaleX(-1)' }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
              <PostPreview tile={tiles[selectedTileIdx]} username={username} />
              {!tiles[selectedTileIdx]?.imageUrl && !isSplitMode && (
                <p className="text-white/20 text-[10px] text-center mt-6">No image assigned to this tile</p>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ─── Crop Editor Modal ─── */}
      {editTile && (
        <TileCropEditor
          tile={editTile}
          onUpdate={(updates) => updateTile(editTile.id, updates)}
          onClose={() => setEditingTile(null)}
        />
      )}
    </div>
  );
}
