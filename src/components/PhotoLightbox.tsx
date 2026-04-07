import { useEffect, useCallback, useState, useRef } from 'react';
import { Heart, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getOptimizedUrl } from '@/lib/image-utils';

interface LightboxPhoto {
  id: string;
  url: string;
  file_name: string | null;
}

interface PhotoLightboxProps {
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
  eventTitle?: string;
}

const ease = [0.16, 1, 0.3, 1];
const UI_HIDE_MS = 2500;

export function PhotoLightbox({
  photos, currentIndex, open, onClose, onIndexChange,
  isFavorite, toggleFavorite, canDownload, onDownload,
}: PhotoLightboxProps) {
  const [uiVisible, setUiVisible] = useState(false);
  const [favAnim, setFavAnim] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDeltaX = useRef(0);
  const touchDeltaY = useRef(0);
  const lastTap = useRef(0);

  const [fullLoaded, setFullLoaded] = useState(false);

  const photo = photos[currentIndex];
  const total = photos.length;
  const fav = photo ? (isFavorite?.(photo.id) ?? false) : false;

  // Auto-hide UI
  const resetUiTimer = useCallback(() => {
    setUiVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setUiVisible(false), UI_HIDE_MS);
  }, []);

  // Hide UI on open (clean entry)
  useEffect(() => {
    if (open) {
      setUiVisible(false);
    }
    return () => clearTimeout(hideTimer.current);
  }, [open]);

  // Reset on navigate
  useEffect(() => {
    setFullLoaded(false);
  }, [currentIndex]);

  // Progressive image loading
  useEffect(() => {
    if (!open || !photo?.url) return;
    const img = new Image();
    img.onload = () => setFullLoaded(true);
    img.src = photo.url;
  }, [open, currentIndex, photo?.url]);

  // Preload adjacent
  useEffect(() => {
    if (!open) return;
    [-1, 1].forEach(d => {
      const idx = currentIndex + d;
      if (idx >= 0 && idx < total) {
        const img = new Image();
        img.src = getOptimizedUrl(photos[idx].url, 'medium');
      }
    });
  }, [currentIndex, photos, total, open]);

  // Lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

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
      if ((e.key === 'd' || e.key === 'D') && canDownload && onDownload && photo) {
        e.preventDefault();
        onDownload(photo);
        toast("Downloaded", { duration: 1500 });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, onIndexChange, currentIndex, total, toggleFavorite, canDownload, onDownload, photo]);

  if (!open || !photo) return null;

  // Touch: swipe left/right navigate, swipe down close
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
    touchDeltaY.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    touchDeltaY.current = e.touches[0].clientY - touchStartY.current;
  };
  const onTouchEnd = () => {
    const dx = touchDeltaX.current;
    const dy = touchDeltaY.current;
    if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
      onClose();
    } else if (dx > 60 && currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    } else if (dx < -60 && currentIndex < total - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  // Double-tap to favorite
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300 && photo && toggleFavorite) {
      toggleFavorite(photo.id);
      setFavAnim(true);
      setTimeout(() => setFavAnim(false), 600);
    } else {
      resetUiTimer();
    }
    lastTap.current = now;
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload && photo) {
      onDownload(photo);
      toast("Downloaded", { duration: 1500 });
    }
    resetUiTimer();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: "#050505" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease }}
        onClick={handleTap}
      >
        {/* UI overlay — hidden by default, auto-hides after interaction */}
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none"
          animate={{ opacity: uiVisible ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Top bar */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-between pointer-events-auto"
            style={{ height: 56, padding: "0 16px" }}
          >
            {/* Counter */}
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.25)",
            }}>
              {currentIndex + 1} / {total}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {toggleFavorite && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.id); resetUiTimer(); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 10 }}
                >
                  <Heart style={{
                    width: 18, height: 18,
                    color: fav ? "hsl(0, 70%, 55%)" : "rgba(255,255,255,0.25)",
                    fill: fav ? "hsl(0, 70%, 55%)" : "none",
                    transition: "all 0.2s",
                  }} />
                </button>
              )}
              {canDownload && onDownload && (
                <button
                  onClick={handleDownloadClick}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 10, display: "flex" }}
                >
                  <Download style={{ width: 18, height: 18, color: "rgba(255,255,255,0.25)" }} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 10 }}
              >
                <X style={{ width: 18, height: 18, color: "rgba(255,255,255,0.25)" }} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Double-tap heart animation */}
        <AnimatePresence>
          {favAnim && (
            <motion.div
              className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.85, scale: 1 }}
              exit={{ opacity: 0, scale: 1.4 }}
              transition={{ duration: 0.5, ease }}
            >
              <Heart style={{ width: 56, height: 56, color: "hsl(0, 70%, 55%)", fill: "hsl(0, 70%, 55%)" }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image */}
        <motion.img
          key={photo.id}
          src={fullLoaded ? photo.url : getOptimizedUrl(photo.url, 'medium')}
          alt=""
          draggable={false}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={(e) => e.stopPropagation()}
          className="select-none"
          style={{
            maxWidth: "96vw",
            maxHeight: "96vh",
            objectFit: "contain",
          }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35, ease }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
