import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RefynToolbar from './RefynToolbar';
import RefynVerticalSlider from './RefynVerticalSlider';
import RefynGrainPanel from './RefynGrainPanel';
import RefynLayerPanel from './RefynLayerPanel';
import RefynFilterPanel from './RefynFilterPanel';
import { DEFAULT_TOOL_VALUES, type RefynToolId, type RefynToolValues } from './refyn-types';
import type { RefynFilter } from './refyn-filters';

const HOTC_VALUES: RefynToolValues = {
  frequency: 42,
  lumina: 60,
  sculpt: 24,
  ghostLight: 35,
  grain: { style: 'film', strength: 22, shadowsOnly: false },
  layerTexture: 78,
  layerTone: 38,
  outfit: 50,
  jewellery: 44,
  hair: 38,
};

type EditorMode = 'ri' | 'hotc';

interface Props {
  photoUrl: string;
  onExport: () => void;
  onReset: () => void;
  initialValues?: RefynToolValues;
  onIntelMessage?: (msg: string) => void;
}

const buildFilter = (v: RefynToolValues, overrides?: RefynFilter['cssOverrides']) => {
  const freq = v.frequency / 100;
  const lum = v.lumina / 100;
  const sculpt = v.sculpt / 100;
  const ghost = v.ghostLight / 100;
  const tex = v.layerTexture / 100;
  const tone = v.layerTone / 100;
  const outfitV = v.outfit / 100;
  const jewelV = v.jewellery / 100;
  const hairV = v.hair / 100;

  let brightness = 1 + 0.06 * lum + 0.03 * sculpt + 0.02 * tone + 0.02 * outfitV + 0.015 * jewelV;
  let contrast = 1 + 0.1 * sculpt + 0.05 * tex + 0.04 * freq + 0.06 * outfitV + 0.04 * hairV;
  let saturate = 1 + 0.12 * tone + 0.05 * lum + 0.08 * outfitV + 0.04 * jewelV + 0.03 * hairV;
  const blur = freq > 0 ? freq * 0.3 : 0;
  let sepia = lum * 0.04 + jewelV * 0.02;
  const sharpness = 1 + 0.05 * outfitV + 0.04 * hairV + 0.03 * jewelV;
  const dropShadow = ghost > 0 ? `drop-shadow(0 0 ${ghost * 2}px rgba(255,255,255,${ghost * 0.15}))` : '';
  let hueRotate = 0;

  if (overrides) {
    if (overrides.brightness) brightness *= overrides.brightness;
    if (overrides.contrast) contrast *= overrides.contrast;
    if (overrides.saturate) saturate *= overrides.saturate;
    if (overrides.sepia) sepia += overrides.sepia;
    if (overrides.hueRotate) hueRotate = overrides.hueRotate;
  }

  return `brightness(${brightness}) contrast(${contrast * sharpness}) saturate(${saturate}) blur(${blur}px) sepia(${sepia}) hue-rotate(${hueRotate}deg) ${dropShadow}`.trim();
};

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
  const imgRef = useRef<HTMLDivElement>(null);

  const animateToValues = useCallback((target: RefynToolValues) => {
    const numericKeys: (keyof RefynToolValues)[] = ['frequency', 'lumina', 'sculpt', 'ghostLight', 'layerTexture', 'layerTone', 'outfit', 'jewellery', 'hair'];
    numericKeys.forEach((key, i) => {
      setTimeout(() => {
        setValues(prev => ({ ...prev, [key]: target[key] }));
      }, i * 50);
    });
    setTimeout(() => {
      setValues(prev => ({ ...prev, grain: { ...target.grain } }));
    }, numericKeys.length * 50);
  }, []);

  const handleModeSwitch = useCallback((newMode: EditorMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    if (newMode === 'hotc') {
      animateToValues(HOTC_VALUES);
      onIntelMessage?.('House on the Clouds standard applied.');
    } else {
      animateToValues(riValues);
      onIntelMessage?.('Real Intelligence applied.');
    }
  }, [mode, animateToValues, riValues, onIntelMessage]);

  const handleToolTap = useCallback((id: RefynToolId) => {
    if (id === 'filters') {
      setShowFilters(true);
      setActiveTool(null);
      return;
    }
    setActiveTool((prev) => (prev === id ? null : id));
  }, []);

  const handleFilterApply = useCallback((filter: RefynFilter) => {
    setActiveFilterId(filter.id);
    setCssOverrides(filter.cssOverrides || {});
    const merged = { ...values };
    for (const [k, v] of Object.entries(filter.values)) {
      (merged as any)[k] = v;
    }
    animateToValues(merged);
    onIntelMessage?.(`${filter.name} applied.`);
  }, [values, animateToValues, onIntelMessage]);

  const handleSliderChange = useCallback((key: keyof RefynToolValues, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handlePointerDown = useCallback(() => setIsComparing(true), []);
  const handlePointerUp = useCallback(() => setIsComparing(false), []);

  const grainFilter = values.grain.strength > 0 ? 'url(#refyn-edit-grain)' : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-16 gap-5"
    >
      {/* Photo */}
      <div
        ref={imgRef}
        className="relative w-full max-w-lg rounded-2xl overflow-hidden cursor-pointer select-none"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        <svg className="absolute w-0 h-0">
          <filter id="refyn-edit-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={values.grain.style === 'film' ? 0.6 : values.grain.style === 'texture' ? 0.4 : 0.85}
              numOctaves={values.grain.style === 'texture' ? 2 : 3}
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="overlay" />
          </filter>
        </svg>

        <img
          src={photoUrl}
          alt="Original"
          className="w-full aspect-[4/3] object-cover transition-opacity duration-150"
          style={{ opacity: isComparing ? 1 : 0, position: isComparing ? 'relative' : 'absolute', inset: 0 }}
          draggable={false}
        />

        <img
          src={photoUrl}
          alt="Edited"
          className="w-full aspect-[4/3] object-cover transition-opacity duration-150"
          style={{
            filter: buildFilter(values),
            opacity: isComparing ? 0 : 1,
            position: isComparing ? 'absolute' : 'relative',
            inset: 0,
          }}
          draggable={false}
        />

        {values.grain.strength > 0 && !isComparing && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              filter: grainFilter,
              opacity: values.grain.strength / 100 * 0.25,
              mixBlendMode: 'overlay',
              maskImage: values.grain.shadowsOnly
                ? 'linear-gradient(to bottom, transparent 30%, black 100%)'
                : 'none',
            }}
          />
        )}

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

      <p className="text-[10px] tracking-wider uppercase text-[#6B6B6B]/60" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        Hold to compare
      </p>

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

      {/* 9-tool toolbar */}
      <RefynToolbar activeTool={activeTool} onToolTap={handleToolTap} />

      {/* Vertical slider for single-value tools */}
      <AnimatePresence>
        {activeTool && activeTool in SLIDER_TOOLS && (
          <RefynVerticalSlider
            key={activeTool}
            value={values[SLIDER_TOOLS[activeTool].key] as number}
            onChange={(v) => handleSliderChange(SLIDER_TOOLS[activeTool].key, v)}
            label={SLIDER_TOOLS[activeTool].label}
          />
        )}
      </AnimatePresence>

      {/* Grain panel */}
      <AnimatePresence>
        {activeTool === 'grain' && (
          <RefynGrainPanel
            grain={values.grain}
            onChange={(g) => setValues((prev) => ({ ...prev, grain: g }))}
            onClose={() => setActiveTool(null)}
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
            onClose={() => setActiveTool(null)}
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
          onClick={onExport}
          className="px-8 py-3 rounded-full bg-[#E8C97A] text-[#0A0A0A] text-[11px] tracking-wider uppercase font-medium transition-all duration-300 hover:bg-[#d4b968]"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          Export
        </motion.button>
      </div>

      <style>{`
        .refyn-slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          height: 20px;
        }
        .refyn-slider::-webkit-slider-track {
          height: 2px;
          border-radius: 1px;
          background: #333;
        }
        .refyn-slider::-moz-range-track {
          height: 2px;
          border-radius: 1px;
          background: #333;
        }
        .refyn-slider::-moz-range-progress {
          height: 2px;
          background: #E8C97A;
        }
        .refyn-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #E8C97A;
          box-shadow: 0 0 12px 3px rgba(232,201,122,0.3);
          margin-top: -8px;
          border: none;
        }
        .refyn-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #E8C97A;
          box-shadow: 0 0 12px 3px rgba(232,201,122,0.3);
          border: none;
        }
      `}</style>
    </motion.div>
  );
}
