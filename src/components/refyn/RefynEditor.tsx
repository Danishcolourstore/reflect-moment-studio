import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RefynToolbar from './RefynToolbar';
import RefynVerticalSlider from './RefynVerticalSlider';
import RefynGrainPanel from './RefynGrainPanel';
import RefynLayerPanel from './RefynLayerPanel';
import RefynFilterPanel from './RefynFilterPanel';
import { DEFAULT_TOOL_VALUES, type RefynToolId, type RefynToolValues } from './refyn-types';
import type { RefynFilter } from './refyn-filters';
import { RetouchEngine } from '@/lib/retouch-engine';
import { RetouchHistory } from '@/lib/retouch-history';

const HOTC_VALUES: RefynToolValues = {
  frequency: 42, lumina: 60, sculpt: 24, ghostLight: 35,
  grain: { style: 'film', strength: 22, shadowsOnly: false },
  layerTexture: 78, layerTone: 38, outfit: 50, jewellery: 44, hair: 38,
};

type EditorMode = 'ri' | 'hotc';

interface Props {
  photoUrl: string;
  onExport: (values: RefynToolValues, cssOverrides?: RefynFilter['cssOverrides']) => void;
  onReset: () => void;
  initialValues?: RefynToolValues;
  onIntelMessage?: (msg: string) => void;
}

const SLIDER_TOOLS: Record<string, { key: keyof RefynToolValues; label: string }> = {
  frequency: { key: 'frequency', label: 'Skin' },
  lumina: { key: 'lumina', label: 'Glow' },
  sculpt: { key: 'sculpt', label: 'Form' },
  ghostLight: { key: 'ghostLight', label: 'Light' },
  outfit: { key: 'outfit', label: 'Outfit' },
  jewellery: { key: 'jewellery', label: 'Jewel' },
  hair: { key: 'hair', label: 'Hair' },
};

export default function RefynEditor({ photoUrl, onExport, onReset, initialValues, onIntelMessage }: Props) {
  const riValues = initialValues ? { ...initialValues } : { ...DEFAULT_TOOL_VALUES };
  const [values, setValues] = useState<RefynToolValues>({ ...riValues });
  const [activeTool, setActiveTool] = useState<RefynToolId | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [cssOverrides, setCssOverrides] = useState<RefynFilter['cssOverrides']>({});
  const [mode, setMode] = useState<EditorMode>('ri');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [imgAspect, setImgAspect] = useState(4 / 3);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RetouchEngine>(new RetouchEngine());
  const historyRef = useRef<RetouchHistory>(new RetouchHistory());
  const renderRaf = useRef<number>(0);

  // Load image into engine
  useEffect(() => {
    const engine = engineRef.current;
    engine.loadImage(photoUrl).then(({ width, height }) => {
      setImgAspect(width / height);
      setEngineReady(true);
      // Push initial state to history
      historyRef.current.clear();
      historyRef.current.push('Initial', { ...riValues }, {});
      setCanUndo(false);
      setCanRedo(false);
    }).catch(console.error);

    return () => { engine.dispose(); };
  }, [photoUrl]);

  // Render preview to canvas whenever values change
  useEffect(() => {
    if (!engineReady || !canvasRef.current) return;
    cancelAnimationFrame(renderRaf.current);
    renderRaf.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = canvas.parentElement;
      const displayW = container ? container.clientWidth : 400;
      const displayH = Math.round(displayW / imgAspect);

      // Canvas pixel resolution — higher than CSS for retina, capped for perf
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const renderW = Math.min(Math.round(displayW * dpr), 1200);
      const renderH = Math.round(renderW / imgAspect);

      if (canvas.width !== renderW || canvas.height !== renderH) {
        canvas.width = renderW;
        canvas.height = renderH;
        canvas.style.width = displayW + 'px';
        canvas.style.height = displayH + 'px';
      }

      engineRef.current.renderPreview(canvas, values, cssOverrides);
    });
  }, [values, cssOverrides, engineReady, imgAspect]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else if (mod && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const pushHistory = useCallback((label: string, newValues: RefynToolValues, newOverrides?: RefynFilter['cssOverrides']) => {
    historyRef.current.push(label, newValues, newOverrides);
    setCanUndo(historyRef.current.canUndo);
    setCanRedo(historyRef.current.canRedo);
  }, []);

  const handleUndo = useCallback(() => {
    const entry = historyRef.current.undo();
    if (entry) {
      setValues(entry.values);
      setCssOverrides(entry.cssOverrides || {});
      setCanUndo(historyRef.current.canUndo);
      setCanRedo(historyRef.current.canRedo);
    }
  }, []);

  const handleRedo = useCallback(() => {
    const entry = historyRef.current.redo();
    if (entry) {
      setValues(entry.values);
      setCssOverrides(entry.cssOverrides || {});
      setCanUndo(historyRef.current.canUndo);
      setCanRedo(historyRef.current.canRedo);
    }
  }, []);

  const animateToValues = useCallback((target: RefynToolValues, label: string) => {
    const numericKeys: (keyof RefynToolValues)[] = ['frequency', 'lumina', 'sculpt', 'ghostLight', 'layerTexture', 'layerTone', 'outfit', 'jewellery', 'hair'];
    numericKeys.forEach((key, i) => {
      setTimeout(() => {
        setValues(prev => ({ ...prev, [key]: target[key] }));
      }, i * 50);
    });
    setTimeout(() => {
      const final = { ...target };
      setValues(final);
      pushHistory(label, final, cssOverrides);
    }, numericKeys.length * 50 + 50);
  }, [cssOverrides, pushHistory]);

  const handleModeSwitch = useCallback((newMode: EditorMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    if (newMode === 'hotc') {
      animateToValues(HOTC_VALUES, 'HOTC Mode');
      onIntelMessage?.('House on the Clouds standard applied.');
    } else {
      animateToValues(riValues, 'RI Mode');
      onIntelMessage?.('Real Intelligence applied.');
    }
  }, [mode, animateToValues, riValues, onIntelMessage]);

  const handleToolTap = useCallback((id: RefynToolId) => {
    if (id === 'filters') {
      setShowFilters(true);
      setActiveTool(null);
      return;
    }
    setActiveTool(prev => prev === id ? null : id);
  }, []);

  const handleFilterApply = useCallback((filter: RefynFilter) => {
    setActiveFilterId(filter.id);
    const newOverrides = filter.cssOverrides || {};
    setCssOverrides(newOverrides);
    const merged = { ...values };
    for (const [k, v] of Object.entries(filter.values)) {
      (merged as any)[k] = v;
    }
    animateToValues(merged, filter.name);
    onIntelMessage?.(`${filter.name} applied.`);
  }, [values, animateToValues, onIntelMessage]);

  const handleSliderChange = useCallback((key: keyof RefynToolValues, val: number) => {
    setValues(prev => ({ ...prev, [key]: val }));
  }, []);

  // Push to history on pointer up (end of slider drag)
  const handleSliderCommit = useCallback((key: keyof RefynToolValues) => {
    const label = SLIDER_TOOLS[key as string]?.label || key;
    pushHistory(label, values, cssOverrides);
  }, [values, cssOverrides, pushHistory]);

  const handlePointerDown = useCallback(() => setIsComparing(true), []);
  const handlePointerUp = useCallback(() => setIsComparing(false), []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-16 gap-5"
    >
      {/* Photo canvas + comparison */}
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden cursor-pointer select-none"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        {/* Original image — shown when comparing */}
        <img
          src={photoUrl}
          alt="Original"
          className="w-full object-cover transition-opacity duration-150"
          style={{
            aspectRatio: `${imgAspect}`,
            opacity: isComparing ? 1 : 0,
            position: isComparing ? 'relative' : 'absolute',
            inset: 0,
          }}
          draggable={false}
        />

        {/* Edited canvas — real pixel rendering */}
        <canvas
          ref={canvasRef}
          className="w-full rounded-2xl transition-opacity duration-150"
          style={{
            opacity: isComparing ? 0 : 1,
            position: isComparing ? 'absolute' : 'relative',
            inset: 0,
          }}
        />

        <AnimatePresence>
          {isComparing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm"
            >
              <span className="text-[10px] tracking-widest uppercase text-[#F0EDE8]/70" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                Original
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Compare hint + undo/redo */}
      <div className="flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleUndo}
          disabled={!canUndo}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-300"
          style={{
            border: '1px solid rgba(240,237,232,0.08)',
            opacity: canUndo ? 1 : 0.25,
            color: canUndo ? '#F0EDE8' : '#6B6B6B',
          }}
          title={canUndo ? `Undo ${historyRef.current.undoLabel}` : 'Nothing to undo'}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 6L6 3M3 6L6 9M3 6H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[8px] tracking-wider uppercase" style={{ fontFamily: '"DM Sans", sans-serif' }}>Undo</span>
        </motion.button>

        <p className="text-[10px] tracking-wider uppercase text-[#6B6B6B]/60" style={{ fontFamily: '"DM Sans", sans-serif' }}>
          Hold to compare
        </p>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleRedo}
          disabled={!canRedo}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-300"
          style={{
            border: '1px solid rgba(240,237,232,0.08)',
            opacity: canRedo ? 1 : 0.25,
            color: canRedo ? '#F0EDE8' : '#6B6B6B',
          }}
          title={canRedo ? `Redo ${historyRef.current.redoLabel}` : 'Nothing to redo'}
        >
          <span className="text-[8px] tracking-wider uppercase" style={{ fontFamily: '"DM Sans", sans-serif' }}>Redo</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M9 6L6 3M9 6L6 9M9 6H2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
      </div>

      {/* RI / HOTC mode pills */}
      <div className="flex items-center justify-center gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleModeSwitch('ri')}
          className="px-5 py-2 rounded-full transition-all duration-300"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: '13px',
            background: mode === 'ri' ? 'rgba(232,201,122,0.1)' : 'transparent',
            border: mode === 'ri' ? '1px solid rgba(232,201,122,0.35)' : '1px solid rgba(240,237,232,0.08)',
            color: mode === 'ri' ? '#E8C97A' : 'rgba(240,237,232,0.3)',
          }}
        >
          RI
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleModeSwitch('hotc')}
          className="flex items-center gap-1.5 px-5 py-2 rounded-full transition-all duration-300"
          style={{
            background: mode === 'hotc' ? 'rgba(232,201,122,0.1)' : 'transparent',
            border: mode === 'hotc' ? '1px solid rgba(232,201,122,0.35)' : '1px solid rgba(240,237,232,0.08)',
            color: mode === 'hotc' ? '#E8C97A' : 'rgba(240,237,232,0.3)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1L2 5V8L4 10H8L10 8V5L6 1Z" stroke="currentColor" strokeWidth="0.8" />
            <path d="M4 10V7H8V10" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
            <circle cx="9" cy="2" r="1.5" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
          </svg>
          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '9px', letterSpacing: '0.15em' }}>HOTC</span>
        </motion.button>
      </div>

      {/* Toolbar */}
      <RefynToolbar activeTool={activeTool} onToolTap={handleToolTap} />

      {/* Vertical slider */}
      <AnimatePresence>
        {activeTool && activeTool in SLIDER_TOOLS && (
          <RefynVerticalSlider
            key={activeTool}
            value={values[SLIDER_TOOLS[activeTool].key] as number}
            onChange={(v) => handleSliderChange(SLIDER_TOOLS[activeTool].key, v)}
            onChangeEnd={() => handleSliderCommit(SLIDER_TOOLS[activeTool].key)}
            label={SLIDER_TOOLS[activeTool].label}
          />
        )}
      </AnimatePresence>

      {/* Grain panel */}
      <AnimatePresence>
        {activeTool === 'grain' && (
          <RefynGrainPanel
            grain={values.grain}
            onChange={(g) => {
              setValues(prev => ({ ...prev, grain: g }));
            }}
            onClose={() => {
              setActiveTool(null);
              pushHistory('Grain', values, cssOverrides);
            }}
          />
        )}
      </AnimatePresence>

      {/* Layer panel */}
      <AnimatePresence>
        {activeTool === 'layer' && (
          <RefynLayerPanel
            texture={values.layerTexture}
            tone={values.layerTone}
            onTextureChange={(v) => handleSliderChange('layerTexture', v)}
            onToneChange={(v) => handleSliderChange('layerTone', v)}
            onClose={() => {
              setActiveTool(null);
              pushHistory('Depth', values, cssOverrides);
            }}
          />
        )}
      </AnimatePresence>

      {/* Bottom actions */}
      <div className="flex items-center gap-4 mt-2">
        <button
          onClick={onReset}
          className="text-[10px] tracking-wider uppercase text-[#6B6B6B] hover:text-[#F0EDE8]/70 transition-colors duration-300"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          Start over
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onExport(values, cssOverrides)}
          className="px-8 py-3 rounded-full bg-[#E8C97A] text-[#0A0A0A] text-[11px] tracking-wider uppercase font-medium transition-all duration-300 hover:bg-[#d4b968]"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          Export
        </motion.button>
      </div>

      <style>{`
        .refyn-slider {
          -webkit-appearance: none; appearance: none;
          background: transparent; cursor: pointer; height: 20px;
        }
        .refyn-slider::-webkit-slider-track { height: 2px; border-radius: 1px; background: #333; }
        .refyn-slider::-moz-range-track { height: 2px; border-radius: 1px; background: #333; }
        .refyn-slider::-moz-range-progress { height: 2px; background: #E8C97A; }
        .refyn-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
          background: #E8C97A; box-shadow: 0 0 12px 3px rgba(232,201,122,0.3);
          margin-top: -8px; border: none;
        }
        .refyn-slider::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: #E8C97A; box-shadow: 0 0 12px 3px rgba(232,201,122,0.3); border: none;
        }
      `}</style>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <RefynFilterPanel
            activeFilterId={activeFilterId}
            onApply={handleFilterApply}
            onClose={() => setShowFilters(false)}
            photoUrl={photoUrl}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
