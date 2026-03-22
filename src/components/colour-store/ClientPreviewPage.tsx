import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const dm = '"DM Sans", sans-serif';
const cormorant = '"Cormorant Garamond", serif';
const ease = [0.16, 1, 0.3, 1];

interface Props {
  originalUrl: string;
  retouchedUrl: string;
  studioName: string;
  previewId: string;
  onSubmitAdjustment?: (text: string) => void;
}

export default function ClientPreviewPage({ originalUrl, retouchedUrl, studioName, onSubmitAdjustment }: Props) {
  const [sliderPos, setSliderPos] = useState(50);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustText, setAdjustText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateSlider = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateSlider(e.clientX);
  }, [updateSlider]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    updateSlider(e.clientX);
  }, [updateSlider]);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleSubmit = useCallback(() => {
    if (!adjustText.trim()) return;
    onSubmitAdjustment?.(adjustText.trim());
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setAdjustText('');
    setAdjustOpen(false);
  }, [adjustText, onSubmitAdjustment]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8" style={{ background: '#080808' }}>
      {/* Film grain */}
      <svg className="pointer-events-none fixed inset-0 w-full h-full z-50 opacity-[0.025]">
        <filter id="cp-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#cp-grain)" />
      </svg>

      {/* Before/After Slider */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[500px] rounded-2xl overflow-hidden cursor-ew-resize select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Retouched (full) */}
        <img
          src={retouchedUrl}
          alt="Retouched"
          className="w-full block"
          style={{ filter: 'brightness(1.08) contrast(1.12) saturate(1.15)' }}
          draggable={false}
        />

        {/* Original (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <img
            src={originalUrl}
            alt="Original"
            className="w-full block"
            draggable={false}
          />
        </div>

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 w-[1px] z-10"
          style={{ left: `${sliderPos}%`, background: 'rgba(240,237,232,0.4)' }}
        />

        {/* Slider thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 rounded-full"
          style={{
            left: `${sliderPos}%`,
            width: 20,
            height: 20,
            background: '#E8C97A',
            boxShadow: '0 0 16px rgba(232,201,122,0.5)',
          }}
        />

        {/* Labels */}
        <div className="absolute top-3 left-3 z-10">
          <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-1 rounded-full"
            style={{ fontFamily: dm, color: '#F0EDE8', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            Original
          </span>
        </div>
        <div className="absolute top-3 right-3 z-10">
          <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-1 rounded-full"
            style={{ fontFamily: dm, color: '#E8C97A', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            Retouched
          </span>
        </div>
      </div>

      {/* Studio info */}
      <div className="mt-8 text-center">
        <p style={{ fontFamily: cormorant, fontSize: 16, color: '#F0EDE8' }}>
          Retouched by {studioName}
        </p>
        <p className="mt-2" style={{ fontFamily: dm, fontSize: 9, color: 'rgba(240,237,232,0.25)', letterSpacing: '0.25em' }}>
          MIRRORAI RI · REAL INTELLIGENCE
        </p>
      </div>

      {/* Adjustment request */}
      <div className="mt-8 w-full max-w-[500px]">
        <AnimatePresence>
          {!adjustOpen && !submitted && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAdjustOpen(true)}
              className="w-full py-3 rounded-xl text-center transition-all duration-300 hover:border-[rgba(240,237,232,0.2)]"
              style={{
                fontFamily: dm,
                fontSize: 10,
                color: 'rgba(240,237,232,0.5)',
                letterSpacing: '0.15em',
                border: '1px solid rgba(240,237,232,0.1)',
                background: 'transparent',
              }}
            >
              REQUEST AN ADJUSTMENT
            </motion.button>
          )}

          {adjustOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease }}
              className="flex flex-col gap-3"
            >
              <div className="relative">
                <textarea
                  value={adjustText}
                  onChange={(e) => setAdjustText(e.target.value.slice(0, 100))}
                  placeholder="Describe your adjustment..."
                  rows={2}
                  className="w-full rounded-xl p-4 text-[12px] resize-none outline-none"
                  style={{
                    fontFamily: dm,
                    background: '#0C0C0C',
                    border: '1px solid rgba(240,237,232,0.06)',
                    color: '#F0EDE8',
                  }}
                />
                <span className="absolute bottom-2 right-3 text-[9px]"
                  style={{ fontFamily: dm, color: '#3A3A3A' }}>
                  {adjustText.length}/100
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAdjustOpen(false)}
                  className="flex-1 py-3 rounded-xl text-[10px] uppercase tracking-[0.15em]"
                  style={{ fontFamily: dm, color: '#3A3A3A', border: '1px solid rgba(240,237,232,0.06)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!adjustText.trim()}
                  className="flex-1 py-3 rounded-xl text-[10px] uppercase tracking-[0.15em] transition-all duration-300 disabled:opacity-30"
                  style={{
                    fontFamily: dm,
                    color: '#0A0A0A',
                    background: adjustText.trim() ? '#E8C97A' : '#3A3A3A',
                  }}
                >
                  Submit
                </button>
              </div>
            </motion.div>
          )}

          {submitted && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-3"
              style={{ fontFamily: dm, fontSize: 11, color: '#E8C97A', letterSpacing: '0.1em' }}
            >
              ✓ Adjustment request sent
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
