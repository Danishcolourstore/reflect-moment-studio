/**
 * Grid Inspire — World-class AI layout generation experience.
 * Zero-clutter, 3-action entry, smart preview with variations, one-tap apply.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { X, Upload, Sparkles, Loader2, Link2, Images, ArrowLeft, Shuffle, Check, ChevronLeft, ChevronRight } from 'lucide-react';
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
}

// ─── Analysis phases for animated feedback ───
const ANALYSIS_PHASES = [
  'Analyzing layout…',
  'Understanding structure…',
  'Detecting typography…',
  'Generating variations…',
];

// ─── Variation labels ───
const STYLE_LABELS = ['Minimal', 'Editorial', 'Cinematic', 'Balanced'];

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

/** Generate layout variations by shuffling cells */
function generateVariations(base: GridLayout, textLayers: TextLayer[]): LayoutVariation[] {
  const variations: LayoutVariation[] = [
    { layout: base, textLayers, label: STYLE_LABELS[0] },
  ];

  // Create variations by shuffling cell order
  for (let v = 1; v < 4; v++) {
    const shuffledCells = [...base.cells];
    for (let i = shuffledCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCells[i], shuffledCells[j]] = [shuffledCells[j], shuffledCells[i]];
    }
    variations.push({
      layout: { ...base, id: `${base.id}-v${v}`, cells: shuffledCells },
      textLayers: textLayers.map(l => ({ ...l })),
      label: STYLE_LABELS[v] || `Variation ${v}`,
    });
  }

  return variations;
}

// ─── Quick-generate layouts from common categories ───
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
        label: STYLE_LABELS[picked.length % STYLE_LABELS.length],
      });
    }
  }
  return picked.slice(0, 6);
}

export default function GridInspireModal({ onClose, onLayoutGenerated }: Props) {
  const [step, setStep] = useState<Step>('entry');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [variations, setVariations] = useState<LayoutVariation[]>([]);
  const [activeVariation, setActiveVariation] = useState(0);
  const [expandedView, setExpandedView] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState(0);
  const [applied, setApplied] = useState(false);
  const [isFirstUse] = useState(() => !localStorage.getItem('grid-inspire-used'));
  const scrollRef = useRef<HTMLDivElement>(null);

  // Analysis phase animation
  useEffect(() => {
    if (step !== 'analyzing') return;
    setAnalysisPhase(0);
    const interval = setInterval(() => {
      setAnalysisPhase(p => {
        if (p >= ANALYSIS_PHASES.length - 1) { clearInterval(interval); return p; }
        return p + 1;
      });
    }, 700);
    return () => clearInterval(interval);
  }, [step]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image'); return; }
    setImageSrc(URL.createObjectURL(file));
    setStep('crop');
  }, []);

  const handleAutoGenerate = useCallback(() => {
    setStep('analyzing');
    setTimeout(() => {
      const auto = getAutoLayouts();
      setVariations(auto);
      setActiveVariation(0);
      setStep('preview');
      localStorage.setItem('grid-inspire-used', '1');
    }, 1200);
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
  }, [variations]);

  const handleApply = useCallback(() => {
    const v = variations[activeVariation];
    if (!v) return;
    setApplied(true);
    setTimeout(() => {
      onLayoutGenerated(v.layout, v.textLayers);
      toast.success('Layout Applied');
    }, 300);
  }, [variations, activeVariation, onLayoutGenerated]);

  // ─── Entry Screen ───
  if (step === 'entry') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0b] flex flex-col">
        <EntryHeader onClose={onClose} />
        <div className="flex-1 flex flex-col items-center justify-center px-5 pb-8">
          <div className="text-center mb-8 animate-fade-in">
            <Sparkles className="h-6 w-6 text-primary mx-auto mb-3 opacity-80" />
            <h2 className="text-lg font-serif font-semibold text-white tracking-wide">Grid Inspire</h2>
            <p className="text-[11px] text-white/40 mt-1.5 tracking-wider">
              Turn inspiration into layouts instantly
            </p>
          </div>

          {isFirstUse && (
            <p className="text-[10px] text-white/30 mb-5 text-center animate-fade-in">
              Choose inspiration → AI builds your layout
            </p>
          )}

          <div className="w-full max-w-sm space-y-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <EntryCard
              icon={<Link2 className="h-5 w-5" />}
              title="Paste Instagram Link"
              subtitle="Analyze any post's grid"
              onClick={() => toast.info('Coming soon — use Upload for now')}
              disabled
            />
            <EntryCard
              icon={<Upload className="h-5 w-5" />}
              title="Upload Screenshot"
              subtitle="AI detects layout + typography"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFileSelect(file);
                };
                input.click();
              }}
            />
            <EntryCard
              icon={<Images className="h-5 w-5" />}
              title="Auto Generate"
              subtitle="AI picks the best layouts for you"
              onClick={handleAutoGenerate}
              highlight
            />
          </div>
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
      <div className="fixed inset-0 z-50 bg-[#0a0a0b] flex flex-col items-center justify-center">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse" />
            <Loader2 className="absolute inset-0 m-auto h-8 w-8 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            {ANALYSIS_PHASES.map((phase, i) => (
              <p
                key={phase}
                className={`text-xs transition-all duration-500 ${
                  i <= analysisPhase ? 'text-white/70 translate-y-0 opacity-100' : 'text-transparent translate-y-2 opacity-0'
                }`}
              >
                {i < analysisPhase ? '✓' : i === analysisPhase ? '•' : ''} {phase}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Preview Screen ───
  if (step === 'preview' && variations.length > 0) {
    const current = variations[activeVariation];

    if (expandedView) {
      return (
        <div className="fixed inset-0 z-50 bg-[#0a0a0b] flex flex-col">
          <div className="flex-1 flex items-center justify-center p-6">
            <LayoutPreviewCard layout={current.layout} label={current.label} large />
          </div>
          <div className="px-5 pb-8 pt-3 flex gap-3 max-w-sm mx-auto w-full">
            <Button variant="outline" className="flex-1 border-white/10 text-white/70 hover:bg-white/5" onClick={() => setExpandedView(false)}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back
            </Button>
            <Button variant="outline" className="border-white/10 text-white/70 hover:bg-white/5" onClick={handleShuffle}>
              <Shuffle className="h-3.5 w-3.5" />
            </Button>
            <Button
              className={`flex-1 gap-1.5 transition-all ${applied ? 'bg-green-500 hover:bg-green-500' : ''}`}
              onClick={handleApply}
              disabled={applied}
            >
              {applied ? <><Check className="h-3.5 w-3.5" /> Applied</> : 'Apply Layout'}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0b] flex flex-col">
        <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setStep('entry')} className="text-white/50 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-white/80">Choose Layout</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Horizontal carousel */}
        <div className="flex-1 flex items-center">
          <div
            ref={scrollRef}
            className="flex gap-4 px-6 py-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full"
            style={{ scrollbarWidth: 'none' }}
          >
            {variations.map((v, i) => (
              <button
                key={v.layout.id}
                onClick={() => { setActiveVariation(i); setExpandedView(true); }}
                className={`snap-center shrink-0 w-[260px] sm:w-[280px] transition-all duration-300 ${
                  i === activeVariation ? 'scale-100 opacity-100' : 'scale-95 opacity-60'
                }`}
              >
                <LayoutPreviewCard layout={v.layout} label={v.label} />
              </button>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 pb-3">
          {variations.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveVariation(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeVariation ? 'bg-primary w-4' : 'bg-white/20'}`}
            />
          ))}
        </div>

        {/* Bottom actions */}
        <div className="px-5 pb-8 pt-2 flex gap-3 max-w-sm mx-auto w-full">
          <Button variant="outline" className="border-white/10 text-white/70 hover:bg-white/5" onClick={handleShuffle}>
            <Shuffle className="h-3.5 w-3.5 mr-1.5" /> Shuffle
          </Button>
          <Button
            className={`flex-1 gap-1.5 transition-all ${applied ? 'bg-green-500 hover:bg-green-500' : ''}`}
            onClick={handleApply}
            disabled={applied}
          >
            {applied ? <><Check className="h-3.5 w-3.5" /> Applied</> : <><Sparkles className="h-3.5 w-3.5" /> Apply Layout</>}
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
    <div className="px-4 py-3 flex items-center justify-end">
      <button onClick={onClose} className="text-white/40 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
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
      className={`w-full text-left rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 group min-h-[72px] ${
        disabled
          ? 'bg-white/[0.03] opacity-40 cursor-not-allowed'
          : highlight
            ? 'bg-primary/10 border border-primary/20 hover:bg-primary/15 hover:border-primary/30 active:scale-[0.98]'
            : 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/10 active:scale-[0.98]'
      }`}
    >
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
        highlight ? 'bg-primary/20 text-primary' : 'bg-white/[0.06] text-white/50'
      } group-hover:scale-105 transition-transform`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-[10px] text-white/40 mt-0.5">{subtitle}</p>
      </div>
    </button>
  );
}

function LayoutPreviewCard({ layout, label, large }: { layout: GridLayout; label: string; large?: boolean }) {
  const size = large ? 320 : 220;
  const gap = 3;
  const cellSize = (size - gap * (Math.max(layout.gridCols, layout.gridRows) - 1)) / Math.max(layout.gridCols, layout.gridRows);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08] p-4"
        style={{ width: size + 32, height: size + 32 }}
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
              className="rounded-md bg-white/[0.08] border border-white/[0.06]"
              style={{
                gridRow: `${cell[0]} / ${cell[2]}`,
                gridColumn: `${cell[1]} / ${cell[3]}`,
              }}
            />
          ))}
        </div>
      </div>
      <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/50">{label}</span>
    </div>
  );
}
