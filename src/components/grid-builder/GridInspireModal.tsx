/**
 * Grid Inspire — Premium AI layout generation experience.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Sparkles, Loader2, Link2, Images, ArrowLeft, Shuffle, Check, ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { GridLayout, FreeCellPosition } from './types';
import { GRID_LAYOUTS } from './types';
import type { TextLayer } from './text-overlay-types';
import { createTextLayer, FONTS } from './text-overlay-types';
import type { BackgroundStyle } from './BackgroundStyler';
import InspireCropView from './InspireCropView';

interface Props {
  onClose: () => void;
  onLayoutGenerated: (
    layout: GridLayout,
    textLayers: TextLayer[],
    background?: BackgroundStyle | null,
    freePositions?: (FreeCellPosition | null)[] | null,
  ) => void;
}

type Step = 'entry' | 'crop' | 'analyzing' | 'preview';

interface DetectedTextBlock {
  text: string;
  fontGroup: 'serif' | 'sans' | 'script';
  fontWeight: number;
  fontSize: number;
  color: string;
  letterSpacing: number;
  lineHeight: number;
  alignment: 'left' | 'center' | 'right';
  textTransform: 'none' | 'uppercase' | 'lowercase';
  fontStyle: 'normal' | 'italic';
  x: number;
  y: number;
  hasShadow: boolean;
}

interface LayoutVariation {
  layout: GridLayout;
  textLayers: TextLayer[];
  label: string;
  description: string;
  background?: BackgroundStyle | null;
}

interface InspireAnalysisResult {
  layout: GridLayout;
  textLayers: TextLayer[];
  background: BackgroundStyle | null;
  backgroundColor: string;
  watermark: any;
}

function lightenColor(hex: string, percent: number): string {
  try {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
    const num = parseInt(full, 16);
    const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(2.55 * percent));
    const b = Math.min(255, (num & 0xff) + Math.round(2.55 * percent));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  } catch { return hex; }
}

function mapFontCategory(category?: string): string {
  const map: Record<string, string> = {
    serif: 'Cormorant Garamond',
    sans: 'DM Sans',
    script: 'Great Vibes',
    display: 'Playfair Display',
  };
  return (category && map[category]) || 'DM Sans';
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function freeCellsToPositions(freeCells: any[], cellCount: number): (FreeCellPosition | null)[] {
  const positions: (FreeCellPosition | null)[] = new Array(cellCount).fill(null);
  const ordered = [...freeCells]
    .map((fc, originalIndex) => ({
      fc,
      originalIndex,
      sortKey: toFiniteNumber(fc?.zIndex, toFiniteNumber(fc?.index, originalIndex + 1)),
    }))
    .sort((a, b) => a.sortKey - b.sortKey || a.originalIndex - b.originalIndex)
    .slice(0, cellCount);

  ordered.forEach(({ fc }, slot) => {
    positions[slot] = {
      x: clamp(toFiniteNumber(fc?.x, 0), 0, 100),
      y: clamp(toFiniteNumber(fc?.y, 0), 0, 100),
      width: clamp(toFiniteNumber(fc?.width, 30), 1, 100),
      height: clamp(toFiniteNumber(fc?.height, 30), 1, 100),
      rotation: toFiniteNumber(fc?.rotation, 0),
      scale: clamp(toFiniteNumber(fc?.scale, 1), 0.1, 4),
      zIndex: Math.max(1, Math.round(toFiniteNumber(fc?.zIndex, slot + 1))),
      opacity: clamp(toFiniteNumber(fc?.opacity, 1), 0, 1),
      borderWidth: Math.max(0, toFiniteNumber(fc?.borderWidth, 0)),
      borderColor: normalizeColor(fc?.borderColor, '#FFFFFF'),
    };
  });
  return positions;
}

function textBlocksToInspireLayers(blocks: any[]): TextLayer[] {
  return blocks.map((block) =>
    createTextLayer({
      text: String(block.text || ''),
      fontFamily: mapFontCategory(block.fontCategory),
      fontSize: clamp(toFiniteNumber(block.fontSize, 16), 8, 72),
      fontWeight: toFiniteNumber(block.fontWeight, 400),
      fontStyle: block.fontStyle === 'italic' ? 'italic' : 'normal',
      color: normalizeColor(block.color, '#000000'),
      opacity: clamp(toFiniteNumber(block.opacity, 1), 0, 1),
      letterSpacing: toFiniteNumber(block.letterSpacing, 0),
      lineHeight: clamp(toFiniteNumber(block.lineHeight, 1.2), 0.8, 3),
      alignment: (['left', 'center', 'right'].includes(block.alignment) ? block.alignment : 'center') as any,
      textTransform: (['none', 'uppercase', 'lowercase'].includes(block.textTransform) ? block.textTransform : 'none') as any,
      x: clamp(toFiniteNumber(block.x, 50), 0, 100),
      y: clamp(toFiniteNumber(block.y, 50), 0, 100),
      rotation: toFiniteNumber(block.rotation, 0),
    }),
  );
}

function createWatermarkLayer(raw: any, colorOverride?: string): TextLayer | null {
  if (!raw?.text) return null;
  return createTextLayer({
    text: String(raw.text),
    fontFamily: 'DM Sans',
    fontWeight: 300,
    fontSize: clamp(toFiniteNumber(raw.fontSize, 11), 8, 28),
    color: colorOverride || normalizeColor(raw.color, '#888888'),
    opacity: clamp(toFiniteNumber(raw.opacity, 0.7), 0, 1),
    letterSpacing: 3,
    textTransform: 'uppercase',
    x: clamp(toFiniteNumber(raw.x, 50), 0, 100),
    y: clamp(toFiniteNumber(raw.y, 95), 0, 100),
  });
}

function fallbackPositionFromCell(
  cell: [number, number, number, number],
  gridCols: number,
  gridRows: number,
  index: number,
): FreeCellPosition {
  const rowStart = Math.max(1, cell[0]);
  const colStart = Math.max(1, cell[1]);
  const rowEnd = Math.max(rowStart + 1, cell[2]);
  const colEnd = Math.max(colStart + 1, cell[3]);

  return {
    x: ((colStart - 1) / gridCols) * 100,
    y: ((rowStart - 1) / gridRows) * 100,
    width: ((colEnd - colStart) / gridCols) * 100,
    height: ((rowEnd - rowStart) / gridRows) * 100,
    rotation: 0,
    scale: 1,
    zIndex: index + 1,
    opacity: 1,
    borderWidth: 0,
    borderColor: '#FFFFFF',
  };
}

function parseInspireResponse(response: any, id: string, name: string): InspireAnalysisResult {
  const layoutData = response?.layout || {};
  const baseCells: [number, number, number, number][] = Array.isArray(layoutData.cells) ? layoutData.cells : [];
  const freeRaw: any[] = Array.isArray(response?.freeCells) ? response.freeCells : [];
  const cellCount = Math.max(baseCells.length, freeRaw.length, 1);
  const gridCols = Math.max(1, Math.round(toFiniteNumber(layoutData.gridCols, 1)));
  const gridRows = Math.max(1, Math.round(toFiniteNumber(layoutData.gridRows, 1)));
  const cells = baseCells.length >= cellCount
    ? baseCells
    : [...baseCells, ...Array.from({ length: cellCount - baseCells.length }, () => [1, 1, 2, 2] as [number, number, number, number])];
  const freePositions = freeRaw.length > 0
    ? freeCellsToPositions(freeRaw, cellCount).map((pos, index) => pos ?? fallbackPositionFromCell(cells[index], gridCols, gridRows, index))
    : undefined;

  const backgroundColor = normalizeColor(response?.backgroundColor, '#FFFFFF');
  const backgroundType: 'solid' | 'gradient' = response?.backgroundType === 'gradient' ? 'gradient' : 'solid';
  const gradient = response?.backgroundGradient;

  return {
    layout: {
      id,
      name,
      category: 'creative',
      cols: gridCols,
      rows: gridRows,
      cells,
      gridCols,
      gridRows,
      canvasRatio: toFiniteNumber(layoutData.canvasRatio, 1) || 1,
      freePositions,
    },
    textLayers: Array.isArray(response?.textBlocks) ? textBlocksToInspireLayers(response.textBlocks) : [],
    background: backgroundType === 'gradient'
      ? {
          type: 'gradient',
          color: normalizeColor(gradient?.from, backgroundColor),
          gradientTo: normalizeColor(gradient?.to, backgroundColor),
          gradientAngle: toFiniteNumber(gradient?.angle, 180),
        }
      : { type: 'solid', color: backgroundColor },
    backgroundColor,
    watermark: response?.watermark || null,
  };
}

import { Search as SearchIcon, Ruler, Type as TypeIcon } from 'lucide-react';
const ANALYSIS_PHASES = [
  { text: 'Scanning composition…', Icon: SearchIcon },
  { text: 'Mapping grid structure…', Icon: Ruler },
  { text: 'Detecting typography…', Icon: TypeIcon },
  { text: 'Crafting variations…', Icon: Sparkles },
];

const STYLE_META = [
  { label: 'Faithful', description: 'Exact recreation' },
  { label: 'Editorial', description: 'Lighter palette' },
  { label: 'Cinematic', description: 'Dark mood' },
  { label: 'Minimal', description: 'Clean & simple' },
];

function mapFontFamily(group: 'serif' | 'sans' | 'script', weight: number, textTransform: string, fontSize: number): string {
  if (group === 'script') return fontSize > 28 ? 'Great Vibes' : 'Parisienne';
  if (group === 'serif') {
    if (weight >= 700) return 'Playfair Display';
    if (weight >= 500 && fontSize > 20) return 'Bodoni Moda';
    if (fontSize > 28) return 'EB Garamond';
    return 'Cormorant Garamond';
  }
  if (textTransform === 'uppercase' && weight >= 500) return 'Montserrat';
  if (textTransform === 'uppercase' && fontSize <= 14) return 'Jost';
  if (weight >= 600) return 'Poppins';
  if (weight <= 300) return 'Inter';
  return 'DM Sans';
}

function snapWeight(family: string, weight: number): number {
  const font = FONTS.find(f => f.family === family);
  if (!font) return 400;
  return font.weights.reduce((prev, curr) => Math.abs(curr - weight) < Math.abs(prev - weight) ? curr : prev);
}

function textBlocksToLayers(blocks: DetectedTextBlock[]): TextLayer[] {
  const layers = blocks.map((block) => {
    const fontFamily = mapFontFamily(block.fontGroup, block.fontWeight, block.textTransform, block.fontSize);
    const fontWeight = snapWeight(fontFamily, block.fontWeight);
    const fontSize = Math.max(8, Math.min(56, block.fontSize));
    return createTextLayer({
      text: block.text, fontFamily, fontWeight, fontSize,
      color: block.color || '#ffffff',
      letterSpacing: Math.max(0, Math.min(20, block.letterSpacing)),
      lineHeight: Math.max(0.8, Math.min(3, block.lineHeight)),
      alignment: block.alignment, textTransform: block.textTransform, fontStyle: block.fontStyle,
      x: Math.max(2, Math.min(98, block.x)), y: Math.max(2, Math.min(98, block.y)),
      opacity: 1, rotation: 0, scale: 1,
      shadow: block.hasShadow ? { x: 0, y: 2, blur: 10, color: 'rgba(0,0,0,0.45)' } : null,
    });
  });
  layers.sort((a, b) => a.y - b.y);
  for (let i = 1; i < layers.length; i++) {
    if (Math.abs(layers[i].y - layers[i - 1].y) < 2) {
      layers[i].y = Math.min(96, layers[i - 1].y + 3);
    }
  }
  return layers;
}

function generateVariations(base: GridLayout, textLayers: TextLayer[]): LayoutVariation[] {
  const variations: LayoutVariation[] = [{ layout: base, textLayers, ...STYLE_META[0] }];
  for (let v = 1; v < 4; v++) {
    const shuffledCells = [...base.cells];
    for (let i = shuffledCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCells[i], shuffledCells[j]] = [shuffledCells[j], shuffledCells[i]];
    }
    variations.push({
      layout: { ...base, id: `${base.id}-v${v}`, cells: shuffledCells },
      textLayers: textLayers.map(l => ({ ...l })),
      ...STYLE_META[v],
    });
  }
  return variations;
}

function getAutoLayouts(): LayoutVariation[] {
  const categories = ['creative', 'instagram', 'basic'] as const;
  const picked: LayoutVariation[] = [];
  for (const cat of categories) {
    const options = GRID_LAYOUTS.filter(l => l.category === cat && l.cells.length >= 3 && l.cells.length <= 9);
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    const count = Math.min(2, shuffled.length);
    for (let i = 0; i < count; i++) {
      picked.push({ layout: shuffled[i], textLayers: [], ...STYLE_META[picked.length % STYLE_META.length] });
    }
  }
  return picked.slice(0, 6);
}

export default function GridInspireModal({ onClose, onLayoutGenerated }: Props) {
  const [step, setStep] = useState<Step>('entry');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [variations, setVariations] = useState<LayoutVariation[]>([]);
  const [activeVariation, setActiveVariation] = useState(0);
  const [analysisPhase, setAnalysisPhase] = useState(0);
  const [applied, setApplied] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [multiImages, setMultiImages] = useState<string[]>([]);
  const [multiResults, setMultiResults] = useState<Array<{ layout: GridLayout; textLayers: TextLayer[]; image: string; background?: BackgroundStyle | null }>>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [analyzingSlide, setAnalyzingSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const [multiMode, setMultiMode] = useState(false);

  useEffect(() => {
    return () => {
      multiImages.forEach(url => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); });
    };
  }, []);

  useEffect(() => {
    if (step !== 'analyzing') return;
    setAnalysisPhase(0);
    const interval = setInterval(() => {
      setAnalysisPhase(p => {
        if (p >= ANALYSIS_PHASES.length - 1) { clearInterval(interval); return p; }
        return p + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step !== 'preview' || !scrollRef.current) return;
    const cards = scrollRef.current.children;
    if (cards[activeVariation]) {
      (cards[activeVariation] as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeVariation, step]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image'); return; }
    setMultiMode(false);
    setImageSrc(URL.createObjectURL(file));
    setStep('crop');
  }, []);

  const handleBatchAnalyze = useCallback(async (imageUrls: string[]) => {
    setStep('analyzing');
    setMultiResults([]);
    setAnalyzingSlide(0);
    setTotalSlides(imageUrls.length);
    const results: Array<{ layout: GridLayout; textLayers: TextLayer[]; image: string; background?: BackgroundStyle | null }> = [];
    for (let i = 0; i < imageUrls.length; i++) {
      setAnalyzingSlide(i + 1);
      setAnalysisPhase(Math.min(i % ANALYSIS_PHASES.length, ANALYSIS_PHASES.length - 1));
      try {
        const response = await fetch(imageUrls[i]);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-grid-layout`,
          { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }, body: JSON.stringify({ image: base64 }) }
        );
        if (resp.ok) {
          const fullResponse = await resp.json();
          if (fullResponse.layout?.cells?.length || fullResponse.freeCells?.length) {
            const parsed = parseInspireResponse(fullResponse, `inspire-${Date.now()}-${i}`, `Slide ${i + 1}`);
            results.push({ layout: parsed.layout, textLayers: parsed.textLayers, background: parsed.background, image: imageUrls[i] });
          } else {
            const fallback = GRID_LAYOUTS.filter(l => l.category === 'creative' && l.cells.length >= 2)[i % 5] || GRID_LAYOUTS[0];
            results.push({ layout: { ...fallback, id: `inspire-fallback-${i}`, name: `Slide ${i + 1}` }, textLayers: [], image: imageUrls[i] });
          }
        } else {
          const fallback = GRID_LAYOUTS.filter(l => l.category === 'creative' && l.cells.length >= 2)[i % 5] || GRID_LAYOUTS[0];
          results.push({ layout: { ...fallback, id: `inspire-fallback-${i}`, name: `Slide ${i + 1}` }, textLayers: [], image: imageUrls[i] });
        }
      } catch {
        const fallback = GRID_LAYOUTS.filter(l => l.category === 'creative')[i % 5] || GRID_LAYOUTS[0];
        results.push({ layout: { ...fallback, id: `inspire-fallback-${i}`, name: `Slide ${i + 1}` }, textLayers: [], image: imageUrls[i] });
      }
    }
    setMultiResults(results);
    setCurrentSlideIndex(0);
    setStep('preview');
  }, []);

  const handleMultiFileSelect = useCallback((files: File[]) => {
    const images = files.filter(f => f.type.startsWith('image/'));
    if (images.length === 0) { toast.error('No valid images found'); return; }
    if (images.length === 1) { setMultiMode(false); setImageSrc(URL.createObjectURL(images[0])); setStep('crop'); return; }
    setMultiMode(true);
    const urls = images.map(f => URL.createObjectURL(f));
    setMultiImages(urls);
    setTotalSlides(urls.length);
    handleBatchAnalyze(urls);
  }, [handleBatchAnalyze]);

  const handleInstagramLink = useCallback(async () => {
    const url = linkValue.trim();
    if (!url) { toast.error('Please paste an Instagram link'); return; }
    if (!/instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/i.test(url)) { toast.error('Please paste a valid Instagram post or reel link'); return; }
    setLinkLoading(true);
    try {
      const proxyResp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-instagram-image`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }, body: JSON.stringify({ url }) }
      );
      if (!proxyResp.ok) { const errData = await proxyResp.json().catch(() => ({})); throw new Error(errData.error || 'Could not fetch Instagram image'); }
      const result = await proxyResp.json();
      if (result.images && result.images.length > 1) {
        setMultiMode(true); setShowLinkInput(false); setLinkValue('');
        toast.success(`Found ${result.images.length} carousel slides!`);
        const blobUrls: string[] = [];
        for (const b64 of result.images) {
          const byteString = atob(b64);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          blobUrls.push(URL.createObjectURL(new Blob([ab], { type: 'image/jpeg' })));
        }
        setMultiImages(blobUrls); setTotalSlides(blobUrls.length); handleBatchAnalyze(blobUrls);
      } else if (result.imageBase64) {
        setMultiMode(false);
        const b64 = result.imageBase64;
        const byteString = atob(b64.split(',').pop() || b64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        setImageSrc(URL.createObjectURL(new Blob([ab], { type: 'image/jpeg' })));
        setStep('crop'); setShowLinkInput(false); setLinkValue('');
      } else { throw new Error('No images found in post'); }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load Instagram image. Try uploading screenshots instead.');
    } finally { setLinkLoading(false); }
  }, [linkValue, handleBatchAnalyze]);

  const handleAutoGenerate = useCallback(() => {
    setStep('analyzing');
    setTimeout(() => {
      setVariations(getAutoLayouts());
      setActiveVariation(0);
      setStep('preview');
      localStorage.setItem('grid-inspire-used', '1');
    }, 2800);
  }, []);

  const handleAnalyzeComplete = useCallback((response: any) => {
    const parsed = parseInspireResponse(response, `inspire-${Date.now()}`, 'Inspired Layout');
    const baseLayout = parsed.layout;
    const baseTextLayers = parsed.textLayers;
    const watermark = parsed.watermark;

    const watermarkLayer = (raw: any, colorOverride?: string): TextLayer | null => {
      if (!raw?.text) return null;
      return createTextLayer({
        text: String(raw.text), fontFamily: 'DM Sans', fontWeight: 300,
        fontSize: clamp(toFiniteNumber(raw.fontSize, 11), 8, 28),
        color: colorOverride || normalizeColor(raw.color, '#888888'),
        opacity: clamp(toFiniteNumber(raw.opacity, 0.7), 0, 1),
        letterSpacing: 3, textTransform: 'uppercase',
        x: clamp(toFiniteNumber(raw.x, 50), 0, 100),
        y: clamp(toFiniteNumber(raw.y, 95), 0, 100),
      });
    };

    const bgColor = parsed.backgroundColor;
    const faithfulBg = parsed.background;

    const wmFaithful = watermarkLayer(watermark);
    const wmCinematic = watermarkLayer(watermark, '#FAFAF8');

    const vars: LayoutVariation[] = [
      {
        layout: baseLayout,
        textLayers: [...baseTextLayers, ...(wmFaithful ? [wmFaithful] : [])],
        background: faithfulBg,
        label: 'Faithful', description: 'Exact recreation',
      },
      {
        layout: { ...baseLayout, id: `${baseLayout.id}-v1` },
        textLayers: [...baseTextLayers, ...(wmFaithful ? [wmFaithful] : [])],
        background: { type: 'solid', color: lightenColor(bgColor, 20) },
        label: 'Editorial', description: 'Lighter palette',
      },
      {
        layout: { ...baseLayout, id: `${baseLayout.id}-v2` },
        textLayers: [...baseTextLayers.map(l => ({ ...l, color: '#FAFAF8' })), ...(wmCinematic ? [wmCinematic] : [])],
        background: { type: 'solid', color: '#1A1816' },
        label: 'Cinematic', description: 'Dark mood',
      },
      {
        layout: {
          ...baseLayout, id: `${baseLayout.id}-v3`,
          freePositions: baseLayout.freePositions ? baseLayout.freePositions.map(p => p ? { ...p, borderWidth: 0 } : null) : undefined,
        },
        textLayers: [],
        background: { type: 'solid', color: '#FAFAF8' },
        label: 'Minimal', description: 'Clean & simple',
      },
    ];

    setVariations(vars);
    setActiveVariation(0);
    setStep('preview');
    localStorage.setItem('grid-inspire-used', '1');
  }, []);

  const handleShuffle = useCallback(() => {
    if (!variations.length) return;
    const base = variations[0];
    const newVars = generateVariations(base.layout, base.textLayers).map((v, i) => ({
      ...v, background: variations[i]?.background ?? base.background,
    }));
    setVariations(newVars);
    setActiveVariation(0);
    setShuffleKey(k => k + 1);
  }, [variations]);

  const handleApply = useCallback(() => {
    const v = variations[activeVariation];
    if (!v) return;
    setApplied(true);
    setTimeout(() => {
      onLayoutGenerated(v.layout, v.textLayers, v.background ?? null, v.layout.freePositions ?? null);
      toast.success('Layout applied — start adding photos!');
    }, 400);
  }, [variations, activeVariation, onLayoutGenerated]);

  const navigateVariation = useCallback((dir: -1 | 1) => {
    setActiveVariation(prev => {
      const next = prev + dir;
      if (next < 0) return variations.length - 1;
      if (next >= variations.length) return 0;
      return next;
    });
  }, [variations.length]);

  // ─── Entry Screen ───
  if (step === 'entry') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="w-11" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>AI Layouts</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-5 pb-8">
          <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-3 duration-700">
            <div className="relative mx-auto w-14 h-14 mb-5">
              <div className="absolute inset-0 bg-primary/10 skeleton-block" />
              <div className="absolute inset-0 border border-primary/20" />
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary" />
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond', fontStyle: 'italic', fontWeight: 300, fontSize: '26px' }} className="text-foreground tracking-tight">Grid Inspire</h2>
            <p className="text-xs text-muted-foreground mt-2 max-w-[240px] mx-auto leading-relaxed" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>
              Turn any reference into a stunning layout. AI detects grids, fonts & composition.
            </p>
          </div>
          <div className="w-full max-w-sm space-y-2.5">
            {showLinkInput ? (
              <div className="bg-card border border-border p-4 space-y-3 animate-in fade-in zoom-in-95 duration-300">
                <p className="text-xs text-foreground flex items-center gap-2" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>
                  <Link2 className="h-3.5 w-3.5 text-primary" />Paste Instagram Post URL
                </p>
                <input
                  type="url" placeholder="https://www.instagram.com/p/..."
                  value={linkValue} onChange={(e) => setLinkValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInstagramLink()} autoFocus
                  className="w-full bg-secondary border border-border px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-all"
                  style={{ fontFamily: 'DM Sans', fontWeight: 300 }}
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-10" onClick={() => { setShowLinkInput(false); setLinkValue(''); }}>Cancel</Button>
                  <Button size="sm" className="flex-1 h-10 gap-1.5" onClick={handleInstagramLink} disabled={linkLoading || !linkValue.trim()}>
                    {linkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {linkLoading ? 'Loading…' : 'Analyze'}
                  </Button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowLinkInput(true)} className="w-full text-left bg-card border border-border p-4 flex items-center gap-4 transition-all duration-200 group min-h-[72px] active:scale-[0.98] hover:border-primary/20">
                <div className="shrink-0 w-11 h-11 flex items-center justify-center bg-secondary text-muted-foreground group-hover:scale-105 transition-all duration-200"><Link2 className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-foreground" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>Paste Instagram Link</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>Analyze any post's layout & style</p>
                </div>
              </button>
            )}
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
                input.onchange = (e) => {
                  const files = Array.from((e.target as HTMLInputElement).files || []);
                  if (files.length === 1) handleFileSelect(files[0]);
                  else if (files.length > 1) handleMultiFileSelect(files);
                };
                input.click();
              }}
              className="w-full text-left bg-card border border-border p-4 flex items-center gap-4 transition-all duration-200 group min-h-[72px] active:scale-[0.98] hover:border-primary/20"
            >
              <div className="shrink-0 w-11 h-11 flex items-center justify-center bg-secondary text-muted-foreground group-hover:scale-105 transition-all duration-200"><Upload className="h-5 w-5" /></div>
              <div>
                <p className="text-sm text-foreground" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>Upload Screenshots</p>
                <p className="text-[11px] text-muted-foreground mt-0.5" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>Upload 1 or multiple slides — AI detects each</p>
              </div>
            </button>
            <button onClick={handleAutoGenerate} className="w-full text-left bg-primary/8 border border-primary/20 p-4 flex items-center gap-4 transition-all duration-200 group min-h-[72px] active:scale-[0.98] hover:bg-primary/12 hover:border-primary/30">
              <div className="shrink-0 w-11 h-11 flex items-center justify-center bg-primary/15 text-primary group-hover:scale-105 transition-all duration-200"><Wand2 className="h-5 w-5" /></div>
              <div>
                <p className="text-sm text-foreground" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>Auto Generate</p>
                <p className="text-[11px] text-muted-foreground mt-0.5" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>AI picks the best layouts for you</p>
              </div>
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/40 mt-8 text-center" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>
            Pro tip: Screenshot any grid design you love — AI will recreate it
          </p>
        </div>
      </div>
    );
  }

  // ─── Crop Screen ───
  if (step === 'crop' && imageSrc) {
    return (
      <InspireCropView
        imageSrc={imageSrc}
        onBack={() => { setStep('entry'); setImageSrc(null); }}
        onAnalyze={async (base64) => {
          setStep('analyzing');
          try {
            const resp = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-grid-layout`,
              { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }, body: JSON.stringify({ image: base64 }) }
            );
            if (!resp.ok) throw new Error('Analysis failed');
            const fullResponse = await resp.json();
            console.log('[Inspire] edge fn response:', JSON.stringify(fullResponse, null, 2));
            if (!fullResponse.layout?.cells?.length && !fullResponse.freeCells?.length) throw new Error('Could not detect a grid');
            handleAnalyzeComplete(fullResponse);
          } catch (err: any) {
            toast.error(err.message || 'Failed to analyze');
            setStep('crop');
          }
        }}
      />
    );
  }

  // ─── Analyzing Screen ───
  if (step === 'analyzing') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
        <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-500 px-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-2 border-border" style={{ borderRadius: '50%' }} />
            <div className="absolute inset-0 border-2 border-primary border-t-transparent animate-spin" style={{ borderRadius: '50%', animationDuration: '1.2s' }} />
            <div className="absolute inset-[6px] border border-primary/20 border-b-transparent animate-spin" style={{ borderRadius: '50%', animationDuration: '2s', animationDirection: 'reverse' }} />
            <Sparkles className="absolute inset-0 m-auto h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontStyle: 'italic', fontWeight: 300, fontSize: '20px' }} className="text-foreground mb-1">
              {totalSlides > 1 ? 'Analyzing Slides' : 'Analyzing Design'}
            </h3>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>
              {totalSlides > 1 ? `Slide ${analyzingSlide} of ${totalSlides}` : 'This takes a few seconds'}
            </p>
          </div>
          <div className="space-y-3 text-left max-w-[220px] mx-auto">
            {ANALYSIS_PHASES.map((phase, i) => {
              const isComplete = i < analysisPhase;
              const isActive = i === analysisPhase;
              const isVisible = i <= analysisPhase;
              return (
                <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${!isVisible ? 'opacity-0 translate-y-2' : isComplete ? 'opacity-70' : isActive ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 transition-all duration-300 ${isComplete ? 'bg-primary/20 text-primary' : isActive ? 'bg-primary/10 text-primary skeleton-block' : 'bg-secondary text-muted-foreground'}`}>
                    {isComplete ? <Check className="h-3 w-3" /> : <phase.Icon className="h-3 w-3" strokeWidth={1.5} />}
                  </div>
                  <span className={`text-xs transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} style={{ fontFamily: 'DM Sans', fontWeight: isActive ? 400 : 300 }}>
                    {phase.text}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="w-48 mx-auto">
            <div className="h-1 bg-secondary overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-700 ease-out"
                style={{ width: `${totalSlides > 1 ? ((analyzingSlide) / totalSlides) * 100 : ((analysisPhase + 1) / ANALYSIS_PHASES.length) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Multi-Slide Preview ───
  if (step === 'preview' && multiMode && multiResults.length > 0) {
    const current = multiResults[currentSlideIndex];
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="px-4 py-3 flex items-center justify-between border-b border-border/30">
          <button onClick={() => { setStep('entry'); setMultiResults([]); setMultiImages([]); }} className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"><ArrowLeft className="h-4 w-4" /></button>
          <div className="text-center">
            <h2 className="text-xs tracking-[0.15em] uppercase text-foreground" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>{multiResults.length} Slides Detected</h2>
            <p className="text-[9px] text-muted-foreground mt-0.5" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>Slide {currentSlideIndex + 1} of {multiResults.length}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-lg mx-auto space-y-4">
            <div className="overflow-hidden border border-border/50 bg-muted">
              <img src={current.image} alt={`Slide ${currentSlideIndex + 1}`} className="w-full object-contain max-h-[240px]" loading="lazy" decoding="async" />
            </div>
            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-foreground" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>Detected Layout</p>
                  <p className="text-[10px] text-muted-foreground" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>{current.layout.cells.length} cells • {current.layout.gridCols}×{current.layout.gridRows} grid</p>
                </div>
                {current.textLayers.length > 0 && (
                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>
                    {current.textLayers.length} text detected
                  </span>
                )}
              </div>
              <div className="w-full overflow-hidden bg-secondary/30" style={{ aspectRatio: `${current.layout.canvasRatio || 1}`, maxHeight: 180 }}>
                <div className="w-full h-full grid p-1" style={{ gridTemplateColumns: `repeat(${current.layout.gridCols}, 1fr)`, gridTemplateRows: `repeat(${current.layout.gridRows}, 1fr)`, gap: '3px' }}>
                  {current.layout.cells.map((cell, ci) => (
                    <div key={ci} className="bg-primary/12 flex items-center justify-center" style={{ gridRow: `${cell[0]} / ${cell[2]}`, gridColumn: `${cell[1]} / ${cell[3]}` }}>
                      <Images className="h-3 w-3 text-primary/30" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-border/30 bg-card/50">
          <div className="flex gap-1.5 px-3 py-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {multiResults.map((result, i) => (
              <button key={i} onClick={() => setCurrentSlideIndex(i)} className={`shrink-0 overflow-hidden border-2 transition-all ${i === currentSlideIndex ? 'border-primary scale-100' : 'border-transparent opacity-50 hover:opacity-80 scale-95'}`}>
                <img src={result.image} alt="" className="w-12 h-12 object-cover" loading="lazy" decoding="async" />
                <p className={`text-[7px] text-center py-0.5 ${i === currentSlideIndex ? 'text-primary' : 'text-muted-foreground'}`} style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>{i + 1}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 pt-2 flex gap-2.5 max-w-sm mx-auto w-full" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
          <Button variant="outline" className="h-12 px-4 gap-1.5" onClick={() => { onLayoutGenerated(current.layout, current.textLayers, current.background ?? null, current.layout.freePositions ?? null); toast.success(`Slide ${currentSlideIndex + 1} layout applied!`); }}>
            <Check className="h-3.5 w-3.5" />This Slide
          </Button>
          <Button className="flex-1 h-12 gap-2 text-sm tracking-wide" onClick={() => { onLayoutGenerated(current.layout, current.textLayers, current.background ?? null, current.layout.freePositions ?? null); toast.success('Layout applied!'); }}>
            <Sparkles className="h-4 w-4" />Apply & Edit
          </Button>
        </div>
      </div>
    );
  }

  // ─── Preview Screen (single-image) ───
  if (step === 'preview' && variations.length > 0) {
    const current = variations[activeVariation];

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col" key={shuffleKey}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-border/30">
          <button onClick={() => setStep('entry')} className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"><ArrowLeft className="h-4 w-4" /></button>
          <div className="text-center">
            <h2 className="text-xs tracking-[0.15em] uppercase text-foreground" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>Choose Layout</h2>
            <p className="text-[9px] text-muted-foreground mt-0.5" style={{ fontFamily: 'DM Sans', fontWeight: 300 }}>{variations.length} variations</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>

        {/* Main preview */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-4 min-h-0">
          <div className="animate-in fade-in zoom-in-95 duration-400 w-full max-w-[320px]">
            {/* FIX 1 — background prop now passed */}
            <LayoutPreviewCard
              layout={current.layout}
              label={current.label}
              description={current.description}
              background={current.background}
              large
            />
          </div>

          <div className="flex items-center gap-6 mt-5">
            <button onClick={() => navigateVariation(-1)} className="h-10 w-10 border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-90">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-2">
              {variations.map((_, i) => (
                <button key={i} onClick={() => setActiveVariation(i)}
                  className={`transition-all duration-300 ${i === activeVariation ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-muted-foreground/20 hover:bg-muted-foreground/40'}`}
                  style={{ borderRadius: i === activeVariation ? '1px' : '50%' }} />
              ))}
            </div>
            <button onClick={() => navigateVariation(1)} className="h-10 w-10 border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-90">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Variation strip */}
        <div className="px-2 pb-2">
          <div ref={scrollRef} className="flex gap-2 px-3 py-2 overflow-x-auto snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
            {variations.map((v, i) => (
              <button key={v.layout.id} onClick={() => setActiveVariation(i)}
                className={`snap-center shrink-0 transition-all duration-300 p-1.5 ${i === activeVariation ? 'ring-2 ring-primary scale-100' : 'opacity-50 hover:opacity-80 scale-95'}`}>
                {/* FIX 1 — background prop now passed */}
                <MiniLayoutCard layout={v.layout} background={v.background} />
                <span style={{
                  fontFamily: 'DM Sans', fontWeight: 300, fontSize: '8px',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  display: 'block', textAlign: 'center', marginTop: '4px',
                  color: i === activeVariation ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                }}>{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="px-5 pb-6 pt-2 flex gap-2.5 max-w-sm mx-auto w-full" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
          <Button variant="outline" className="h-12 px-4 gap-1.5" onClick={handleShuffle}>
            <Shuffle className="h-3.5 w-3.5" />
          </Button>
          <Button
            className={`flex-1 h-12 gap-2 text-sm tracking-wide transition-all duration-300 ${applied ? 'bg-green-600 hover:bg-green-600 text-white' : ''}`}
            onClick={handleApply} disabled={applied}
          >
            {applied ? <><Check className="h-4 w-4" /> Applied!</> : <><Sparkles className="h-4 w-4" /> Apply Layout</>}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Sub-components ───────────────────────────────────────

// FIX 2 — LayoutPreviewCard now accepts background + renders freePositions
function LayoutPreviewCard({
  layout, label, description, large, background,
}: {
  layout: GridLayout;
  label: string;
  description?: string;
  large?: boolean;
  background?: BackgroundStyle | null;
}) {
  const bgStyle = background?.type === 'gradient'
    ? { background: `linear-gradient(${background.gradientAngle || 180}deg, ${background.color}, ${background.gradientTo})` }
    : { background: background?.color || 'hsl(var(--card))' };

  const isDark = background?.color === '#1A1816' || background?.color === '#0E0D0B';
  const cellBg = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.13)';
  const size = large ? 260 : 200;
  const gap = large ? 4 : 3;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="overflow-hidden border border-border/40 transition-all duration-300"
        style={{ width: size, height: size, ...bgStyle, padding: large ? 10 : 6 }}
      >
        <div className="w-full h-full relative">
          {layout.freePositions && layout.freePositions.some(Boolean) ? (
            layout.freePositions.map((pos, i) =>
              pos ? (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${pos.x}%`, top: `${pos.y}%`,
                  width: `${pos.width}%`, height: `${pos.height}%`,
                  transform: `rotate(${pos.rotation}deg) scale(${pos.scale || 1})`,
                  transformOrigin: 'center center',
                  zIndex: pos.zIndex,
                  opacity: pos.opacity,
                  background: cellBg,
                  border: pos.borderWidth > 0 ? `${Math.max(1, pos.borderWidth * 0.4)}px solid ${pos.borderColor}` : 'none',
                }} />
              ) : null
            )
          ) : (
            <div className="w-full h-full" style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
              gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
              gap,
            }}>
              {layout.cells.map((cell, i) => (
                <div key={i} style={{
                  gridRow: `${cell[0]} / ${cell[2]}`,
                  gridColumn: `${cell[1]} / ${cell[3]}`,
                  background: cellBg,
                }} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="text-center">
        <span style={{ fontFamily: 'Cormorant Garamond', fontStyle: 'italic', fontWeight: 300, fontSize: '18px', color: 'hsl(var(--foreground))' }}>
          {label}
        </span>
        {description && large && (
          <p style={{ fontFamily: 'DM Sans', fontWeight: 300, fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

// FIX 3 — MiniLayoutCard now accepts background + renders freePositions
function MiniLayoutCard({
  layout, background,
}: {
  layout: GridLayout;
  background?: BackgroundStyle | null;
}) {
  const bgStyle = background?.type === 'gradient'
    ? { background: `linear-gradient(${background.gradientAngle || 180}deg, ${background.color}, ${background.gradientTo})` }
    : { background: background?.color || 'hsl(var(--secondary) / 0.5)' };

  const isDark = background?.color === '#1A1816' || background?.color === '#0E0D0B';
  const cellBg = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)';

  return (
    <div className="w-14 h-14 overflow-hidden relative" style={bgStyle}>
      {layout.freePositions && layout.freePositions.some(Boolean) ? (
        layout.freePositions.map((pos, i) =>
          pos ? (
            <div key={i} style={{
              position: 'absolute',
              left: `${pos.x}%`, top: `${pos.y}%`,
              width: `${pos.width}%`, height: `${pos.height}%`,
              transform: `rotate(${pos.rotation}deg)`,
              background: cellBg,
            }} />
          ) : null
        )
      ) : (
        <div className="w-full h-full" style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
          gap: 1,
          padding: 2,
        }}>
          {layout.cells.map((cell, i) => (
            <div key={i} style={{
              gridRow: `${cell[0]} / ${cell[2]}`,
              gridColumn: `${cell[1]} / ${cell[3]}`,
              background: cellBg,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
