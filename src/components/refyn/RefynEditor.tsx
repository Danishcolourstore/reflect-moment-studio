import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RefynToolbar from './RefynToolbar';
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

  useEffect(() => {
    const engine = engineRef.current;
    engine.loadImage(photoUrl).then(({ width, height }) => {
      setImgAspect(width / height);
      setEngineReady(true);
      historyRef.current.clear();
      historyRef.current.push('Initial', { ...riValues }, {});
      setCanUndo(false);
      setCanRedo(false);
    }).catch(console.error);
    return () => { engine.dispose(); };
  }, [photoUrl]);

  useEffect(() => {
    if (!engineReady || !canvasRef.current) return;
    cancelAnimationFrame(renderRaf.current);
    renderRaf.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const container = canvas.parentElement;
      const displayW = container ? container.clientWidth : 400;
      const displayH = Math.round(displayW / imgAspect);
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      else if (mod && e.key === 'z' && e.shiftKey) { e.preventDefault(); handleRedo(); }
      else if (mod && e.key === 'y') { e.preventDefault(); handleRedo(); }
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
      setTimeout(() => setValues(prev => ({ ...prev, [key]: target[key] })), i * 50);
    });
    setTimeout(() => {
      setValues({ ...target });
      pushHistory(label, { ...target }, cssOverrides);
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
    setCssOverrides(filter.cssOverrides || {});
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

  const handleSliderCommit = useCallback((key: keyof RefynToolValues) => {
    const label = SLIDER_TOOLS[key as string]?.label || String(key);
    pushHistory(label, values, cssOverrides);
  }, [values, cssOverrides, pushHistory]);

  const handlePointerDown = useCallback(() => setIsComparing(true), []);
  const handlePointerUp = useCallback(() => setIsComparing(false), []);

  const activeSliderTool = activeTool && activeTool in SLIDER_TOOLS ? SLIDER_TOOLS[activeTool] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="refyn-editor-root"
    >
      {/* ===== PHOTO VIEWPORT — fills available space ===== */}
      <div className="refyn-viewport">
        <div
          className="relative w-full h-full flex items-center justify-center"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          {/* Original for comparison */}
          <img
            src={photoUrl}
            alt="Original"
            className="refyn-photo-layer"
            style={{
              aspectRatio: `${imgAspect}`,
              opacity: isComparing ? 1 : 0,
              zIndex: isComparing ? 2 : 0,
            }}
            draggable={false}
          />
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="refyn-photo-layer"
            style={{
              opacity: isComparing ? 0 : 1,
              zIndex: isComparing ? 0 : 2,
            }}
          />
          <AnimatePresence>
            {isComparing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm"
              >
                <span className="text-[10px] tracking-widest uppercase text-[#F0EDE8]/70" style={{ fontFamily: '"DM Sans", sans-serif' }}>Original</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ===== BOTTOM DOCK — all controls pinned to bottom ===== */}
      <div className="refyn-dock">

        {/* Horizontal slider — appears when a slider tool is active */}
        <AnimatePresence>
          {activeSliderTool && (
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="px-5 py-3 flex items-center gap-3"
            >
              <span className="text-[9px] tracking-widest uppercase text-[#6B6B6B] min-w-[36px]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                {activeSliderTool.label}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={values[activeSliderTool.key] as number}
                onChange={(e) => handleSliderChange(activeSliderTool.key, Number(e.target.value))}
                onPointerUp={() => handleSliderCommit(activeSliderTool.key)}
                onTouchEnd={() => handleSliderCommit(activeSliderTool.key)}
                className="refyn-slider flex-1"
              />
              <span className="text-[10px] tabular-nums text-[#E8C97A] min-w-[24px] text-right" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                {values[activeSliderTool.key] as number}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grain panel inline */}
        <AnimatePresence>
          {activeTool === 'grain' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="px-4 pb-2"
            >
              <RefynGrainPanel
                grain={values.grain}
                onChange={(g) => setValues(prev => ({ ...prev, grain: g }))}
                onClose={() => { setActiveTool(null); pushHistory('Grain', values, cssOverrides); }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Layer panel inline */}
        <AnimatePresence>
          {activeTool === 'layer' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="px-4 pb-2"
            >
              <RefynLayerPanel
                texture={values.layerTexture}
                tone={values.layerTone}
                onTextureChange={(v) => handleSliderChange('layerTexture', v)}
                onToneChange={(v) => handleSliderChange('layerTone', v)}
                onClose={() => { setActiveTool(null); pushHistory('Depth', values, cssOverrides); }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* RI / HOTC mode pills + undo/redo */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-2 rounded-full transition-all"
              style={{ opacity: canUndo ? 1 : 0.25, color: canUndo ? '#F0EDE8' : '#6B6B6B' }}
              title={canUndo ? `Undo ${historyRef.current.undoLabel}` : 'Nothing to undo'}
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M3 6L6 3M3 6L6 9M3 6H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-2 rounded-full transition-all"
              style={{ opacity: canRedo ? 1 : 0.25, color: canRedo ? '#F0EDE8' : '#6B6B6B' }}
              title={canRedo ? `Redo ${historyRef.current.redoLabel}` : 'Nothing to redo'}
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M9 6L6 3M9 6L6 9M9 6H2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleModeSwitch('ri')}
              className="px-4 py-1.5 rounded-full transition-all duration-300"
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontSize: '12px',
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
              className="flex items-center gap-1 px-4 py-1.5 rounded-full transition-all duration-300"
              style={{
                background: mode === 'hotc' ? 'rgba(232,201,122,0.1)' : 'transparent',
                border: mode === 'hotc' ? '1px solid rgba(232,201,122,0.35)' : '1px solid rgba(240,237,232,0.08)',
                color: mode === 'hotc' ? '#E8C97A' : 'rgba(240,237,232,0.3)',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L2 5V8L4 10H8L10 8V5L6 1Z" stroke="currentColor" strokeWidth="0.8" />
                <path d="M4 10V7H8V10" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
                <circle cx="9" cy="2" r="1.5" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
              </svg>
              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '8px', letterSpacing: '0.15em' }}>HOTC</span>
            </motion.button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="text-[9px] tracking-wider uppercase text-[#6B6B6B] hover:text-[#F0EDE8]/70 transition-colors"
              style={{ fontFamily: '"DM Sans", sans-serif' }}
            >
              Reset
            </button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onExport(values, cssOverrides)}
              className="px-5 py-2 rounded-full bg-[#E8C97A] text-[#0A0A0A] text-[9px] tracking-wider uppercase font-medium"
              style={{ fontFamily: '"DM Sans", sans-serif' }}
            >
              Export
            </motion.button>
          </div>
        </div>

        {/* Tool strip */}
        <div className="border-t border-[rgba(240,237,232,0.06)]">
          <RefynToolbar activeTool={activeTool} onToolTap={handleToolTap} />
        </div>
      </div>

      {/* Filter Panel — full overlay */}
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

      <style>{`
        .refyn-editor-root {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          width: 100%;
          overflow: hidden;
        }
        .refyn-viewport {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
        }
        .refyn-photo-layer {
          position: absolute;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 12px;
          transition: opacity 0.15s ease;
        }
        .refyn-dock {
          flex-shrink: 0;
          background: rgba(10,10,10,0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(240,237,232,0.06);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .refyn-slider {
          -webkit-appearance: none; appearance: none;
          background: transparent; cursor: pointer; height: 28px;
        }
        .refyn-slider::-webkit-slider-track { height: 2px; border-radius: 1px; background: #333; }
        .refyn-slider::-moz-range-track { height: 2px; border-radius: 1px; background: #333; }
        .refyn-slider::-moz-range-progress { height: 2px; background: #E8C97A; }
        .refyn-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%;
          background: #E8C97A; box-shadow: 0 0 12px 3px rgba(232,201,122,0.3);
          margin-top: -10px; border: none;
        }
        .refyn-slider::-moz-range-thumb {
          width: 22px; height: 22px; border-radius: 50%;
          background: #E8C97A; box-shadow: 0 0 12px 3px rgba(232,201,122,0.3); border: none;
        }
      `}</style>
    </motion.div>
  );
}
