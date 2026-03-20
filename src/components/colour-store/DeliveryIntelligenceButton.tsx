import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const dm = '"DM Sans", sans-serif';
const cormorant = '"Cormorant Garamond", serif';
const ease = [0.16, 1, 0.3, 1];

const PROCESSING_MESSAGES = [
  'Identifying hero portraits...',
  'Finding ceremony moments...',
  'Grouping family formals...',
  'Detecting candid emotions...',
  'Analysing composition quality...',
  'Building story sequence...',
];

const ALBUM_NAMES = [
  'Hero Portraits',
  'Ceremony',
  'Candid Moments',
  'Family Formals',
  'Details',
  'Story Sequence',
];

interface Props {
  photoCount: number;
  onComplete?: (albums: string[]) => void;
}

export default function DeliveryIntelligenceButton({ photoCount, onComplete }: Props) {
  const [processing, setProcessing] = useState(false);
  const [messageIdx, setMessageIdx] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [heroCount, setHeroCount] = useState(0);

  useEffect(() => {
    if (!processing) return;
    const interval = setInterval(() => {
      setMessageIdx(prev => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [processing]);

  const handleSort = useCallback(() => {
    setProcessing(true);
    setMessageIdx(0);

    // Simulate AI processing
    const duration = Math.max(6000, Math.min(photoCount * 50, 15000));
    setTimeout(() => {
      setProcessing(false);
      const heroes = Math.max(3, Math.floor(photoCount * 0.08));
      setHeroCount(heroes);
      setShowSuccess(true);
      onComplete?.(ALBUM_NAMES);
      setTimeout(() => setShowSuccess(false), 5000);
    }, duration);
  }, [photoCount, onComplete]);

  if (photoCount < 1) return null;

  return (
    <>
      {/* Sort button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSort}
        disabled={processing}
        className="px-5 py-2.5 rounded-full transition-all duration-300 disabled:opacity-40"
        style={{
          fontFamily: dm,
          fontSize: 10,
          color: '#E8C97A',
          background: 'rgba(232,201,122,0.06)',
          border: '1px solid rgba(232,201,122,0.15)',
          letterSpacing: '0.1em',
        }}
      >
        {processing ? 'Sorting...' : 'Sort with RI'}
      </motion.button>

      {/* Processing overlay */}
      <AnimatePresence>
        {processing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
            style={{ background: '#080808' }}
          >
            {/* Film grain */}
            <svg className="pointer-events-none fixed inset-0 w-full h-full opacity-[0.025]">
              <filter id="di-grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <rect width="100%" height="100%" filter="url(#di-grain)" />
            </svg>

            {/* Pulsing hexagon */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
                <path d="M24 4L44 16V32L24 44L4 32V16L24 4Z" stroke="#E8C97A" strokeWidth="1.5" fill="none" />
              </svg>
            </motion.div>

            {/* Main text */}
            <p className="mt-8 text-center px-8" style={{ fontFamily: cormorant, fontSize: 24, fontWeight: 300, color: '#F0EDE8' }}>
              Colour Store Intelligence is reading<br />your {photoCount} photos...
            </p>

            {/* Cycling sub-text */}
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-6 uppercase"
                style={{ fontFamily: dm, fontSize: 11, color: '#3A3A3A', letterSpacing: '0.15em' }}
              >
                {PROCESSING_MESSAGES[messageIdx]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success banner */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ y: -44, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -44, opacity: 0 }}
            transition={{ duration: 0.5, ease }}
            className="fixed top-0 left-0 right-0 z-[100] flex items-center px-4"
            style={{
              height: 44,
              background: 'rgba(232,201,122,0.08)',
              borderBottom: '1px solid rgba(232,201,122,0.12)',
              borderLeft: '2px solid #E8C97A',
            }}
          >
            <p style={{ fontFamily: dm, fontSize: 10, color: '#E8C97A', letterSpacing: '0.05em' }}>
              {photoCount} photos sorted into 6 albums. {heroCount} hero portraits identified.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
