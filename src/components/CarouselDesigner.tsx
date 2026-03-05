/**
 * CarouselDesigner — Professional Instagram Carousel Editor
 * Canvas-based slide editor with layout templates, text, drag-and-drop,
 * grid overlay, snap alignment, Instagram preview, and full-res export.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Download, Undo2, Redo2, Plus, Trash2, Copy, Type, Image as ImageIcon,
  Grid3X3, Layers, Eye, ChevronLeft, ChevronRight, Move, Square, RectangleHorizontal,
  Smartphone, GripVertical, ZoomIn, ZoomOut, AlignCenter, Palette, LayoutGrid,
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Save, ArrowLeft,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

/* ─── Design Tokens ─── */

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

export interface CanvasElement {
  id: string;
  type: 'image' | 'text' | 'shape';
  x: number; y: number;
  width: number; height: number;
  rotation: number;
  src?: string;
  objectFit?: 'cover' | 'contain';
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  shapeType?: 'rect' | 'circle';
  fill?: string;
}

export interface Slide {
  id: string;
  elements: CanvasElement[];
  bg: string;
}

type Ratio = '4:5' | '1:1' | '16:9' | '9:16';

const RATIO_DIMS: Record<Ratio, { w: number; h: number }> = {
  '4:5': { w: 1080, h: 1350 },
  '1:1': { w: 1080, h: 1080 },
  '16:9': { w: 1080, h: 608 },
  '9:16': { w: 1080, h: 1920 },
};

type ToolPanel = 'background' | 'add' | 'layouts' | 'ratio' | 'slides' | 'preview' | null;

/* ─── Layout Templates ─── */

interface LayoutTemplate {
  name: string;
  category: string;
  frames: { x: number; y: number; w: number; h: number }[];
}

const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  { name: 'Single Image', category: 'single', frames: [{ x: 0, y: 0, w: 1, h: 1 }] },
  { name: 'Two Vertical', category: 'split', frames: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }] },
  { name: 'Two Horizontal', category: 'split', frames: [{ x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 }] },
  { name: 'Three Layout', category: 'three', frames: [{ x: 0, y: 0, w: 1, h: 0.55 }, { x: 0, y: 0.55, w: 0.5, h: 0.45 }, { x: 0.5, y: 0.55, w: 0.5, h: 0.45 }] },
  { name: 'Four Grid', category: 'grid', frames: [{ x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }] },
  { name: 'Film Strip', category: 'film', frames: [{ x: 0, y: 0, w: 1, h: 0.6 }, { x: 0, y: 0.62, w: 0.333, h: 0.38 }, { x: 0.333, y: 0.62, w: 0.334, h: 0.38 }, { x: 0.667, y: 0.62, w: 0.333, h: 0.38 }] },
  { name: 'Text + Image', category: 'text', frames: [{ x: 0, y: 0.35, w: 1, h: 0.65 }] },
  { name: 'Center Focus', category: 'single', frames: [{ x: 0.08, y: 0.06, w: 0.84, h: 0.88 }] },
];

const SNAP_DIST = 8;
const GAP = 24;

function uid() { return crypto.randomUUID(); }

export function makeSlide(bg = '#EDEDED'): Slide {
  return { id: uid(), elements: [], bg };
}

/* ─── Component ─── */

interface CarouselDesignerProps {
  photos?: string[];
  onClose: () => void;
  /** If provided, shows a save button and calls this with current slides */
  onSave?: (slides: Slide[]) => void;
  /** If provided, pre-populates slides */
  initialSlides?: Slide[];
  /** Title shown in header */
  title?: string;
  /** Whether save is in progress */
  saving?: boolean;
}

export default function CarouselDesigner({ photos = [], onClose, onSave, initialSlides, title, saving }: CarouselDesignerProps) {
  const [slides, setSlides] = useState<Slide[]>(
    initialSlides && initialSlides.length > 0 ? initialSlides : [makeSlide()]
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [ratio, setRatio] = useState<Ratio>('4:5');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [tool, setTool] = useState<ToolPanel>(null);
  const [showIGPreview, setShowIGPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [history, setHistory] = useState<Slide[][]>([]);
  const [future, setFuture] = useState<Slide[][]>([]);
  const [dragState, setDragState] = useState<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const [resizeState, setResizeState] = useState<{ id: string; startX: number; startY: number; origW: number; origH: number; corner: string } | null>(null);
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number }[]>([]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const dims = RATIO_DIMS[ratio];
  const slide = slides[activeIdx];
  const scale = canvasRef.current
    ? Math.min((canvasRef.current.parentElement?.clientWidth || 400) / dims.w, (canvasRef.current.parentElement?.clientHeight || 600) / dims.h, 1) * 0.85
    : 0.3;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showIGPreview) setShowIGPreview(false);
        else if (tool) setTool(null);
        else if (selectedId) setSelectedId(null);
        else onClose();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          removeElement(selectedId);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); onSave?.(slides); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [selectedId, showIGPreview, tool, slides]);

  /* ─── History ─── */
  const pushHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(-30), slides.map(s => ({ ...s, elements: s.elements.map(e => ({ ...e })) }))]);
    setFuture([]);
  }, [slides]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setFuture(f => [...f, slides.map(s => ({ ...s, elements: s.elements.map(e => ({ ...e })) }))]);
      setSlides(last);
      return prev.slice(0, -1);
    });
  }, [slides]);

  const redo = useCallback(() => {
    setFuture(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setHistory(h => [...h, slides.map(s => ({ ...s, elements: s.elements.map(e => ({ ...e })) }))]);
      setSlides(last);
      return prev.slice(0, -1);
    });
  }, [slides]);

  /* ─── Slide management ─── */
  const addSlide = () => { pushHistory(); setSlides(s => [...s, makeSlide(slide.bg)]); setActiveIdx(slides.length); };
  const dupSlide = () => { pushHistory(); const c = { ...slide, id: uid(), elements: slide.elements.map(e => ({ ...e, id: uid() })) }; setSlides(s => [...s.slice(0, activeIdx + 1), c, ...s.slice(activeIdx + 1)]); setActiveIdx(activeIdx + 1); };
  const delSlide = () => { if (slides.length <= 1) return; pushHistory(); setSlides(s => s.filter((_, i) => i !== activeIdx)); setActiveIdx(Math.max(0, activeIdx - 1)); };

  const updateSlide = (fn: (s: Slide) => Slide) => {
    setSlides(prev => prev.map((s, i) => i === activeIdx ? fn(s) : s));
  };

  /* ─── Element management ─── */
  const addElement = (el: CanvasElement) => {
    pushHistory();
    updateSlide(s => ({ ...s, elements: [...s.elements, el] }));
    setSelectedId(el.id);
    setTool(null);
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    updateSlide(s => ({ ...s, elements: s.elements.map(e => e.id === id ? { ...e, ...updates } : e) }));
  };

  const removeElement = (id: string) => {
    pushHistory();
    updateSlide(s => ({ ...s, elements: s.elements.filter(e => e.id !== id) }));
    setSelectedId(null);
  };

  const addImage = (src: string) => {
    addElement({
      id: uid(), type: 'image', x: GAP, y: GAP,
      width: dims.w - GAP * 2, height: dims.h - GAP * 2,
      rotation: 0, src, objectFit: 'cover',
    });
  };

  const addText = () => {
    addElement({
      id: uid(), type: 'text', x: dims.w * 0.1, y: dims.h * 0.4,
      width: dims.w * 0.8, height: 120,
      rotation: 0, text: 'Your text here', fontSize: 48, fontWeight: 600,
      color: '#000000', textAlign: 'center',
    });
  };

  const addShape = () => {
    addElement({
      id: uid(), type: 'shape', x: dims.w * 0.2, y: dims.h * 0.3,
      width: dims.w * 0.6, height: dims.w * 0.6,
      rotation: 0, shapeType: 'rect', fill: 'rgba(0,0,0,0.1)',
    });
  };

  const applyLayout = (layout: LayoutTemplate) => {
    pushHistory();
    const pad = GAP;
    const usableW = dims.w - pad * 2;
    const usableH = dims.h - pad * 2;
    const gap = pad;

    const newElements: CanvasElement[] = layout.frames.map((f, i) => ({
      id: uid(), type: 'image' as const,
      x: pad + f.x * usableW + (f.x > 0 ? gap / 2 : 0),
      y: pad + f.y * usableH + (f.y > 0 ? gap / 2 : 0),
      width: f.w * usableW - (f.w < 1 ? gap / 2 : 0),
      height: f.h * usableH - (f.h < 1 ? gap / 2 : 0),
      rotation: 0,
      src: photos[i] || undefined,
      objectFit: 'cover' as const,
    }));

    if (layout.category === 'text') {
      newElements.unshift({
        id: uid(), type: 'text',
        x: pad, y: pad, width: usableW, height: dims.h * 0.3,
        rotation: 0, text: 'Your Story', fontSize: 64, fontWeight: 600,
        color: '#000000', textAlign: 'center',
      });
    }

    updateSlide(s => ({ ...s, elements: newElements }));
    setTool(null);
  };

  /* ─── Auto-layout on multi-photo upload ─── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    pushHistory();

    const urls: string[] = [];
    for (const f of files) {
      urls.push(await readFileAsDataURL(f));
    }

    if (files.length === 1) {
      addImage(urls[0]);
    } else {
      let layout: LayoutTemplate;
      if (urls.length === 2) layout = LAYOUT_TEMPLATES[1];
      else if (urls.length === 3) layout = LAYOUT_TEMPLATES[3];
      else if (urls.length >= 4) layout = LAYOUT_TEMPLATES[4];
      else layout = LAYOUT_TEMPLATES[0];

      const pad = GAP;
      const usableW = dims.w - pad * 2;
      const usableH = dims.h - pad * 2;
      const newElements: CanvasElement[] = layout.frames.slice(0, urls.length).map((f, i) => ({
        id: uid(), type: 'image' as const,
        x: pad + f.x * usableW + (f.x > 0 ? GAP / 2 : 0),
        y: pad + f.y * usableH + (f.y > 0 ? GAP / 2 : 0),
        width: f.w * usableW - (f.w < 1 ? GAP / 2 : 0),
        height: f.h * usableH - (f.h < 1 ? GAP / 2 : 0),
        rotation: 0, src: urls[i], objectFit: 'cover' as const,
      }));

      updateSlide(s => ({ ...s, elements: newElements }));
    }

    e.target.value = '';
  };

  /* ─── Drag & Snap ─── */
  const getSnapTargets = (elId: string) => {
    const centerX = dims.w / 2;
    const centerY = dims.h / 2;
    const targets: { type: 'x' | 'y'; value: number }[] = [
      { type: 'x', value: centerX },
      { type: 'y', value: centerY },
      { type: 'x', value: GAP },
      { type: 'x', value: dims.w - GAP },
      { type: 'y', value: GAP },
      { type: 'y', value: dims.h - GAP },
    ];
    slide.elements.filter(e => e.id !== elId).forEach(e => {
      targets.push(
        { type: 'x', value: e.x },
        { type: 'x', value: e.x + e.width },
        { type: 'x', value: e.x + e.width / 2 },
        { type: 'y', value: e.y },
        { type: 'y', value: e.y + e.height },
        { type: 'y', value: e.y + e.height / 2 },
      );
    });
    return targets;
  };

  const snapValue = (val: number, targets: number[]) => {
    for (const t of targets) {
      if (Math.abs(val - t) < SNAP_DIST) return { snapped: t, guide: t };
    }
    return { snapped: val, guide: undefined };
  };

  const onCanvasMouseDown = (e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    setSelectedId(elId);
    const el = slide.elements.find(el => el.id === elId);
    if (!el) return;
    pushHistory();
    setDragState({ id: elId, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y });
  };

  const onResizeMouseDown = (e: React.MouseEvent, elId: string, corner: string) => {
    e.stopPropagation();
    const el = slide.elements.find(el => el.id === elId);
    if (!el) return;
    pushHistory();
    setResizeState({ id: elId, startX: e.clientX, startY: e.clientY, origW: el.width, origH: el.height, corner });
  };

  useEffect(() => {
    if (!dragState && !resizeState) return;

    const onMove = (e: MouseEvent) => {
      if (dragState) {
        const dx = (e.clientX - dragState.startX) / scale;
        const dy = (e.clientY - dragState.startY) / scale;
        let newX = dragState.elX + dx;
        let newY = dragState.elY + dy;

        const el = slide.elements.find(el => el.id === dragState.id);
        if (!el) return;

        const targets = getSnapTargets(dragState.id);
        const xTargets = targets.filter(t => t.type === 'x').map(t => t.value);
        const yTargets = targets.filter(t => t.type === 'y').map(t => t.value);

        const lines: { x?: number; y?: number }[] = [];
        const sx1 = snapValue(newX, xTargets);
        const sx2 = snapValue(newX + el.width, xTargets);
        const sxc = snapValue(newX + el.width / 2, xTargets);
        const sy1 = snapValue(newY, yTargets);
        const sy2 = snapValue(newY + el.height, yTargets);
        const syc = snapValue(newY + el.height / 2, yTargets);

        if (sxc.guide !== undefined) { newX = sxc.snapped - el.width / 2; lines.push({ x: sxc.guide }); }
        else if (sx1.guide !== undefined) { newX = sx1.snapped; lines.push({ x: sx1.guide }); }
        else if (sx2.guide !== undefined) { newX = sx2.snapped - el.width; lines.push({ x: sx2.guide }); }

        if (syc.guide !== undefined) { newY = syc.snapped - el.height / 2; lines.push({ y: syc.guide }); }
        else if (sy1.guide !== undefined) { newY = sy1.snapped; lines.push({ y: sy1.guide }); }
        else if (sy2.guide !== undefined) { newY = sy2.snapped - el.height; lines.push({ y: sy2.guide }); }

        setSnapLines(lines);
        updateElement(dragState.id, { x: newX, y: newY });
      }
      if (resizeState) {
        const dx = (e.clientX - resizeState.startX) / scale;
        const dy = (e.clientY - resizeState.startY) / scale;
        let newW = resizeState.origW;
        let newH = resizeState.origH;

        if (resizeState.corner.includes('r')) newW = Math.max(40, resizeState.origW + dx);
        if (resizeState.corner.includes('l')) newW = Math.max(40, resizeState.origW - dx);
        if (resizeState.corner.includes('b')) newH = Math.max(40, resizeState.origH + dy);
        if (resizeState.corner.includes('t')) newH = Math.max(40, resizeState.origH - dy);

        const updates: Partial<CanvasElement> = { width: newW, height: newH };
        if (resizeState.corner.includes('l')) {
          const el = slide.elements.find(e => e.id === resizeState.id);
          if (el) updates.x = el.x + (resizeState.origW - newW);
        }
        if (resizeState.corner.includes('t')) {
          const el = slide.elements.find(e => e.id === resizeState.id);
          if (el) updates.y = el.y + (resizeState.origH - newH);
        }
        updateElement(resizeState.id, updates);
      }
    };

    const onUp = () => {
      setDragState(null);
      setResizeState(null);
      setSnapLines([]);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragState, resizeState, scale, slide.elements]);

  /* ─── Export ─── */
  const captureSlide = async (slideToCapture: Slide): Promise<Blob> => {
    const container = exportRef.current;
    if (!container) throw new Error('No export container');
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `width:${dims.w}px;height:${dims.h}px;position:absolute;left:-9999px;top:0;overflow:hidden;background:${slideToCapture.bg};`;
    container.appendChild(wrapper);

    const imgSrcs = slideToCapture.elements.filter(e => e.type === 'image' && e.src).map(e => e.src!);
    await Promise.all(imgSrcs.map(src => new Promise<void>(r => {
      const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => r(); img.onerror = () => r(); img.src = src;
    })));

    let html = '';
    for (const el of slideToCapture.elements) {
      if (el.type === 'image' && el.src) {
        html += `<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;overflow:hidden;border-radius:8px;transform:rotate(${el.rotation}deg);">`;
        html += `<img src="${el.src}" crossorigin="anonymous" style="width:100%;height:100%;object-fit:${el.objectFit || 'cover'};" />`;
        html += `</div>`;
      } else if (el.type === 'text') {
        html += `<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;display:flex;align-items:center;justify-content:${el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start'};transform:rotate(${el.rotation}deg);">`;
        html += `<p style="font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;font-size:${el.fontSize}px;font-weight:${el.fontWeight};color:${el.color};text-align:${el.textAlign};width:100%;margin:0;line-height:1.3;word-wrap:break-word;">${el.text}</p>`;
        html += `</div>`;
      } else if (el.type === 'shape') {
        const br = el.shapeType === 'circle' ? '50%' : '8px';
        html += `<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;background:${el.fill};border-radius:${br};transform:rotate(${el.rotation}deg);"></div>`;
      }
    }
    wrapper.innerHTML = html;

    await new Promise(r => setTimeout(r, 250));

    const canvas = await html2canvas(wrapper, {
      width: dims.w, height: dims.h, scale: 1, useCORS: true, backgroundColor: null, logging: false,
    });

    container.innerHTML = '';

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas blob failed')), 'image/jpeg', 0.95);
    });
  };

  const exportCurrent = async () => {
    setExporting(true);
    setExportProgress('Rendering slide...');
    try {
      const blob = await captureSlide(slide);
      saveAs(blob, `slide-${activeIdx + 1}.jpg`);
      toast.success('Slide downloaded');
    } catch (err) {
      toast.error('Export failed');
    }
    setExporting(false);
    setExportProgress('');
    setShowExportMenu(false);
  };

  const exportAll = async () => {
    setExporting(true);
    const zip = new JSZip();
    for (let i = 0; i < slides.length; i++) {
      setExportProgress(`Rendering slide ${i + 1} of ${slides.length}...`);
      const blob = await captureSlide(slides[i]);
      zip.file(`slide-${i + 1}.jpg`, blob);
    }
    setExportProgress('Creating ZIP...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'carousel-slides.zip');
    toast.success(`${slides.length} slides exported`);
    setExporting(false);
    setExportProgress('');
    setShowExportMenu(false);
  };

  /* ─── Selected element ─── */
  const sel = slide.elements.find(e => e.id === selectedId);

  /* ─── Render ─── */
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: IG.bg, fontFamily: IG.font }}>
      {/* Hidden export container */}
      <div ref={exportRef} style={{ position: 'fixed', left: -9999, top: 0, width: 0, height: 0, overflow: 'hidden' }} />
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />

      {/* ═══ Top Nav ═══ */}
      <div className="flex items-center h-12 px-3 shrink-0" style={{ borderBottom: `1px solid ${IG.border}` }}>
        <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors" style={{ color: IG.text }}
          onMouseEnter={e => { e.currentTarget.style.background = IG.surface2; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="ml-3 text-[13px] font-semibold truncate" style={{ color: IG.text }}>
          {title || 'Carousel Designer'}
        </span>
        <span className="ml-2 text-[11px] shrink-0" style={{ color: IG.textSecondary }}>
          Slide {activeIdx + 1}/{slides.length} · {dims.w}×{dims.h}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <button onClick={undo} disabled={history.length === 0} className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
            style={{ color: IG.text }} title="Undo">
            <Undo2 className="h-4 w-4" />
          </button>
          <button onClick={redo} disabled={future.length === 0} className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
            style={{ color: IG.text }} title="Redo">
            <Redo2 className="h-4 w-4" />
          </button>

          <button onClick={() => setShowGrid(!showGrid)}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: showGrid ? IG.blue : IG.textSecondary, background: showGrid ? `${IG.blue}20` : 'transparent' }}
            title="Grid overlay">
            <Grid3X3 className="h-4 w-4" />
          </button>

          {/* Save */}
          {onSave && (
            <button onClick={() => onSave(slides)} disabled={saving}
              className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
              style={{ background: IG.surface2, color: IG.text, border: `1px solid ${IG.border}` }}>
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}

          {/* Export */}
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)}
              className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
              style={{ background: IG.blue, color: '#fff' }}>
              {exporting ? (
                <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {exporting ? exportProgress : 'Export'}
            </button>
            {showExportMenu && !exporting && (
              <div className="absolute right-0 top-full mt-1 w-52 rounded-lg overflow-hidden shadow-xl z-30" style={{ background: IG.surface, border: `1px solid ${IG.border}` }}>
                <button onClick={exportCurrent} className="w-full text-left px-4 py-2.5 text-[13px] transition-colors" style={{ color: IG.text }}
                  onMouseEnter={e => { e.currentTarget.style.background = IG.surface2; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  Current slide (.jpg)
                </button>
                <button onClick={exportAll} className="w-full text-left px-4 py-2.5 text-[13px] transition-colors" style={{ color: IG.text }}
                  onMouseEnter={e => { e.currentTarget.style.background = IG.surface2; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  All slides (.zip)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Main Area ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden" style={{ background: IG.bg }}
          onClick={() => { setSelectedId(null); setShowExportMenu(false); }}
          onTouchStart={e => {
            if (e.touches.length === 1) {
              swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
            }
          }}
          onTouchEnd={e => {
            if (!swipeStartRef.current) return;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - swipeStartRef.current.x;
            const dy = touch.clientY - swipeStartRef.current.y;
            const dt = Date.now() - swipeStartRef.current.time;
            swipeStartRef.current = null;
            if (dt < 400 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
              if (dx < 0 && activeIdx < slides.length - 1) setActiveIdx(activeIdx + 1);
              else if (dx > 0 && activeIdx > 0) setActiveIdx(activeIdx - 1);
            }
          }}>

          {/* Slide strip */}
          <div className="absolute top-3 left-0 right-0 flex items-center justify-center gap-2 z-10 px-4">
            <button onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))} disabled={activeIdx === 0}
              className="h-7 w-7 rounded-full flex items-center justify-center disabled:opacity-20" style={{ background: IG.surface2, color: IG.text }}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <div className="flex gap-1.5 overflow-x-auto max-w-[60vw]" style={{ scrollbarWidth: 'none' }}>
              {slides.map((s, i) => (
                <button key={s.id} onClick={(e) => { e.stopPropagation(); setActiveIdx(i); }}
                  className="shrink-0 rounded-md overflow-hidden transition-all"
                  style={{
                    width: 48, height: 60,
                    border: i === activeIdx ? `2px solid ${IG.blue}` : `1px solid ${IG.border}`,
                    background: s.bg, opacity: i === activeIdx ? 1 : 0.6,
                  }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <span style={{ fontSize: 10, color: IG.textSecondary, fontWeight: 600 }}>{i + 1}</span>
                  </div>
                </button>
              ))}
              <button onClick={(e) => { e.stopPropagation(); addSlide(); }}
                className="shrink-0 rounded-md flex items-center justify-center transition-colors"
                style={{ width: 48, height: 60, border: `1px dashed ${IG.border}`, color: IG.textSecondary }}>
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <button onClick={() => setActiveIdx(Math.min(slides.length - 1, activeIdx + 1))} disabled={activeIdx >= slides.length - 1}
              className="h-7 w-7 rounded-full flex items-center justify-center disabled:opacity-20" style={{ background: IG.surface2, color: IG.text }}>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Canvas */}
          <div ref={canvasRef} className="relative" onClick={e => e.stopPropagation()}
            style={{
              width: dims.w * scale, height: dims.h * scale,
              background: slide.bg, borderRadius: 4,
              boxShadow: '0 0 60px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}>
            <div style={{ width: dims.w, height: dims.h, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative' }}>
              {/* Grid overlay */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none z-30">
                  {Array.from({ length: 13 }).map((_, i) => {
                    const x = GAP + (i * (dims.w - GAP * 2)) / 12;
                    return <div key={`gx${i}`} style={{ position: 'absolute', left: x, top: 0, width: 1, height: '100%', background: 'rgba(0,0,0,0.08)' }} />;
                  })}
                  <div style={{ position: 'absolute', left: dims.w / 2, top: 0, width: 1, height: '100%', background: 'rgba(0,149,246,0.2)' }} />
                  <div style={{ position: 'absolute', left: 0, top: dims.h / 2, width: '100%', height: 1, background: 'rgba(0,149,246,0.2)' }} />
                </div>
              )}

              {/* Snap lines */}
              {snapLines.map((l, i) => (
                l.x !== undefined
                  ? <div key={`sl${i}`} className="absolute z-40 pointer-events-none" style={{ left: l.x, top: 0, width: 1, height: '100%', background: '#FF3B30' }} />
                  : <div key={`sl${i}`} className="absolute z-40 pointer-events-none" style={{ left: 0, top: l.y, width: '100%', height: 1, background: '#FF3B30' }} />
              ))}

              {/* Elements */}
              {slide.elements.map(el => (
                <div key={el.id}
                  onMouseDown={e => onCanvasMouseDown(e, el.id)}
                  className="absolute"
                  style={{
                    left: el.x, top: el.y, width: el.width, height: el.height,
                    transform: `rotate(${el.rotation}deg)`,
                    cursor: dragState?.id === el.id ? 'grabbing' : 'grab',
                    outline: selectedId === el.id ? `2px solid ${IG.blue}` : 'none',
                    outlineOffset: 2,
                    zIndex: selectedId === el.id ? 20 : 10,
                    borderRadius: el.type === 'shape' && el.shapeType === 'circle' ? '50%' : 8,
                    overflow: 'hidden',
                  }}>

                  {el.type === 'image' && el.src && (
                    <img src={el.src} alt="" draggable={false} className="w-full h-full pointer-events-none"
                      style={{ objectFit: el.objectFit || 'cover', borderRadius: 8 }} />
                  )}
                  {el.type === 'image' && !el.src && (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.05)', borderRadius: 8, border: '2px dashed rgba(0,0,0,0.15)' }}>
                      <ImageIcon className="h-8 w-8" style={{ color: 'rgba(0,0,0,0.2)' }} />
                    </div>
                  )}
                  {el.type === 'text' && (
                    <div className="w-full h-full flex items-center"
                      style={{ justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
                      <p style={{
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                        fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color,
                        textAlign: el.textAlign, width: '100%', margin: 0, lineHeight: 1.3,
                        wordWrap: 'break-word',
                      }}>
                        {el.text}
                      </p>
                    </div>
                  )}
                  {el.type === 'shape' && (
                    <div className="w-full h-full" style={{
                      background: el.fill,
                      borderRadius: el.shapeType === 'circle' ? '50%' : 8,
                    }} />
                  )}

                  {/* Resize handles */}
                  {selectedId === el.id && (
                    <>
                      {['tl', 'tr', 'bl', 'br'].map(c => (
                        <div key={c}
                          onMouseDown={e => onResizeMouseDown(e, el.id, c)}
                          className="absolute z-30"
                          style={{
                            width: 10, height: 10, background: '#fff', border: `2px solid ${IG.blue}`, borderRadius: 2,
                            cursor: c === 'tl' || c === 'br' ? 'nwse-resize' : 'nesw-resize',
                            ...(c.includes('t') ? { top: -5 } : { bottom: -5 }),
                            ...(c.includes('l') ? { left: -5 } : { right: -5 }),
                          }} />
                      ))}
                    </>
                  )}
                </div>
              ))}

              {/* Empty state */}
              {slide.elements.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Layers className="h-10 w-10" style={{ color: 'rgba(0,0,0,0.15)' }} />
                  <p style={{ color: 'rgba(0,0,0,0.3)', fontSize: 14, fontFamily: IG.font }}>Add images, text, or choose a layout</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ Right Panel — Element Properties ═══ */}
        {sel && (
          <div className="w-64 shrink-0 overflow-y-auto hidden md:block" style={{ background: IG.surface, borderLeft: `1px solid ${IG.border}`, scrollbarWidth: 'thin' }}>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[2px] font-semibold" style={{ color: IG.textSecondary }}>
                  {sel.type}
                </span>
                <button onClick={() => removeElement(sel.id)} className="h-7 w-7 rounded flex items-center justify-center" style={{ color: '#ED4956' }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Position */}
              <div>
                <label className="text-[10px] uppercase tracking-[1.5px] mb-1.5 block" style={{ color: IG.textSecondary }}>Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px]" style={{ color: IG.textSecondary }}>X</span>
                    <input type="number" value={Math.round(sel.x)} onChange={e => updateElement(sel.id, { x: +e.target.value })}
                      className="w-full h-7 rounded px-2 text-[12px]" style={{ background: IG.surface2, border: `1px solid ${IG.border}`, color: IG.text, outline: 'none' }} />
                  </div>
                  <div>
                    <span className="text-[10px]" style={{ color: IG.textSecondary }}>Y</span>
                    <input type="number" value={Math.round(sel.y)} onChange={e => updateElement(sel.id, { y: +e.target.value })}
                      className="w-full h-7 rounded px-2 text-[12px]" style={{ background: IG.surface2, border: `1px solid ${IG.border}`, color: IG.text, outline: 'none' }} />
                  </div>
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="text-[10px] uppercase tracking-[1.5px] mb-1.5 block" style={{ color: IG.textSecondary }}>Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px]" style={{ color: IG.textSecondary }}>W</span>
                    <input type="number" value={Math.round(sel.width)} onChange={e => updateElement(sel.id, { width: +e.target.value })}
                      className="w-full h-7 rounded px-2 text-[12px]" style={{ background: IG.surface2, border: `1px solid ${IG.border}`, color: IG.text, outline: 'none' }} />
                  </div>
                  <div>
                    <span className="text-[10px]" style={{ color: IG.textSecondary }}>H</span>
                    <input type="number" value={Math.round(sel.height)} onChange={e => updateElement(sel.id, { height: +e.target.value })}
                      className="w-full h-7 rounded px-2 text-[12px]" style={{ background: IG.surface2, border: `1px solid ${IG.border}`, color: IG.text, outline: 'none' }} />
                  </div>
                </div>
              </div>

              {/* Text props */}
              {sel.type === 'text' && (
                <>
                  <div>
                    <label className="text-[10px] uppercase tracking-[1.5px] mb-1.5 block" style={{ color: IG.textSecondary }}>Text</label>
                    <textarea value={sel.text} onChange={e => updateElement(sel.id, { text: e.target.value })}
                      className="w-full h-20 rounded px-2 py-1.5 text-[12px] resize-none"
                      style={{ background: IG.surface2, border: `1px solid ${IG.border}`, color: IG.text, outline: 'none' }} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[1.5px] mb-1.5 block" style={{ color: IG.textSecondary }}>Font Size</label>
                    <input type="range" min={12} max={120} value={sel.fontSize} onChange={e => updateElement(sel.id, { fontSize: +e.target.value })}
                      className="w-full" style={{ accentColor: IG.blue }} />
                    <span className="text-[11px]" style={{ color: IG.textSecondary }}>{sel.fontSize}px</span>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[1.5px] mb-1.5 block" style={{ color: IG.textSecondary }}>Weight</label>
                    <div className="flex gap-1">
                      {[400, 500, 600, 700].map(w => (
                        <button key={w} onClick={() => updateElement(sel.id, { fontWeight: w })}
                          className="flex-1 py-1 rounded text-[11px]"
                          style={{ background: sel.fontWeight === w ? IG.blue : IG.surface2, color: IG.text }}>
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[1.5px] mb-1.5 block" style={{ color: IG.textSecondary }}>Align</label>
                    <div className="flex gap-1">
                      {(['left', 'center', 'right'] as const).map(a => (
                        <button key={a} onClick={() => updateElement(sel.id, { textAlign: a })}
                          className="flex-1 py-1 rounded text-[11px] capitalize"
                          style={{ background: sel.textAlign === a ? IG.blue : IG.surface2, color: IG.text }}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[1.5px] mb-1.5 block" style={{ color: IG.textSecondary }}>Color</label>
                    <input type="color" value={sel.color} onChange={e => updateElement(sel.id, { color: e.target.value })}
                      className="w-full h-8 rounded cursor-pointer" style={{ border: `1px solid ${IG.border}` }} />
                  </div>
                </>
              )}

              {/* Image replace */}
              {sel.type === 'image' && (
                <div>
                  <label className="text-[10px] uppercase tracking-[1.5px] mb-1.5 block" style={{ color: IG.textSecondary }}>Replace Image</label>
                  <input type="file" accept="image/*" onChange={async e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const url = await readFileAsDataURL(f);
                    updateElement(sel.id, { src: url });
                  }} className="w-full text-[11px]" style={{ color: IG.textSecondary }} />
                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-1 mt-2 max-h-32 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                      {photos.map((p, i) => (
                        <button key={i} onClick={() => updateElement(sel.id, { src: p })}
                          className="aspect-square rounded overflow-hidden transition-all"
                          style={{ border: sel.src === p ? `2px solid ${IG.blue}` : `1px solid ${IG.border}` }}>
                          <img src={p} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Bottom Toolbar ═══ */}
      <div className="flex items-center justify-center gap-1 h-14 px-4 shrink-0" style={{ borderTop: `1px solid ${IG.border}`, background: IG.surface }}>
        {[
          { id: 'background' as ToolPanel, icon: Palette, label: 'Background' },
          { id: 'add' as ToolPanel, icon: Plus, label: 'Add' },
          { id: 'layouts' as ToolPanel, icon: LayoutGrid, label: 'Layouts' },
          { id: 'ratio' as ToolPanel, icon: RectangleHorizontal, label: 'Ratio' },
          { id: 'slides' as ToolPanel, icon: Layers, label: 'Slides' },
          { id: 'preview' as ToolPanel, icon: Eye, label: 'Preview' },
        ].map(t => (
          <button key={t.id} onClick={() => { if (t.id === 'preview') { setShowIGPreview(true); setTool(null); } else setTool(tool === t.id ? null : t.id); }}
            className="flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors"
            style={{ color: tool === t.id ? IG.blue : IG.textSecondary, background: tool === t.id ? `${IG.blue}15` : 'transparent' }}>
            <t.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ═══ Tool Panels ═══ */}
      {tool && (
        <div className="absolute bottom-14 left-0 right-0 z-20" style={{ background: IG.surface, borderTop: `1px solid ${IG.border}`, maxHeight: '40vh', overflowY: 'auto' }}>
          <div className="p-4 max-w-lg mx-auto">
            {tool === 'background' && (
              <div>
                <p className="text-[11px] uppercase tracking-[2px] font-semibold mb-3" style={{ color: IG.textSecondary }}>Slide Background</p>
                <div className="flex gap-2 flex-wrap">
                  {['#EDEDED', '#FFFFFF', '#F5F0EB', '#000000', '#1a1a2e', '#0f3460', '#e94560', '#533483', '#2b2d42', '#d4a373'].map(c => (
                    <button key={c} onClick={() => { pushHistory(); updateSlide(s => ({ ...s, bg: c })); }}
                      className="h-10 w-10 rounded-lg transition-all"
                      style={{ background: c, border: slide.bg === c ? `2px solid ${IG.blue}` : `1px solid ${IG.border}` }} />
                  ))}
                </div>
                <div className="mt-3">
                  <input type="color" value={slide.bg} onChange={e => updateSlide(s => ({ ...s, bg: e.target.value }))}
                    className="w-full h-10 rounded-lg cursor-pointer" style={{ border: `1px solid ${IG.border}` }} />
                </div>
              </div>
            )}

            {tool === 'add' && (
              <div>
                <p className="text-[11px] uppercase tracking-[2px] font-semibold mb-3" style={{ color: IG.textSecondary }}>Add Element</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 p-3 rounded-lg transition-colors"
                    style={{ background: IG.surface2, color: IG.text, border: `1px solid ${IG.border}` }}>
                    <ImageIcon className="h-5 w-5" style={{ color: IG.blue }} />
                    <span className="text-[13px]">Image</span>
                  </button>
                  <button onClick={() => { addText(); setTool(null); }}
                    className="flex items-center gap-2 p-3 rounded-lg transition-colors"
                    style={{ background: IG.surface2, color: IG.text, border: `1px solid ${IG.border}` }}>
                    <Type className="h-5 w-5" style={{ color: IG.blue }} />
                    <span className="text-[13px]">Text</span>
                  </button>
                  <button onClick={() => { addShape(); setTool(null); }}
                    className="flex items-center gap-2 p-3 rounded-lg transition-colors"
                    style={{ background: IG.surface2, color: IG.text, border: `1px solid ${IG.border}` }}>
                    <Square className="h-5 w-5" style={{ color: IG.blue }} />
                    <span className="text-[13px]">Shape</span>
                  </button>
                </div>
                {/* Photo pool from event */}
                {photos.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] uppercase tracking-[1.5px] mb-2" style={{ color: IG.textSecondary }}>Event Photos</p>
                    <div className="grid grid-cols-5 gap-1 max-h-32 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                      {photos.map((p, i) => (
                        <button key={i} onClick={() => addImage(p)}
                          className="aspect-square rounded overflow-hidden transition-all"
                          style={{ border: `1px solid ${IG.border}` }}
                          onMouseEnter={e => { e.currentTarget.style.border = `2px solid ${IG.blue}`; }}
                          onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${IG.border}`; }}>
                          <img src={p} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tool === 'layouts' && (
              <div>
                <p className="text-[11px] uppercase tracking-[2px] font-semibold mb-3" style={{ color: IG.textSecondary }}>Layout Templates</p>
                <div className="grid grid-cols-2 gap-2">
                  {LAYOUT_TEMPLATES.map(lt => (
                    <button key={lt.name} onClick={() => applyLayout(lt)}
                      className="p-3 rounded-lg text-left transition-colors"
                      style={{ background: IG.surface2, border: `1px solid ${IG.border}`, color: IG.text }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = IG.blue; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = IG.border; }}>
                      <div className="w-full aspect-[4/5] rounded mb-2 relative" style={{ background: '#EDEDED' }}>
                        {lt.frames.map((f, i) => (
                          <div key={i} className="absolute rounded-sm" style={{
                            left: `${f.x * 100}%`, top: `${f.y * 100}%`,
                            width: `${f.w * 100 - 2}%`, height: `${f.h * 100 - 2}%`,
                            background: `hsl(${210 + i * 30}, 40%, 70%)`,
                          }} />
                        ))}
                      </div>
                      <span className="text-[12px] font-medium">{lt.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tool === 'ratio' && (
              <div>
                <p className="text-[11px] uppercase tracking-[2px] font-semibold mb-3" style={{ color: IG.textSecondary }}>Canvas Ratio</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(RATIO_DIMS) as Ratio[]).map(r => {
                    const d = RATIO_DIMS[r];
                    return (
                      <button key={r} onClick={() => { setRatio(r); setTool(null); }}
                        className="p-3 rounded-lg flex items-center gap-3 transition-colors"
                        style={{ background: ratio === r ? `${IG.blue}20` : IG.surface2, border: `1px solid ${ratio === r ? IG.blue : IG.border}`, color: IG.text }}>
                        <div className="rounded" style={{
                          width: r === '9:16' ? 16 : r === '16:9' ? 32 : r === '1:1' ? 24 : 20,
                          height: r === '9:16' ? 28 : r === '16:9' ? 18 : r === '1:1' ? 24 : 25,
                          border: `2px solid ${ratio === r ? IG.blue : IG.textSecondary}`,
                        }} />
                        <div>
                          <p className="text-[13px] font-medium">{r}</p>
                          <p className="text-[10px]" style={{ color: IG.textSecondary }}>{d.w}×{d.h}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tool === 'slides' && (
              <div>
                <p className="text-[11px] uppercase tracking-[2px] font-semibold mb-3" style={{ color: IG.textSecondary }}>Slide Management</p>
                <div className="flex gap-2 mb-3">
                  <button onClick={addSlide} className="flex-1 py-2 rounded-lg text-[12px] font-medium flex items-center justify-center gap-1.5"
                    style={{ background: IG.blue, color: '#fff' }}>
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                  <button onClick={dupSlide} className="flex-1 py-2 rounded-lg text-[12px] font-medium flex items-center justify-center gap-1.5"
                    style={{ background: IG.surface2, color: IG.text, border: `1px solid ${IG.border}` }}>
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </button>
                  <button onClick={delSlide} disabled={slides.length <= 1}
                    className="flex-1 py-2 rounded-lg text-[12px] font-medium flex items-center justify-center gap-1.5 disabled:opacity-30"
                    style={{ background: IG.surface2, color: '#ED4956', border: `1px solid ${IG.border}` }}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {slides.map((s, i) => (
                    <button key={s.id} onClick={() => { setActiveIdx(i); setTool(null); }}
                      className="rounded-lg overflow-hidden transition-all"
                      style={{
                        width: 64, height: 80, background: s.bg,
                        border: i === activeIdx ? `2px solid ${IG.blue}` : `1px solid ${IG.border}`,
                      }}>
                      <div className="w-full h-full flex items-center justify-center">
                        <span style={{ fontSize: 14, color: IG.textSecondary, fontWeight: 700 }}>{i + 1}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Instagram Preview ═══ */}
      {showIGPreview && <IGPreview slides={slides} dims={dims} onClose={() => setShowIGPreview(false)} />}
    </div>
  );
}

/* ─── Instagram Preview Modal ─── */

function IGPreview({ slides, dims, onClose }: { slides: Slide[]; dims: { w: number; h: number }; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const username = 'photographer';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.95)', fontFamily: IG.font }}>
      <button onClick={onClose} className="absolute top-4 right-4 z-[70] h-9 w-9 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(250,250,250,0.1)', color: IG.textSecondary }}>
        <X className="h-4 w-4" />
      </button>

      <div className="w-full max-w-[375px] rounded-[2.5rem] overflow-hidden shadow-2xl mx-4"
        style={{ background: IG.bg, border: `1px solid ${IG.border}`, maxHeight: '90vh' }}>
        <div className="flex items-center justify-center pt-2 pb-1">
          <div className="w-32 h-5 rounded-full" style={{ background: IG.bg, border: `1px solid ${IG.border}` }} />
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 28px)', scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="h-8 w-8 rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)' }}>
              <div className="h-full w-full rounded-full flex items-center justify-center" style={{ background: IG.bg }}>
                <span style={{ color: IG.text, fontSize: '9px', fontWeight: 700 }}>{username[0].toUpperCase()}</span>
              </div>
            </div>
            <p className="flex-1" style={{ color: IG.text, fontSize: 14, fontWeight: 600 }}>{username}</p>
            <MoreHorizontal className="h-5 w-5" style={{ color: IG.text }} />
          </div>

          <div className="relative w-full" style={{ aspectRatio: `${dims.w}/${dims.h}`, background: IG.surface }}>
            {slides[idx] && <SlidePreviewRender slide={slides[idx]} dims={dims} />}

            {slides.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)} className="rounded-full transition-all"
                    style={{ width: i === idx ? 6 : 5, height: i === idx ? 6 : 5, background: i === idx ? IG.blue : 'rgba(250,250,250,0.4)' }} />
                ))}
              </div>
            )}

            {idx > 0 && (
              <button onClick={() => setIdx(idx - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(250,250,250,0.9)', color: 'rgba(0,0,0,0.7)' }}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            )}
            {idx < slides.length - 1 && (
              <button onClick={() => setIdx(idx + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(250,250,250,0.9)', color: 'rgba(0,0,0,0.7)' }}>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}

            {slides.length > 1 && (
              <div className="absolute top-3 right-3 rounded-full px-2.5 py-0.5" style={{ background: 'rgba(0,0,0,0.6)' }}>
                <span style={{ color: IG.text, fontSize: 12, fontWeight: 500 }}>{idx + 1}/{slides.length}</span>
              </div>
            )}
          </div>

          <div className="flex items-center px-3 pt-2.5 pb-1">
            <div className="flex items-center gap-4 flex-1">
              <button onClick={() => setLiked(!liked)}><Heart className={`h-6 w-6 ${liked ? 'fill-red-500 text-red-500' : ''}`} style={liked ? {} : { color: IG.text }} /></button>
              <MessageCircle className="h-6 w-6" style={{ color: IG.text, transform: 'scaleX(-1)' }} />
              <Send className="h-5 w-5 -rotate-12" style={{ color: IG.text }} />
            </div>
            <button onClick={() => setSaved(!saved)}><Bookmark className={`h-6 w-6 ${saved ? 'fill-white' : ''}`} style={{ color: IG.text }} /></button>
          </div>

          <div className="px-3 pt-1 pb-1">
            <p style={{ color: IG.text, fontSize: 14, fontWeight: 600 }}>{liked ? '1 like' : '0 likes'}</p>
          </div>

          <div className="px-3 pb-4">
            <p style={{ color: IG.text, fontSize: 14, lineHeight: '18px' }}>
              <span style={{ fontWeight: 600, marginRight: 6 }}>{username}</span>
              Beautiful carousel story ✨
            </p>
          </div>

          <div className="flex justify-center pb-2 pt-1">
            <div className="w-28 h-1 rounded-full" style={{ background: 'rgba(250,250,250,0.3)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Render a slide for preview ─── */

function SlidePreviewRender({ slide, dims }: { slide: Slide; dims: { w: number; h: number } }) {
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: slide.bg }}>
      {slide.elements.map(el => (
        <div key={el.id} className="absolute" style={{
          left: `${(el.x / dims.w) * 100}%`,
          top: `${(el.y / dims.h) * 100}%`,
          width: `${(el.width / dims.w) * 100}%`,
          height: `${(el.height / dims.h) * 100}%`,
          transform: `rotate(${el.rotation}deg)`,
          overflow: 'hidden',
          borderRadius: el.type === 'shape' && el.shapeType === 'circle' ? '50%' : 4,
        }}>
          {el.type === 'image' && el.src && (
            <img src={el.src} alt="" className="w-full h-full" style={{ objectFit: el.objectFit || 'cover' }} />
          )}
          {el.type === 'text' && (
            <div className="w-full h-full flex items-center" style={{ justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
              <p style={{
                fontFamily: 'Inter, -apple-system, sans-serif',
                fontSize: `${(el.fontSize! / dims.w) * 100}vw`,
                fontWeight: el.fontWeight, color: el.color, textAlign: el.textAlign, width: '100%', margin: 0, lineHeight: 1.3,
              }}>
                {el.text}
              </p>
            </div>
          )}
          {el.type === 'shape' && (
            <div className="w-full h-full" style={{ background: el.fill, borderRadius: el.shapeType === 'circle' ? '50%' : 4 }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Utility ─── */

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
