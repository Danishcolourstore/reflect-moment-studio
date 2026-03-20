import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RefynToolbar from './RefynToolbar';
import RefynVerticalSlider from './RefynVerticalSlider';
import RefynGrainPanel from './RefynGrainPanel';
import RefynLayerPanel from './RefynLayerPanel';
import { DEFAULT_TOOL_VALUES, type RefynToolId, type RefynToolValues } from './refyn-types';

interface Props {
  photoUrl: string;
  onExport: () => void;
  onReset: () => void;
  initialValues?: RefynToolValues;
}

const buildFilter = (v: RefynToolValues) => {
  const freq = v.frequency / 100;
  const lum = v.lumina / 100;
  const sculpt = v.sculpt / 100;
  const ghost = v.ghostLight / 100;
  const tex = v.layerTexture / 100;
  const tone = v.layerTone / 100;

  const brightness = 1 + 0.06 * lum + 0.03 * sculpt + 0.02 * tone;
  const contrast = 1 + 0.1 * sculpt + 0.05 * tex + 0.04 * freq;
  const saturate = 1 + 0.12 * tone + 0.05 * lum;
  const blur = freq > 0 ? freq * 0.3 : 0;
  const sepia = lum * 0.04;
  const dropShadow = ghost > 0 ? `drop-shadow(0 0 ${ghost * 2}px rgba(255,255,255,${ghost * 0.15}))` : '';

  return `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) blur(${blur}px) sepia(${sepia}) ${dropShadow}`.trim();
};

const SLIDER_TOOLS: Record<string, { key: keyof RefynToolValues; label: string }> = {
  frequency: { key: 'frequency', label: 'Skin' },
  lumina: { key: 'lumina', label: 'Glow' },
  sculpt: { key: 'sculpt', label: 'Sculpt' },
  ghostLight: { key: 'ghostLight', label: 'Eyes' },
};

export default function RefynEditor({ photoUrl, onExport, onReset, initialValues }: Props) {
  const [values, setValues] = useState<RefynToolValues>(initialValues ? { ...initialValues } : { ...DEFAULT_TOOL_VALUES });
  const [activeTool, setActiveTool] = useState<RefynToolId | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  const handleToolTap = useCallback((id: RefynToolId) => {
    setActiveTool((prev) => (prev === id ? null : id));
  }, []);

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
        {/* SVG grain filter */}
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

        {/* Original (shown on hold) */}
        <img
          src={photoUrl}
          alt="Original"
          className="w-full aspect-[4/3] object-cover transition-opacity duration-150"
          style={{ opacity: isComparing ? 1 : 0, position: isComparing ? 'relative' : 'absolute', inset: 0 }}
          draggable={false}
        />

        {/* Edited */}
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

        {/* Grain overlay */}
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

        {/* Compare badge */}
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

      {/* Hold hint */}
      <p className="text-[10px] tracking-wider uppercase text-[#6B6B6B]/60" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        Hold to compare
      </p>

      {/* 6-tool toolbar */}
      <RefynToolbar activeTool={activeTool} onToolTap={handleToolTap} />

      {/* Vertical slider for tools 1-4 */}
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

      {/* Slider styles (for grain/layer horizontal sliders) */}
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
