import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedUrl } from '@/lib/image-utils';
import type { LightboxPhoto } from './CinematicLightbox';

interface AIFindSimilarSheetProps {
  open: boolean;
  onClose: () => void;
  photoCount: number;
  photos: LightboxPhoto[];
}

const SPRING = [0.32, 0, 0.15, 1] as const;

export function AIFindSimilarSheet({ open, onClose, photoCount, photos }: AIFindSimilarSheetProps) {
  const [results, setResults] = useState<LightboxPhoto[]>([]);
  const [scanning, setScanning] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);

  useEffect(() => {
    if (!open) { setResults([]); setScanning(false); return; }
    setScanning(true);
    // Simulate AI scanning — show random photos as "similar"
    const timer = setTimeout(() => {
      const shuffled = [...photos].sort(() => Math.random() - 0.5);
      setResults(shuffled.slice(0, Math.min(8, shuffled.length)));
      setScanning(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, [open, photos]);

  const handleDragDown = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };

  const handleDragEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - dragStartY.current;
    if (dy > 80) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0"
            style={{ zIndex: 109, background: 'rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            className="fixed bottom-0 left-0 right-0"
            style={{
              zIndex: 110,
              background: 'rgba(14,13,12,0.97)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '20px 20px 0 0',
              borderTop: '1px solid rgba(200,169,126,0.12)',
              paddingBottom: 'env(safe-area-inset-bottom, 12px)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.4, ease: SPRING }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleDragDown}
            onTouchEnd={handleDragEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-5">
              <div style={{
                width: 36, height: 3,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 2,
              }} />
            </div>

            <div className="px-5 pb-6">
              <h3 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '1.3rem',
                color: '#fff',
                margin: 0,
              }}>
                Find Similar Moments
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.4)',
                marginTop: 4,
              }}>
                {scanning
                  ? `AI is scanning ${photoCount} photos`
                  : `Found ${results.length} similar moments`
                }
              </p>

              {/* Scanning bar */}
              {scanning && (
                <div className="mt-4 overflow-hidden" style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1 }}>
                  <motion.div
                    style={{ height: '100%', width: '40%', background: '#C8A97E', borderRadius: 1 }}
                    animate={{ x: ['-100%', '300%'] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              )}

              {/* Results */}
              {results.length > 0 && (
                <div
                  className="mt-4 flex gap-1 overflow-x-auto"
                  style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}
                >
                  {results.map((p, i) => (
                    <motion.div
                      key={p.id}
                      className="flex-shrink-0 overflow-hidden"
                      style={{ width: 80, height: 80, borderRadius: 4 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08, duration: 0.3 }}
                    >
                      <img
                        src={getOptimizedUrl(p.url, 'thumbnail')}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
