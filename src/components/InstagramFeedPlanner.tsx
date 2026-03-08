/**
 * Instagram Feed Planner — Complete redesign with Instagram 2024 UI
 * Profile preview, grid themes, caption planner, analytics, export options
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Download, Grid3X3, Plus, Trash2,
  ZoomIn, ZoomOut, Move, X, Image as ImageIcon, Copy, FileText,
  MapPin, Hash, Calendar, Film, Layers, Palette, Eye, EyeOff,
  Clock, BarChart3, Bookmark, Heart, MessageCircle, Send, MoreHorizontal,
  ChevronRight, Upload, Search, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

/* ─── Instagram Design Tokens ─── */
const IG_LIGHT = {
  bg: '#FFFFFF', surface: '#FAFAFA', surface2: '#EFEFEF',
  border: '#DBDBDB', text: '#262626', textSecondary: '#8E8E8E',
  blue: '#0095F6', red: '#ED4956', green: '#58C322',
};
const IG_DARK = {
  bg: '#000000', surface: '#121212', surface2: '#1C1C1C',
  border: '#262626', text: '#F5F5F5', textSecondary: '#A8A8A8',
  blue: '#0095F6', red: '#ED4956', green: '#58C322',
};

const IG_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/* ─── Types ─── */
interface Tile {
  id: string;
  imageUrl: string | null;
  cropX: number;
  cropY: number;
  cropZoom: number;
  postType: 'photo' | 'carousel' | 'reel';
  carouselUrls: string[];
  caption: string;
  hashtags: string;
  location: string;
  scheduledDate: string;
}

type GridSize = '3x3' | '6x3';
type GridTheme = 'clean' | 'moody' | 'warm' | 'border' | 'checkerboard' | 'puzzle';
type IGTheme = 'light' | 'dark';

const GRID_CONFIGS: Record<GridSize, { rows: number; cols: number; total: number; label: string }> = {
  '3x3': { rows: 3, cols: 3, total: 9, label: '9 posts' },
  '6x3': { rows: 6, cols: 3, total: 18, label: '18 posts' },
};

const GRID_THEMES: { id: GridTheme; label: string; desc: string }[] = [
  { id: 'clean', label: 'Clean White', desc: 'Bright & airy' },
  { id: 'moody', label: 'Moody Dark', desc: 'Dramatic tones' },
  { id: 'warm', label: 'Warm Film', desc: 'Vintage warmth' },
  { id: 'border', label: 'White Border', desc: 'Framed posts' },
  { id: 'checkerboard', label: 'Checkerboard', desc: 'Alternating' },
  { id: 'puzzle', label: 'Puzzle Grid', desc: 'Split panorama' },
];

const TILE_PX = 1080;

function makeTile(): Tile {
  return {
    id: crypto.randomUUID(), imageUrl: null, cropX: 0.5, cropY: 0.5, cropZoom: 1,
    postType: 'photo', carouselUrls: [], caption: '', hashtags: '', location: '', scheduledDate: '',
  };
}

/* ─── Crop modal ─── */
function CropModal({ tile, onUpdate, onClose, colors }: {
  tile: Tile; onUpdate: (u: Partial<Tile>) => void; onClose: () => void; colors: typeof IG_LIGHT;
}) {
  if (!tile.imageUrl) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="rounded-xl max-w-sm w-full overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <p className="text-sm font-semibold" style={{ color: colors.text, fontFamily: IG_FONT }}>Adjust Crop</p>
          <button onClick={onClose}><X className="h-4 w-4" style={{ color: colors.textSecondary }} /></button>
        </div>
        <div className="p-4">
          <div className="relative w-full aspect-square rounded-lg overflow-hidden mx-auto" style={{ maxWidth: 280 }}>
            <img src={tile.imageUrl} alt="" className="absolute inset-0 w-full h-full"
              style={{ objectFit: 'cover', objectPosition: `${tile.cropX * 100}% ${tile.cropY * 100}%`,
                transform: `scale(${tile.cropZoom})`, transformOrigin: `${tile.cropX * 100}% ${tile.cropY * 100}%` }} />
          </div>
        </div>
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px]" style={{ color: colors.textSecondary }}>Horizontal</span>
              <input type="range" min={0} max={100} value={tile.cropX * 100}
                onChange={e => onUpdate({ cropX: +e.target.value / 100 })} className="w-full h-1" style={{ accentColor: colors.blue }} />
            </div>
            <div>
              <span className="text-[10px]" style={{ color: colors.textSecondary }}>Vertical</span>
              <input type="range" min={0} max={100} value={tile.cropY * 100}
                onChange={e => onUpdate({ cropY: +e.target.value / 100 })} className="w-full h-1" style={{ accentColor: colors.blue }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ZoomOut className="h-3.5 w-3.5" style={{ color: colors.textSecondary }} />
            <input type="range" min={100} max={300} value={tile.cropZoom * 100}
              onChange={e => onUpdate({ cropZoom: +e.target.value / 100 })} className="flex-1 h-1" style={{ accentColor: colors.blue }} />
            <ZoomIn className="h-3.5 w-3.5" style={{ color: colors.textSecondary }} />
          </div>
          <button onClick={onClose} className="w-full py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: colors.blue, fontFamily: IG_FONT }}>Done</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Post Detail Panel ─── */
function PostDetailPanel({ tile, onUpdate, onClose, colors }: {
  tile: Tile; onUpdate: (u: Partial<Tile>) => void; onClose: () => void; colors: typeof IG_LIGHT;
}) {
  const captionLength = tile.caption.length;
  const hashtagCount = tile.hashtags.split(/\s+/).filter(h => h.startsWith('#')).length;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full sm:max-w-md sm:rounded-xl rounded-t-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ background: colors.bg, fontFamily: IG_FONT }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sticky top-0 z-10" style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
          <button onClick={onClose} className="text-sm font-semibold" style={{ color: colors.text }}>Cancel</button>
          <p className="text-sm font-semibold" style={{ color: colors.text }}>Post Details</p>
          <button onClick={onClose} className="text-sm font-semibold" style={{ color: colors.blue }}>Done</button>
        </div>

        {/* Photo preview */}
        {tile.imageUrl && (
          <div className="aspect-square w-full max-w-[200px] mx-auto mt-4 rounded-lg overflow-hidden">
            <img src={tile.imageUrl} alt="" className="w-full h-full object-cover"
              style={{ objectPosition: `${tile.cropX * 100}% ${tile.cropY * 100}%` }} />
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* Post type */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: colors.text }}>Post Type</p>
            <div className="flex gap-2">
              {(['photo', 'carousel', 'reel'] as const).map(t => (
                <button key={t} onClick={() => onUpdate({ postType: t })}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                  style={{
                    background: tile.postType === t ? colors.blue : colors.surface2,
                    color: tile.postType === t ? '#FFFFFF' : colors.textSecondary,
                  }}>
                  {t === 'reel' && <Film className="h-3 w-3 inline mr-1" />}
                  {t === 'carousel' && <Layers className="h-3 w-3 inline mr-1" />}
                  {t === 'photo' && <ImageIcon className="h-3 w-3 inline mr-1" />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold" style={{ color: colors.text }}>Caption</p>
              <span className="text-[10px]" style={{ color: captionLength > 2200 ? IG_LIGHT.red : colors.textSecondary }}>
                {captionLength}/2,200
              </span>
            </div>
            <textarea
              value={tile.caption}
              onChange={e => onUpdate({ caption: e.target.value })}
              placeholder="Write a caption…"
              rows={4}
              className="w-full rounded-lg p-3 text-sm resize-none outline-none"
              style={{ background: colors.surface2, color: colors.text, border: `1px solid ${colors.border}`, fontFamily: IG_FONT }}
            />
          </div>

          {/* Hashtags */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold flex items-center gap-1" style={{ color: colors.text }}>
                <Hash className="h-3 w-3" /> Hashtags
              </p>
              <span className="text-[10px]" style={{ color: hashtagCount > 30 ? IG_LIGHT.red : colors.textSecondary }}>
                {hashtagCount}/30
              </span>
            </div>
            <textarea
              value={tile.hashtags}
              onChange={e => onUpdate({ hashtags: e.target.value })}
              placeholder="#photography #wedding #love"
              rows={2}
              className="w-full rounded-lg p-3 text-sm resize-none outline-none"
              style={{ background: colors.surface2, color: colors.blue, border: `1px solid ${colors.border}`, fontFamily: IG_FONT }}
            />
          </div>

          {/* Location */}
          <div>
            <p className="text-xs font-semibold flex items-center gap-1 mb-1.5" style={{ color: colors.text }}>
              <MapPin className="h-3 w-3" /> Location
            </p>
            <input
              value={tile.location}
              onChange={e => onUpdate({ location: e.target.value })}
              placeholder="Add location…"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ background: colors.surface2, color: colors.text, border: `1px solid ${colors.border}`, fontFamily: IG_FONT }}
            />
          </div>

          {/* Schedule */}
          <div>
            <p className="text-xs font-semibold flex items-center gap-1 mb-1.5" style={{ color: colors.text }}>
              <Calendar className="h-3 w-3" /> Schedule
            </p>
            <input
              type="datetime-local"
              value={tile.scheduledDate}
              onChange={e => onUpdate({ scheduledDate: e.target.value })}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ background: colors.surface2, color: colors.text, border: `1px solid ${colors.border}`, fontFamily: IG_FONT }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Canvas render for export ─── */
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
  const [detailId, setDetailId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showPostOrder, setShowPostOrder] = useState(true);
  const [gridTheme, setGridTheme] = useState<GridTheme>('clean');
  const [igTheme, setIGTheme] = useState<IGTheme>('light');
  const [showThemes, setShowThemes] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPhotoLib, setShowPhotoLib] = useState(false);
  const [profileName, setProfileName] = useState('Studio Name');
  const [profileBio, setProfileBio] = useState('Wedding & Portrait Photography');
  const [profileLocation, setProfileLocation] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const multiFileRef = useRef<HTMLInputElement>(null);
  const assignTarget = useRef<number>(0);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  const allPhotos = [...photos, ...uploadedPhotos];
  const config = GRID_CONFIGS[gridSize];
  const colors = igTheme === 'dark' ? IG_DARK : IG_LIGHT;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const switchGrid = (size: GridSize) => {
    setGridSize(size);
    setTiles(prev => {
      const target = GRID_CONFIGS[size].total;
      if (prev.length >= target) return prev.slice(0, target);
      return [...prev, ...Array.from({ length: target - prev.length }, makeTile)];
    });
  };

  const updateTile = (id: string, u: Partial<Tile>) =>
    setTiles(prev => prev.map(t => t.id === id ? { ...t, ...u } : t));

  const assignPhoto = (idx: number, url: string) => {
    setTiles(prev => prev.map((t, i) => i === idx ? { ...t, imageUrl: url, cropX: 0.5, cropY: 0.5, cropZoom: 1 } : t));
  };

  const removeTile = (idx: number) => {
    setTiles(prev => prev.map((t, i) => i === idx ? { ...t, imageUrl: null } : t));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (idx: number, e: React.DragEvent) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (targetIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    const url = e.dataTransfer.getData('text/plain');
    if (url?.startsWith('http') || url?.startsWith('blob:') || url?.startsWith('data:')) {
      assignPhoto(targetIdx, url);
    } else if (dragIdx !== null && dragIdx !== targetIdx) {
      setTiles(prev => {
        const n = [...prev];
        [n[dragIdx], n[targetIdx]] = [n[targetIdx], n[dragIdx]];
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

  const handleMultiUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const urls = files.map(f => URL.createObjectURL(f));
    setUploadedPhotos(prev => [...prev, ...urls]);
    e.target.value = '';
    toast.success(`${files.length} photos added to library`);
  };

  const autoFill = () => {
    setTiles(prev => prev.map((t, i) => {
      if (i < allPhotos.length) return { ...t, imageUrl: allPhotos[i], cropX: 0.5, cropY: 0.5, cropZoom: 1 };
      return t;
    }));
    toast.success(`Filled ${Math.min(allPhotos.length, config.total)} tiles`);
  };

  // Get theme filter for tiles
  const getTileStyle = (idx: number): React.CSSProperties => {
    switch (gridTheme) {
      case 'moody': return { filter: 'contrast(1.1) brightness(0.85) saturate(0.9)' };
      case 'warm': return { filter: 'sepia(0.2) saturate(1.2) brightness(1.05)' };
      case 'border': return { padding: '4px', background: colors.bg };
      case 'checkerboard': return idx % 2 === (Math.floor(idx / 3) % 2) ? { filter: 'brightness(0.7)' } : {};
      default: return {};
    }
  };

  // Export ZIP
  const handleExportZip = async () => {
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
        tiles.map((t, i) => {
          if (!t.imageUrl) return `${i + 1}. (empty)`;
          let line = `${i + 1}. ${String(i + 1).padStart(2, '0')}_post.jpg`;
          if (t.caption) line += `\n   Caption: ${t.caption.slice(0, 100)}...`;
          if (t.hashtags) line += `\n   Hashtags: ${t.hashtags.slice(0, 100)}`;
          if (t.location) line += `\n   Location: ${t.location}`;
          if (t.scheduledDate) line += `\n   Scheduled: ${t.scheduledDate}`;
          return line;
        }).join('\n\n') +
        `\n\nTile Size: ${TILE_PX}×${TILE_PX}px\nFormat: JPG (95% quality)`
      );
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `instagram-feed-${gridSize}.zip`);
      toast.success('Feed grid exported!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); setShowExportMenu(false); }
  };

  const handleCopyCaptions = () => {
    const text = tiles.filter(t => t.caption).map((t, i) => `Post ${i + 1}:\n${t.caption}\n${t.hashtags}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    toast.success('All captions copied!');
    setShowExportMenu(false);
  };

  const filled = tiles.filter(t => t.imageUrl).length;
  const editTile = tiles.find(t => t.id === editId);
  const detailTile = tiles.find(t => t.id === detailId);
  // Reverse post order: last tile = post first
  const getPostOrder = (idx: number) => config.total - idx;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: colors.bg, fontFamily: IG_FONT }}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <input ref={multiFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMultiUpload} />

      {/* ── Top Header ── */}
      <header className="flex items-center justify-between px-4 h-11 shrink-0"
        style={{ borderBottom: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose}><ArrowLeft className="h-5 w-5" style={{ color: colors.text }} /></button>
          <span className="text-[15px] font-semibold" style={{ color: colors.text }}>Feed Planner</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button onClick={() => setIGTheme(igTheme === 'light' ? 'dark' : 'light')}
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{ background: colors.surface2 }}>
            {igTheme === 'light' ? <span className="text-sm">🌙</span> : <span className="text-sm">☀️</span>}
          </button>
          <button onClick={() => setShowPostOrder(!showPostOrder)}
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{ background: colors.surface2 }}>
            {showPostOrder ? <Eye className="h-3.5 w-3.5" style={{ color: colors.text }} /> : <EyeOff className="h-3.5 w-3.5" style={{ color: colors.textSecondary }} />}
          </button>
          <button onClick={() => setShowThemes(!showThemes)}
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{ background: colors.surface2 }}>
            <Palette className="h-3.5 w-3.5" style={{ color: colors.text }} />
          </button>

          {/* Export menu */}
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)}
              className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-white"
              style={{ background: colors.blue }}>
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-10 z-30 rounded-xl shadow-2xl w-56 overflow-hidden"
                style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
                <button onClick={handleExportZip} disabled={exporting || filled === 0}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:opacity-80 disabled:opacity-40"
                  style={{ color: colors.text, borderBottom: `1px solid ${colors.border}` }}>
                  <Download className="h-4 w-4" style={{ color: colors.blue }} />
                  {exporting ? 'Exporting…' : 'Download ZIP'}
                </button>
                <button onClick={handleCopyCaptions}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:opacity-80"
                  style={{ color: colors.text, borderBottom: `1px solid ${colors.border}` }}>
                  <Copy className="h-4 w-4" style={{ color: colors.blue }} />
                  Copy All Captions
                </button>
                <button onClick={() => { setShowExportMenu(false); toast.success('Grid preview saved!'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:opacity-80"
                  style={{ color: colors.text }}>
                  <ImageIcon className="h-4 w-4" style={{ color: colors.blue }} />
                  Save Grid as PNG
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Grid Themes Strip ── */}
      {showThemes && (
        <div className="px-4 py-3 overflow-x-auto shrink-0" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex gap-2">
            {GRID_THEMES.map(t => (
              <button key={t.id} onClick={() => setGridTheme(t.id)}
                className="shrink-0 px-3 py-2 rounded-xl text-left transition-all"
                style={{
                  background: gridTheme === t.id ? colors.blue : colors.surface2,
                  minWidth: 100,
                }}>
                <p className="text-[11px] font-semibold" style={{ color: gridTheme === t.id ? '#fff' : colors.text }}>{t.label}</p>
                <p className="text-[9px]" style={{ color: gridTheme === t.id ? 'rgba(255,255,255,0.7)' : colors.textSecondary }}>{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[480px] mx-auto">

          {/* ── Instagram Profile Preview ── */}
          <div className="px-4 pt-4 pb-2">
            {/* Profile row */}
            <div className="flex items-center gap-4 mb-3">
              <div className="h-[77px] w-[77px] rounded-full shrink-0 p-[3px]"
                style={{ background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)' }}>
                <div className="h-full w-full rounded-full flex items-center justify-center"
                  style={{ background: colors.bg, border: `2px solid ${colors.bg}` }}>
                  <span className="text-2xl font-bold" style={{ color: colors.text }}>{username[0]?.toUpperCase()}</span>
                </div>
              </div>
              <div className="flex gap-0 flex-1 justify-around">
                {[
                  { v: String(filled), l: 'posts' },
                  { v: '2.4k', l: 'followers' },
                  { v: '891', l: 'following' },
                ].map(s => (
                  <div key={s.l} className="text-center">
                    <p className="text-[16px] font-semibold" style={{ color: colors.text }}>{s.v}</p>
                    <p className="text-[13px]" style={{ color: colors.text }}>{s.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div className="mb-2">
              <p className="text-[14px] font-semibold" style={{ color: colors.text }}>{profileName || username}</p>
              {profileLocation && (
                <p className="text-[12px]" style={{ color: colors.textSecondary }}>📍 {profileLocation}</p>
              )}
              <p className="text-[14px] mt-0.5" style={{ color: colors.text }}>{profileBio}</p>
              <p className="text-[14px]" style={{ color: '#00376B' }}>🔗 mirroraigallery.com</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-1.5 mb-3">
              <button className="flex-1 py-[6px] rounded-lg text-[13px] font-semibold"
                style={{ background: colors.surface2, color: colors.text }}>Edit profile</button>
              <button className="flex-1 py-[6px] rounded-lg text-[13px] font-semibold"
                style={{ background: colors.surface2, color: colors.text }}>Share profile</button>
              <button className="w-[34px] py-[6px] rounded-lg flex items-center justify-center"
                style={{ background: colors.surface2 }}>
                <Plus className="h-4 w-4" style={{ color: colors.text }} />
              </button>
            </div>

            {/* Highlight bubbles */}
            <div className="flex gap-4 mb-2 overflow-x-auto pb-1">
              {['Wedding', 'Portrait', 'BTS', 'Reviews', '+'].map(h => (
                <div key={h} className="flex flex-col items-center gap-1 shrink-0">
                  <div className="h-[58px] w-[58px] rounded-full flex items-center justify-center"
                    style={{ border: `1px solid ${colors.border}` }}>
                    <span className="text-xs" style={{ color: colors.textSecondary }}>{h}</span>
                  </div>
                  <span className="text-[10px] max-w-[58px] truncate" style={{ color: colors.text }}>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Grid tabs ── */}
          <div className="flex" style={{ borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
            <div className="flex-1 py-2.5 flex justify-center" style={{ borderBottom: `1px solid ${colors.text}` }}>
              <Grid3X3 className="h-[22px] w-[22px]" style={{ color: colors.text }} />
            </div>
            <div className="flex-1 py-2.5 flex justify-center">
              <Film className="h-[22px] w-[22px]" style={{ color: colors.textSecondary }} />
            </div>
            <div className="flex-1 py-2.5 flex justify-center">
              <Bookmark className="h-[22px] w-[22px]" style={{ color: colors.textSecondary }} />
            </div>
          </div>

          {/* ── Grid size toggle ── */}
          <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <div className="flex gap-1">
              {(Object.keys(GRID_CONFIGS) as GridSize[]).map(s => (
                <button key={s} onClick={() => switchGrid(s)}
                  className="px-3 py-1 rounded-full text-[12px] font-medium transition-all"
                  style={{
                    background: gridSize === s ? colors.text : 'transparent',
                    color: gridSize === s ? colors.bg : colors.textSecondary,
                  }}>
                  {GRID_CONFIGS[s].label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {allPhotos.length > 0 && (
                <button onClick={autoFill} className="px-3 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: colors.blue, color: '#fff' }}>Auto Fill</button>
              )}
              <button onClick={() => setShowPhotoLib(!showPhotoLib)} className="px-3 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: colors.surface2, color: colors.text }}>
                {showPhotoLib ? 'Hide' : 'Library'}
              </button>
            </div>
          </div>

          {/* ── Photo Library sidebar (inline) ── */}
          {showPhotoLib && (
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold" style={{ color: colors.text }}>Photo Library</p>
                <button onClick={() => multiFileRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                  style={{ background: colors.blue, color: '#fff' }}>
                  <Upload className="h-3 w-3" /> Upload
                </button>
              </div>
              {allPhotos.length === 0 ? (
                <p className="text-xs py-4 text-center" style={{ color: colors.textSecondary }}>Upload photos or link from gallery</p>
              ) : (
                <div className="grid grid-cols-5 gap-1 max-h-40 overflow-y-auto rounded-lg">
                  {allPhotos.map((url, i) => {
                    const used = tiles.some(t => t.imageUrl === url);
                    return (
                      <button key={i} draggable
                        onDragStart={e => e.dataTransfer.setData('text/plain', url)}
                        onClick={() => {
                          const emptyIdx = tiles.findIndex(t => !t.imageUrl);
                          if (emptyIdx >= 0) assignPhoto(emptyIdx, url);
                        }}
                        className="aspect-square rounded overflow-hidden relative transition-all"
                        style={{ opacity: used ? 0.4 : 1, border: `2px solid transparent` }}>
                        <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                        {used && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                            <span className="text-[9px] text-white font-bold">USED</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Tile Grid ── */}
          <div className="grid grid-cols-3" style={{ gap: '1px', background: colors.border }}>
            {tiles.map((t, i) => {
              const tileStyle = getTileStyle(i);
              const postOrder = getPostOrder(i);
              return (
                <div
                  key={t.id}
                  draggable={!!t.imageUrl}
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={e => handleDragOver(i, e)}
                  onDrop={e => handleDrop(i, e)}
                  className="relative aspect-square overflow-hidden cursor-pointer group"
                  style={{
                    background: t.imageUrl ? colors.bg : colors.surface2,
                    outline: dragOverIdx === i ? `2px solid ${colors.blue}` : 'none',
                    outlineOffset: '-2px',
                  }}
                >
                  {t.imageUrl ? (
                    <>
                      <div className="w-full h-full" style={gridTheme === 'border' ? { padding: 4 } : undefined}>
                        <img src={t.imageUrl} alt="" className="w-full h-full"
                          style={{
                            objectFit: 'cover',
                            objectPosition: `${t.cropX * 100}% ${t.cropY * 100}%`,
                            transform: `scale(${t.cropZoom})`,
                            transformOrigin: `${t.cropX * 100}% ${t.cropY * 100}%`,
                            borderRadius: gridTheme === 'border' ? '2px' : 0,
                            ...tileStyle,
                          }} />
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1"
                        style={{ background: 'rgba(0,0,0,0.45)' }}>
                        <div className="flex gap-2">
                          <button onClick={() => setEditId(t.id)}
                            className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                            <Move className="h-3.5 w-3.5 text-white" />
                          </button>
                          <button onClick={() => setDetailId(t.id)}
                            className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                            <FileText className="h-3.5 w-3.5 text-white" />
                          </button>
                          <button onClick={() => removeTile(i)}
                            className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(237,73,86,0.3)' }}>
                            <Trash2 className="h-3.5 w-3.5 text-white" />
                          </button>
                        </div>
                      </div>

                      {/* Post type indicator */}
                      {t.postType === 'carousel' && (
                        <div className="absolute top-1.5 right-1.5">
                          <Layers className="h-4 w-4 text-white drop-shadow-lg" />
                        </div>
                      )}
                      {t.postType === 'reel' && (
                        <div className="absolute top-1.5 right-1.5">
                          <Play className="h-4 w-4 text-white drop-shadow-lg fill-white" />
                        </div>
                      )}

                      {/* Instagram-style engagement row */}
                      {t.caption && (
                        <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
                          <p className="text-[8px] text-white/80 truncate">{t.caption.slice(0, 40)}…</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <button onClick={() => handleFileSelect(i)} className="h-full w-full flex flex-col items-center justify-center gap-1">
                      <Plus className="h-5 w-5" style={{ color: colors.textSecondary, opacity: 0.4 }} />
                    </button>
                  )}

                  {/* Post order badge */}
                  {showPostOrder && (
                    <div className="absolute bottom-1 right-1 rounded-full h-5 min-w-5 px-1 flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.65)' }}>
                      <span className="text-[9px] font-bold text-white tabular-nums">{postOrder}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Analytics Preview ── */}
          <div className="px-4 py-4 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: colors.text }}>
              <BarChart3 className="h-3.5 w-3.5" style={{ color: colors.blue }} /> Engagement Insights
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Clock, label: 'Best Time', value: 'Tue–Thu 10AM', sub: 'Peak engagement' },
                { icon: Hash, label: 'Hashtags', value: `${tiles.filter(t => t.hashtags).length} posts`, sub: 'With hashtags' },
                { icon: FileText, label: 'Captions', value: `${tiles.filter(t => t.caption).length}/${config.total}`, sub: 'Written' },
              ].map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: colors.surface2 }}>
                  <Icon className="h-3.5 w-3.5 mb-1.5" style={{ color: colors.blue }} />
                  <p className="text-[11px] font-semibold" style={{ color: colors.text }}>{value}</p>
                  <p className="text-[9px]" style={{ color: colors.textSecondary }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Posting guide reminder */}
            <div className="rounded-xl p-3 flex items-start gap-3" style={{ background: colors.surface2 }}>
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${colors.blue}20` }}>
                <ChevronRight className="h-4 w-4" style={{ color: colors.blue }} />
              </div>
              <div>
                <p className="text-[12px] font-semibold" style={{ color: colors.text }}>Post in reverse order</p>
                <p className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
                  Start with post #{config.total} (top-left) and end with post #1 (bottom-right) for the grid to align correctly.
                </p>
              </div>
            </div>

            <p className="text-center text-[10px] pb-4" style={{ color: colors.textSecondary }}>
              {TILE_PX}×{TILE_PX}px · {filled}/{config.total} posts planned
            </p>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {editTile && (
        <CropModal tile={editTile} onUpdate={u => updateTile(editTile.id, u)} onClose={() => setEditId(null)} colors={colors} />
      )}
      {detailTile && (
        <PostDetailPanel tile={detailTile} onUpdate={u => updateTile(detailTile.id, u)} onClose={() => setDetailId(null)} colors={colors} />
      )}

      {/* Close export menu on outside click */}
      {showExportMenu && <div className="fixed inset-0 z-20" onClick={() => setShowExportMenu(false)} />}
    </div>
  );
}
