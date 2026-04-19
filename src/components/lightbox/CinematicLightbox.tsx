import { useEffect, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedUrl } from '@/lib/image-utils';
import { LightboxUI } from './LightboxUI';
import { LightboxImage } from './LightboxImage';
import { AIFindSimilarSheet } from './AIFindSimilarSheet';

export interface LightboxPhoto {
  id: string;
  url: string;
  file_name?: string | null;
  chapter?: string;
  captured_at?: string;
}

export interface CinematicLightboxProps {
  photos: LightboxPhoto[];
  currentIndex: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  isFavorite?: (id: string) => boolean;
  toggleFavorite?: (id: string) => void;
  canDownload?: boolean;
  onDownload?: (photo: LightboxPhoto) => void;
  onShare?: (photo: LightboxPhoto) => void;
  /** Origin rect from the tapped grid cell for expand animation */
  originRect?: DOMRect | null;
}

const SPRING = [0.32, 0, 0.15, 1] as const;
const UI_HIDE_MS = 3000;

export function CinematicLightbox({
  photos, currentIndex, open, onClose, onIndexChange,
  isFavorite, toggleFavorite, canDownload, onDownload, onShare,
  originRect,
}: CinematicLightboxProps) {
  const [uiVisible, setUiVisible] = useState(false);
  const [favAnim, setFavAnim] = useState(false);
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastTap = useRef(0);

  // Swipe state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDeltaX = useRef(0);
  const touchDeltaY = useRef(0);
  const touchStartTime = useRef(0);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dismissProgress, setDismissProgress] = useState(0);
  const swipeDir = useRef<'h' | 'v' | null>(null);

  // Zoom state
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const initialPinchDist = useRef(0);
  const initialScale = useRef(1);

  const photo = photos[currentIndex];
  const total = photos.length;
  const fav = photo ? (isFavorite?.(photo.id) ?? false) : false;

  // Auto-hide UI timer
  const resetUiTimer = useCallback(() => {
    setUiVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setUiVisible(false), UI_HIDE_MS);
  }, []);

  // Reset state on open/close
  useEffect(() => {
    if (open) {
      setUiVisible(false);
      setScale(1);
      setPanX(0);
      setPanY(0);
      setAiSheetOpen(false);
    }
    return () => clearTimeout(hideTimer.current);
  }, [open]);

  // Reset zoom on navigate
  useEffect(() => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  }, [currentIndex]);

  // Lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Preload adjacent images
  useEffect(() => {
    if (!open) return;
    [-2, -1, 1, 2].forEach(d => {
      const idx = currentIndex + d;
      if (idx >= 0 && idx < total) {
        const img = new Image();
        img.src = getOptimizedUrl(photos[idx].url, 'medium');
      }
    });
  }, [currentIndex, photos, total, open]);

  // Keyboard
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentIndex < total - 1) onIndexChange(currentIndex + 1);
      if (e.key === 'ArrowLeft' && currentIndex > 0) onIndexChange(currentIndex - 1);
      if ((e.key === 'f' || e.key === 'F') && toggleFavorite && photo) {
        e.preventDefault();
        toggleFavorite(photo.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, onIndexChange, currentIndex, total, toggleFavorite, photo]);

  if (!open || !photo) return null;

  // --- Touch handling ---
  const getTouchDist = (e: React.TouchEvent) => {
    if (e.touches.length < 2) return 0;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      initialPinchDist.current = getTouchDist(e);
      initialScale.current = scale;
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    touchDeltaX.current = 0;
    touchDeltaY.current = 0;
    swipeDir.current = null;
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    // Pinch zoom
    if (e.touches.length === 2) {
      const dist = getTouchDist(e);
      if (initialPinchDist.current > 0) {
        const newScale = Math.min(4, Math.max(1, initialScale.current * (dist / initialPinchDist.current)));
        setScale(newScale);
      }
      return;
    }

    // If zoomed in, pan instead of swipe
    if (scale > 1.05) {
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - touchStartY.current;
      setPanX(prev => prev + dx * 0.8);
      setPanY(prev => prev + dy * 0.8);
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      return;
    }

    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    touchDeltaX.current = dx;
    touchDeltaY.current = dy;

    // Determine swipe direction
    if (!swipeDir.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      swipeDir.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }

    if (swipeDir.current === 'h') {
      setDragX(dx);
      setDragY(0);
      setDismissProgress(0);
    } else if (swipeDir.current === 'v' && dy > 0) {
      setDragY(dy);
      setDragX(0);
      setDismissProgress(Math.min(1, dy / 200));
    }
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    const dx = touchDeltaX.current;
    const dy = touchDeltaY.current;
    const elapsed = Date.now() - touchStartTime.current;
    const velocityX = Math.abs(dx) / Math.max(1, elapsed);

    // Pinch end
    if (scale < 1.05) {
      setScale(1);
      setPanX(0);
      setPanY(0);
    }

    // Vertical dismiss
    if (swipeDir.current === 'v' && dy > 120) {
      onClose();
      setDragX(0);
      setDragY(0);
      setDismissProgress(0);
      return;
    }

    // Horizontal swipe
    if (swipeDir.current === 'h') {
      if ((dx > 80 || velocityX > 0.5) && dx > 0 && currentIndex > 0) {
        onIndexChange(currentIndex - 1);
      } else if ((dx < -80 || velocityX > 0.5) && dx < 0 && currentIndex < total - 1) {
        onIndexChange(currentIndex + 1);
      }
    }

    setDragX(0);
    setDragY(0);
    setDismissProgress(0);
  };

  // Double-tap: favorite or zoom
  const handleTap = () => {
    if (aiSheetOpen) return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double-tap
      if (scale > 1.05) {
        // Reset zoom
        setScale(1);
        setPanX(0);
        setPanY(0);
      } else if (toggleFavorite && photo) {
        toggleFavorite(photo.id);
        setFavAnim(true);
        setTimeout(() => setFavAnim(false), 650);
      }
      lastTap.current = 0;
    } else {
      // Single tap — toggle UI
      if (uiVisible) {
        setUiVisible(false);
        clearTimeout(hideTimer.current);
      } else {
        resetUiTimer();
      }
      lastTap.current = now;
    }
  };

  // Compute entry animation from origin rect
  const getEntryAnimation = () => {
    if (originRect) {
      const cx = originRect.left + originRect.width / 2 - window.innerWidth / 2;
      const cy = originRect.top + originRect.height / 2 - window.innerHeight / 2;
      const scaleX = originRect.width / window.innerWidth;
      return {
        initial: { opacity: 0.5, scale: scaleX, x: cx, y: cy },
        animate: { opacity: 1, scale: 1, x: 0, y: 0 },
        exit: { opacity: 0, scale: 0.92 },
        transition: { duration: 0.38, ease: SPRING },
      };
    }
    return {
      initial: { opacity: 0, scale: 0.92 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.92 },
      transition: { duration: 0.3, ease: SPRING },
    };
  };

  const containerOpacity = 1 - dismissProgress * 0.5;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 100,
            background: `rgba(10,10,11,${containerOpacity})`,
            touchAction: 'none',
            overscrollBehavior: 'none',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleTap}
        >
          {/* Favourite heart burst */}
          <AnimatePresence>
            {favAnim && (
              <motion.div
                className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 0.5, ease: SPRING }}
              >
                <FavBurst />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image */}
          <LightboxImage
            photo={photo}
            dragX={dragX}
            dragY={dragY}
            scale={scale}
            panX={panX}
            panY={panY}
            isDragging={isDragging}
            entryAnimation={getEntryAnimation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />

          {/* UI Chrome */}
          <LightboxUI
            visible={uiVisible}
            currentIndex={currentIndex}
            total={total}
            photo={photo}
            isFav={fav}
            onClose={onClose}
            onToggleFav={() => { if (toggleFavorite && photo) { toggleFavorite(photo.id); resetUiTimer(); } }}
            onDownload={() => { if (onDownload && photo) { onDownload(photo); resetUiTimer(); } }}
            onShare={() => { if (onShare && photo) onShare(photo); }}
            onAIFind={() => { setAiSheetOpen(true); setUiVisible(false); }}
            canDownload={canDownload}
          />

          {/* AI Find Similar Sheet */}
          <AIFindSimilarSheet
            open={aiSheetOpen}
            onClose={() => setAiSheetOpen(false)}
            photoCount={total}
            photos={photos}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Heart burst particles */
function FavBurst() {
  return (
    <div className="relative">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="#B8953F" stroke="none">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * 360;
        const rad = (angle * Math.PI) / 180;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4, height: 4, background: '#B8953F',
              top: '50%', left: '50%',
              marginTop: -2, marginLeft: -2,
            }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{
              x: Math.cos(rad) * 32,
              y: Math.sin(rad) * 32,
              opacity: 0,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}
