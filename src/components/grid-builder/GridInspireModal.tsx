/**
 * Grid Inspire — Premium AI layout generation experience.
 * Three-step flow: Entry → Crop/Analyze → Preview with variations.
 * Supports multi-slide carousel posts from Instagram or multiple uploaded screenshots.
 * Mobile-first, gesture-friendly, editorial design language.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { X, Upload, Sparkles, Loader2, Link2, Images, ArrowLeft, Shuffle, Check, ChevronLeft, ChevronRight, Wand2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { GridLayout } from './types';
import { GRID_LAYOUTS } from './types';
import type { TextLayer } from './text-overlay-types';
import { createTextLayer, FONTS } from './text-overlay-types';
import InspireCropView from './InspireCropView';

interface Props {
  onClose: () => void;
  onLayoutGenerated: (layout: GridLayout, textLayers: TextLayer[]) => void;
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
}

// ─── Analysis phases with icons ───
import { Search as SearchIcon, Ruler, Type as TypeIcon } from 'lucide-react';
const ANALYSIS_PHASES = [
  { text: 'Scanning composition…', Icon: SearchIcon },
  { text: 'Mapping grid structure…', Icon: Ruler },
  { text: 'Detecting typography…', Icon: TypeIcon },
  { text: 'Crafting variations…', Icon: Sparkles },
];

// ─── Variation metadata ───
const STYLE_META = [
  { label: 'Minimal', description: 'Clean, balanced spacing' },
  { label: 'Editorial', description: 'Magazine-style emphasis' },
  { label: 'Cinematic', description: 'Wide, dramatic framing' },
  { label: 'Balanced', description: 'Symmetrical, harmonious' },
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
  const variations: LayoutVariation[] = [
    { layout: base, textLayers, ...STYLE_META[0] },
  ];

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
      picked.push({
        layout: shuffled[i],
        textLayers: [],
        ...STYLE_META[picked.length % STYLE_META.length],
      });
    }
  }
  return picked.slice(0, 6);
}

// ─── Cell color palette for preview cards ───
const CELL_COLORS = [
  'hsl(var(--primary) / 0.15)',
  'hsl(var(--primary) / 0.10)',
  'hsl(var(--primary) / 0.08)',
  'hsl(var(--muted-foreground) / 0.08)',
  'hsl(var(--primary) / 0.12)',
  'hsl(var(--muted-foreground) / 0.06)',
];

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

  // Multi-slide state
  const [multiImages, setMultiImages] = useState<string[]>([]);
  const [multiResults, setMultiResults] = useState<Array<{ layout: GridLayout; textLayers: TextLayer[]; image: string }>>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [analyzingSlide, setAnalyzingSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const [multiMode, setMultiMode] = useState(false);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      multiImages.forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, []);

  // Analysis phase animation
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

  // Scroll to active variation
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

    const results: Array<{ layout: GridLayout; textLayers: TextLayer[]; image: string }> = [];

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
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ image: base64 }),
          }
        );

        if (resp.ok) {
          const { layout, textBlocks } = await resp.json();
          if (layout?.cells?.length) {
            const generated: GridLayout = {
              id: `inspire-${Date.now()}-${i}`,
              name: `Slide ${i + 1}`,
              category: 'creative',
              cols: layout.gridCols,
              rows: layout.gridRows,
              cells: layout.cells,
              gridCols: layout.gridCols,
              gridRows: layout.gridRows,
              canvasRatio: layout.canvasRatio || 1,
            };
            const textLayers = textBlocks?.length ? textBlocksToLayers(textBlocks) : [];
            results.push({ layout: generated, textLayers, image: imageUrls[i] });
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
    if (images.length === 1) {
      setMultiMode(false);
      setImageSrc(URL.createObjectURL(images[0]));
      setStep('crop');
      return;
    }
    setMultiMode(true);
    const urls = images.map(f => URL.createObjectURL(f));
    setMultiImages(urls);
    setTotalSlides(urls.length);
    handleBatchAnalyze(urls);
  }, [handleBatchAnalyze]);

  const handleInstagramLink = useCallback(async () => {
    const url = linkValue.trim();
    if (!url) { toast.error('Please paste an Instagram link'); return; }
    if (!/instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/i.test(url)) {
      toast.error('Please paste a valid Instagram post or reel link');
      return;
    }
    setLinkLoading(true);
    try {
      const proxyResp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-instagram-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ url }),
        }
      );
      if (!proxyResp.ok) {
        const errData = await proxyResp.json().catch(() => ({}));
        throw new Error(errData.error || 'Could not fetch Instagram image');
      }
      const result = await proxyResp.json();

      // Check if carousel with multiple images
      if (result.images && result.images.length > 1) {
        setMultiMode(true);
        setShowLinkInput(false);
        setLinkValue('');
        toast.success(`Found ${result.images.length} carousel slides!`);

        const blobUrls: string[] = [];
        for (const b64 of result.images) {
          const byteString = atob(b64);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          const blob = new Blob([ab], { type: 'image/jpeg' });
          blobUrls.push(URL.createObjectURL(blob));
        }
        setMultiImages(blobUrls);
        setTotalSlides(blobUrls.length);
        handleBatchAnalyze(blobUrls);
      } else if (result.imageBase64) {
        setMultiMode(false);
        const b64 = result.imageBase64;
        const byteString = atob(b64.split(',').pop() || b64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: 'image/jpeg' });
        setImageSrc(URL.createObjectURL(blob));
        setStep('crop');
        setShowLinkInput(false);
        setLinkValue('');
      } else {
        throw new Error('No images found in post');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load Instagram image. Try uploading screenshots instead.');
    } finally {
      setLinkLoading(false);
    }
  }, [linkValue, handleBatchAnalyze]);

  const handleAutoGenerate = useCallback(() => {
    setStep('analyzing');
    setTimeout(() => {
      const auto = getAutoLayouts();
      setVariations(auto);
      setActiveVariation(0);
      setStep('preview');
      localStorage.setItem('grid-inspire-used', '1');
    }, 2800);
  }, []);

  const handleAnalyzeComplete = useCallback((layout: GridLayout, textBlocks: DetectedTextBlock[]) => {
    const textLayers = textBlocks?.length ? textBlocksToLayers(textBlocks) : [];
    const vars = generateVariations(layout, textLayers);
    setVariations(vars);
    setActiveVariation(0);
    setStep('preview');
    localStorage.setItem('grid-inspire-used', '1');
  }, []);

  const handleShuffle = useCallback(() => {
    if (!variations.length) return;
    const base = variations[0];
    const newVars = generateVariations(base.layout, base.textLayers);
    setVariations(newVars);
    setActiveVariation(0);
    setShuffleKey(k => k + 1);
  }, [variations]);

  const handleApply = useCallback(() => {
    const v = variations[activeVariation];
    if (!v) return;
    setApplied(true);
    setTimeout(() => {
      onLayoutGenerated(v.layout, v.textLayers);
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
        <EntryHeader onClose={onClose} />
        <div className="flex-1 flex flex-col items-center justify-center px-5 pb-8">
          {/* Hero section */}
          <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-3 duration-700">
            <div className="relative mx-auto w-14 h-14 mb-5">
              <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse" />
              <div className="absolute inset-0 rounded-2xl border border-primary/20" />
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight">Grid Inspire</h2>
            <p className="text-xs text-muted-foreground mt-2 max-w-[240px] mx-auto leading-relaxed">
              Turn any reference into a stunning layout. AI detects grids, fonts & composition.
            </p>
          </div>

          <div className="w-full max-w-sm space-y-2.5">
            {showLinkInput ? (
              <div className="rounded-2xl bg-card border border-border p-4 space-y-3 animate-in fade-in zoom-in-95 duration-300">
                <p className="text-xs text-foreground font-medium flex items-center gap-2">
                  <Link2 className="h-3.5 w-3.5 text-primary" />
                  Paste Instagram Post URL
                </p>
                <input
                  type="url"
                  placeholder="https://www.instagram.com/p/..."
                  value={linkValue}
                  onChange={(e) => setLinkValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInstagramLink()}
                  autoFocus
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-10"
                    onClick={() => { setShowLinkInput(false); setLinkValue(''); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 h-10 gap-1.5"
                    onClick={handleInstagramLink}
                    disabled={linkLoading || !linkValue.trim()}
                  >
                    {linkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {linkLoading ? 'Loading…' : 'Analyze'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '100ms' }}>
                <EntryCard
                  icon={<Link2 className="h-5 w-5" />}
                  title="Paste Instagram Link"
                  subtitle="Analyze any post's layout & style"
                  onClick={() => setShowLinkInput(true)}
                />
              </div>
            )}

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '200ms' }}>
              <EntryCard
                icon={<Upload className="h-5 w-5" />}
                title="Upload Screenshots"
                subtitle="Upload 1 or multiple slides — AI detects each"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || []);
                    if (files.length === 1) {
                      handleFileSelect(files[0]);
                    } else if (files.length > 1) {
                      handleMultiFileSelect(files);
                    }
                  };
                  input.click();
                }}
              />
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '300ms' }}>
              <EntryCard
                icon={<Wand2 className="h-5 w-5" />}
                title="Auto Generate"
                subtitle="AI picks the best layouts for you"
                onClick={handleAutoGenerate}
                highlight
              />
            </div>
          </div>

          {/* Tip */}
          <p className="text-[10px] text-muted-foreground/40 mt-8 text-center animate-in fade-in duration-700" style={{ animationDelay: '500ms' }}>
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
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                },
                body: JSON.stringify({ image: base64 }),
              }
            );
            if (!resp.ok) throw new Error('Analysis failed');
            const { layout, textBlocks } = await resp.json();
            if (!layout?.cells?.length) throw new Error('Could not detect a grid');
            const generated: GridLayout = {
              id: `inspire-${Date.now()}`, name: 'Inspired Layout', category: 'creative',
              cols: layout.gridCols, rows: layout.gridRows,
              cells: layout.cells, gridCols: layout.gridCols, gridRows: layout.gridRows,
              canvasRatio: layout.canvasRatio || 1,
            };
            handleAnalyzeComplete(generated, textBlocks || []);
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
          {/* Animated ring spinner */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-border" />
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" style={{ animationDuration: '1.2s' }} />
            <div className="absolute inset-[6px] rounded-full border border-primary/20 border-b-transparent animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
            <Sparkles className="absolute inset-0 m-auto h-7 w-7 text-primary" />
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-1">
              {totalSlides > 1 ? 'Analyzing Slides' : 'Analyzing Design'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {totalSlides > 1
                ? `Slide ${analyzingSlide} of ${totalSlides}`
                : 'This takes a few seconds'}
            </p>
          </div>

          {/* Phase steps */}
          <div className="space-y-3 text-left max-w-[220px] mx-auto">
            {ANALYSIS_PHASES.map((phase, i) => {
              const isComplete = i < analysisPhase;
              const isActive = i === analysisPhase;
              const isVisible = i <= analysisPhase;

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    !isVisible ? 'opacity-0 translate-y-2' :
                    isComplete ? 'opacity-70' :
                    isActive ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0 transition-all duration-300 ${
                    isComplete ? 'bg-primary/20 text-primary' :
                    isActive ? 'bg-primary/10 text-primary animate-pulse' :
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {isComplete ? <Check className="h-3 w-3" /> : <phase.Icon className="h-3 w-3" strokeWidth={1.5} />}
                  </div>
                  <span className={`text-xs transition-colors duration-300 ${
                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}>
                    {phase.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="w-48 mx-auto">
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-700 ease-out"
                style={{ width: `${totalSlides > 1
                  ? ((analyzingSlide) / totalSlides) * 100
                  : ((analysisPhase + 1) / ANALYSIS_PHASES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Multi-Slide Preview Screen ───
  if (step === 'preview' && multiMode && multiResults.length > 0) {
    const current = multiResults[currentSlideIndex];

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-border/30">
          <button onClick={() => { setStep('entry'); setMultiResults([]); setMultiImages([]); }} className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-foreground">
              {multiResults.length} Slides Detected
            </h2>
            <p className="text-[9px] text-muted-foreground mt-0.5">
              Slide {currentSlideIndex + 1} of {multiResults.length}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current slide — reference image + detected layout */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-lg mx-auto space-y-4">
            {/* Reference image */}
            <div className="rounded-xl overflow-hidden border border-border/50 bg-muted">
              <img src={current.image} alt={`Slide ${currentSlideIndex + 1}`} className="w-full object-contain max-h-[240px]" />
            </div>

            {/* Detected layout preview */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">Detected Layout</p>
                  <p className="text-[10px] text-muted-foreground">{current.layout.cells.length} cells • {current.layout.gridCols}×{current.layout.gridRows} grid</p>
                </div>
                {current.textLayers.length > 0 && (
                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {current.textLayers.length} text{current.textLayers.length > 1 ? 's' : ''} detected
                  </span>
                )}
              </div>

              {/* Grid preview */}
              <div
                className="w-full rounded-lg overflow-hidden bg-secondary/30"
                style={{ aspectRatio: `${current.layout.canvasRatio || 1}`, maxHeight: 180 }}
              >
                <div
                  className="w-full h-full grid p-1"
                  style={{
                    gridTemplateColumns: `repeat(${current.layout.gridCols}, 1fr)`,
                    gridTemplateRows: `repeat(${current.layout.gridRows}, 1fr)`,
                    gap: '3px',
                  }}
                >
                  {current.layout.cells.map((cell, ci) => (
                    <div
                      key={ci}
                      className="bg-primary/12 rounded-[3px] flex items-center justify-center"
                      style={{
                        gridRow: `${cell[0]} / ${cell[2]}`,
                        gridColumn: `${cell[1]} / ${cell[3]}`,
                      }}
                    >
                      <Images className="h-3 w-3 text-primary/30" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Detected text blocks */}
              {current.textLayers.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">Detected text</p>
                  {current.textLayers.map((tl, ti) => (
                    <div key={ti} className="flex items-center gap-2 bg-muted/30 rounded-lg px-2.5 py-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: tl.color, border: '1px solid hsl(var(--border))' }} />
                      <span className="text-[11px] text-foreground truncate flex-1" style={{ fontFamily: tl.fontFamily }}>
                        {tl.text}
                      </span>
                      <span className="text-[8px] text-muted-foreground shrink-0">{tl.fontFamily} {tl.fontWeight}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Slide strip — horizontal scroll at bottom */}
        <div className="border-t border-border/30 bg-card/50">
          <div className="flex gap-1.5 px-3 py-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {multiResults.map((result, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlideIndex(i)}
                className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  i === currentSlideIndex
                    ? 'border-primary shadow-md shadow-primary/20 scale-100'
                    : 'border-transparent opacity-50 hover:opacity-80 scale-95'
                }`}
              >
                <img src={result.image} alt="" className="w-12 h-12 object-cover" />
                <p className={`text-[7px] text-center py-0.5 font-medium ${
                  i === currentSlideIndex ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {i + 1}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="px-5 pt-2 flex gap-2.5 max-w-sm mx-auto w-full" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
          <Button
            variant="outline"
            className="h-12 px-4 gap-1.5"
            onClick={() => {
              onLayoutGenerated(current.layout, current.textLayers);
              toast.success(`Slide ${currentSlideIndex + 1} layout applied!`);
            }}
          >
            <Check className="h-3.5 w-3.5" />
            This Slide
          </Button>
          <Button
            className="flex-1 h-12 gap-2 text-sm font-medium tracking-wide shadow-lg shadow-primary/20"
            onClick={() => {
              onLayoutGenerated(current.layout, current.textLayers);
              if (currentSlideIndex < multiResults.length - 1) {
                toast.success(`Slide ${currentSlideIndex + 1} applied! Open Inspire again for the next slide.`);
              } else {
                toast.success('Layout applied — start adding your photos!');
              }
            }}
          >
            <Sparkles className="h-4 w-4" />
            Apply & Edit
          </Button>
        </div>
      </div>
    );
  }

  // ─── Preview Screen (single-image flow) ───
  if (step === 'preview' && variations.length > 0) {
    const current = variations[activeVariation];

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col" key={shuffleKey}>
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-border/30">
          <button onClick={() => setStep('entry')} className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-foreground">Choose Layout</h2>
            <p className="text-[9px] text-muted-foreground mt-0.5">{variations.length} variations</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Main preview area — large card */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-4 min-h-0">
          <div className="animate-in fade-in zoom-in-95 duration-400 w-full max-w-[340px]">
            <LayoutPreviewCard layout={current.layout} label={current.label} description={current.description} large />
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center gap-6 mt-5">
            <button
              onClick={() => navigateVariation(-1)}
              className="h-10 w-10 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all active:scale-90"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {/* Dot indicators */}
            <div className="flex gap-2">
              {variations.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveVariation(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === activeVariation
                      ? 'w-6 h-2 bg-primary'
                      : 'w-2 h-2 bg-muted-foreground/20 hover:bg-muted-foreground/40'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => navigateVariation(1)}
              className="h-10 w-10 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all active:scale-90"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Variation strip — small horizontal scroll */}
        <div className="px-2 pb-2">
          <div
            ref={scrollRef}
            className="flex gap-2 px-3 py-2 overflow-x-auto snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none' }}
          >
            {variations.map((v, i) => (
              <button
                key={v.layout.id}
                onClick={() => setActiveVariation(i)}
                className={`snap-center shrink-0 transition-all duration-300 rounded-xl p-1.5 ${
                  i === activeVariation
                    ? 'ring-2 ring-primary bg-primary/5 scale-100'
                    : 'opacity-50 hover:opacity-80 scale-95'
                }`}
              >
                <MiniLayoutCard layout={v.layout} />
                <span className={`text-[8px] font-medium tracking-wider uppercase block text-center mt-1 ${
                  i === activeVariation ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {v.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="px-5 pb-6 pt-2 flex gap-2.5 max-w-sm mx-auto w-full" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
          <Button
            variant="outline"
            className="h-12 px-4 gap-1.5"
            onClick={handleShuffle}
          >
            <Shuffle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Shuffle</span>
          </Button>
          <Button
            className={`flex-1 h-12 gap-2 text-sm font-medium tracking-wide transition-all duration-300 ${
              applied
                ? 'bg-green-600 hover:bg-green-600 text-white shadow-lg shadow-green-600/20'
                : 'shadow-lg shadow-primary/20'
            }`}
            onClick={handleApply}
            disabled={applied}
          >
            {applied ? (
              <><Check className="h-4 w-4" /> Applied!</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Apply Layout</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Sub-components ────────────────────────────────────────

function EntryHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <div className="w-11" /> {/* spacer */}
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">AI Layouts</span>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function EntryCard({
  icon, title, subtitle, onClick, disabled, highlight,
}: {
  icon: React.ReactNode; title: string; subtitle: string;
  onClick: () => void; disabled?: boolean; highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 group min-h-[72px] active:scale-[0.98] ${
        disabled
          ? 'bg-card opacity-40 cursor-not-allowed'
          : highlight
            ? 'bg-primary/8 border border-primary/20 hover:bg-primary/12 hover:border-primary/30'
            : 'bg-card border border-border hover:border-primary/20 hover:bg-card/80'
      }`}
    >
      <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
        highlight ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
      } group-hover:scale-105`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</p>
      </div>
    </button>
  );
}

function LayoutPreviewCard({ layout, label, description, large }: { layout: GridLayout; label: string; description?: string; large?: boolean }) {
  const size = large ? 280 : 200;
  const gap = large ? 4 : 3;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
          large ? 'bg-card border-border shadow-xl shadow-black/10 p-5' : 'bg-card/50 border-border/50 p-3'
        }`}
        style={{ width: size + (large ? 40 : 24), height: size + (large ? 40 : 24) }}
      >
        <div
          className="w-full h-full relative"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
            gap,
          }}
        >
          {layout.cells.map((cell, i) => (
            <div
              key={i}
              className="rounded-md transition-all duration-500"
              style={{
                gridRow: `${cell[0]} / ${cell[2]}`,
                gridColumn: `${cell[1]} / ${cell[3]}`,
                background: CELL_COLORS[i % CELL_COLORS.length],
                border: '1px solid hsl(var(--border) / 0.3)',
                animationDelay: `${i * 60}ms`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="text-center">
        <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-foreground/80">{label}</span>
        {description && large && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

function MiniLayoutCard({ layout }: { layout: GridLayout }) {
  return (
    <div
      className="w-14 h-14 rounded-lg overflow-hidden bg-secondary/50"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
        gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
        gap: 1,
        padding: 2,
      }}
    >
      {layout.cells.map((cell, i) => (
        <div
          key={i}
          className="rounded-[2px]"
          style={{
            gridRow: `${cell[0]} / ${cell[2]}`,
            gridColumn: `${cell[1]} / ${cell[3]}`,
            background: CELL_COLORS[i % CELL_COLORS.length],
          }}
        />
      ))}
    </div>
  );
}
