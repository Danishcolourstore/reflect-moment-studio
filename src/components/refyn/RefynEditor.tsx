import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RefynGrainPanel from './RefynGrainPanel';

interface Props {
  photoUrl: string;
  onExport: () => void;
  onReset: () => void;
}

// Simulated AI edit = CSS filter adjustments
const getEditFilter = (intensity: number, grain: GrainState) => {
  const i = intensity / 100;
  const brightness = 1 + 0.08 * i;
  const contrast = 1 + 0.12 * i;
  const saturate = 1 + 0.15 * i;
  const warmth = 0.97 + 0.03 * i; // slight warm shift via sepia
  return `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) sepia(${warmth > 1 ? (warmth - 1) * 0.3 : 0})`;
};

interface GrainState {
  style: 'film' | 'texture' | 'noise';
  strength: number;
  shadowsOnly: boolean;
}

export default function RefynEditor({ photoUrl, onExport, onReset }: Props) {
  const [intensity, setIntensity] = useState(75);
  const [isComparing, setIsComparing] = useState(false);
  const [showGrain, setShowGrain] = useState(false);
  const [activePanel, setActivePanel] = useState<'retouch' | 'grain' | null>(null);
  const [grain, setGrain] = useState<GrainState>({ style: 'film', strength: 30, shadowsOnly: false });
  const imgRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(() => setIsComparing(true), []);
  const handlePointerUp = useCallback(() => setIsComparing(false), []);

  const grainFilter = (() => {
    if (grain.strength === 0) return '';
    const freq = grain.style === 'film' ? 0.6 : grain.style === 'texture' ? 0.4 : 0.85;
    return `url(#refyn-edit-grain)`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-20 gap-6"
    >
      {/* Photo container with before/after */}
      <div
        ref={imgRef}
        className="relative w-full max-w-lg rounded-2xl overflow-hidden cursor-pointer select-none"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        {/* SVG grain filter for editor */}
        <svg className="absolute w-0 h-0">
          <filter id="refyn-edit-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={grain.style === 'film' ? 0.6 : grain.style === 'texture' ? 0.4 : 0.85}
              numOctaves={grain.style === 'texture' ? 2 : 3}
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="overlay" />
          </filter>
        </svg>

        {/* Original photo (shown on press) */}
        <img
          src={photoUrl}
          alt="Original"
          className="w-full aspect-[4/3] object-cover transition-opacity duration-150"
          style={{ opacity: isComparing ? 1 : 0, position: isComparing ? 'relative' : 'absolute', inset: 0 }}
          draggable={false}
        />

        {/* Edited photo */}
        <img
          src={photoUrl}
          alt="Edited"
          className="w-full aspect-[4/3] object-cover transition-opacity duration-150"
          style={{
            filter: getEditFilter(intensity, grain),
            opacity: isComparing ? 0 : 1,
            position: isComparing ? 'absolute' : 'relative',
            inset: 0,
          }}
          draggable={false}
        />

        {/* Grain overlay on edited */}
        {grain.strength > 0 && !isComparing && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              filter: grainFilter,
              opacity: grain.strength / 100 * 0.25,
              mixBlendMode: 'overlay',
              maskImage: grain.shadowsOnly
                ? 'linear-gradient(to bottom, transparent 30%, black 100%)'
                : 'none',
            }}
          />
        )}

        {/* Compare indicator */}
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

      {/* Intensity slider */}
      <div className="w-full max-w-lg px-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] tracking-wider uppercase text-[#6B6B6B]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            Original
          </span>
          <span className="text-[10px] tracking-wider uppercase text-[#E8C97A]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            Refined
          </span>
        </div>

        <div className="relative h-10 flex items-center">
          <input
            type="range"
            min={0}
            max={100}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="refyn-slider w-full"
          />
        </div>
      </div>

      {/* Action pills */}
      <div className="flex items-center gap-3">
        <PillButton
          label="Retouch"
          active={activePanel === 'retouch'}
          onClick={() => setActivePanel(activePanel === 'retouch' ? null : 'retouch')}
        />
        <PillButton
          label="Grain"
          active={activePanel === 'grain'}
          onClick={() => setActivePanel(activePanel === 'grain' ? null : 'grain')}
        />
      </div>

      {/* Grain panel */}
      <AnimatePresence>
        {activePanel === 'grain' && (
          <RefynGrainPanel
            grain={grain}
            onChange={setGrain}
            onClose={() => setActivePanel(null)}
          />
        )}
      </AnimatePresence>

      {/* Retouch placeholder */}
      <AnimatePresence>
        {activePanel === 'retouch' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg p-5 rounded-2xl bg-[#141414] border border-[rgba(240,237,232,0.05)]"
          >
            <p className="text-[11px] tracking-wider uppercase text-[#6B6B6B] text-center mb-3" style={{ fontFamily: '"DM Sans", sans-serif' }}>
              Retouch
            </p>
            <div className="grid grid-cols-3 gap-3">
              {['Skin Smooth', 'Blemish Fix', 'Face Enhance'].map((label) => (
                <button
                  key={label}
                  className="py-3 rounded-xl bg-[#0A0A0A] border border-[rgba(240,237,232,0.06)] text-[10px] tracking-wider uppercase text-[#F0EDE8]/50 hover:text-[#E8C97A] hover:border-[rgba(232,201,122,0.15)] transition-all duration-300"
                  style={{ fontFamily: '"DM Sans", sans-serif' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
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

      {/* Custom slider styles */}
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
          background: linear-gradient(to right, #333 0%, #E8C97A ${intensity}%, #333 ${intensity}%);
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
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #E8C97A;
          box-shadow: 0 0 16px 4px rgba(232,201,122,0.3);
          margin-top: -9px;
          border: none;
          transition: box-shadow 0.3s ease;
        }
        .refyn-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #E8C97A;
          box-shadow: 0 0 16px 4px rgba(232,201,122,0.3);
          border: none;
        }
        .refyn-slider:active::-webkit-slider-thumb {
          box-shadow: 0 0 24px 8px rgba(232,201,122,0.45);
        }
      `}</style>
    </motion.div>
  );
}

function PillButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="px-5 py-2.5 rounded-full text-[10px] tracking-wider uppercase font-medium transition-all duration-300 border"
      style={{
        fontFamily: '"DM Sans", sans-serif',
        backgroundColor: active ? 'rgba(232,201,122,0.12)' : '#141414',
        borderColor: active ? 'rgba(232,201,122,0.25)' : 'rgba(240,237,232,0.06)',
        color: active ? '#E8C97A' : '#F0EDE8',
      }}
    >
      {label}
    </motion.button>
  );
}
