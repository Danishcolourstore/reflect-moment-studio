import { useEffect, useCallback, useRef, useState } from "react";
import { X, Download, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PublicPhotoLightboxProps {
  photos: { id: string; url: string }[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  showDownload?: boolean;
  favorites: Set<string>;
  onToggleFavorite: (photoId: string) => void;
}

const ease = [0.16, 1, 0.3, 1];
const UI_HIDE_MS = 2500;

export function PublicPhotoLightbox({
  photos, currentIndex, onClose, onNavigate, showDownload, favorites, onToggleFavorite,
}: PublicPhotoLightboxProps) {
  const current = photos[currentIndex];
  const total = photos.length;

  const [uiVisible, setUiVisible] = useState(true);
  const [favAnim, setFavAnim] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDeltaX = useRef(0);
  const touchDeltaY = useRef(0);
  const lastTap = useRef(0);

  // Auto-hide UI
  const resetUiTimer = useCallback(() => {
    setUiVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setUiVisible(false), UI_HIDE_MS);
  }, []);

  useEffect(() => {
    resetUiTimer();
    return () => clearTimeout(hideTimer.current);
  }, [currentIndex, resetUiTimer]);

  // Preload adjacent
  useEffect(() => {
    [-1, 1].forEach(d => {
      const idx = currentIndex + d;
      if (idx >= 0 && idx < total) {
        const img = new Image();
        img.src = photos[idx].url;
      }
    });
  }, [currentIndex, photos, total]);

  // Lock scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < total - 1) onNavigate(currentIndex + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onNavigate, currentIndex, total]);

  // Touch handlers — swipe left/right to navigate, swipe down to close
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
      onClose(); // swipe down to close
    } else if (dx > 60 && currentIndex > 0) {
      onNavigate(currentIndex - 1);
    } else if (dx < -60 && currentIndex < total - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  // Double-tap to favorite
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300 && current) {
      onToggleFavorite(current.id);
      setFavAnim(true);
      setTimeout(() => setFavAnim(false), 600);
    } else {
      resetUiTimer();
    }
    lastTap.current = now;
  };

  const isFav = current ? favorites.has(current.id) : false;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ background: "#050505" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease }}
        onClick={handleTap}
      >
        {/* UI overlay — auto-hides */}
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none"
          animate={{ opacity: uiVisible ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pointer-events-auto" style={{ height: 56 }}>
            {/* Counter */}
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.3)",
            }}>
              {currentIndex + 1} / {total}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {current && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(current.id); resetUiTimer(); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 10 }}
                >
                  <Heart style={{
                    width: 18, height: 18,
                    color: isFav ? "hsl(0, 70%, 55%)" : "rgba(255,255,255,0.3)",
                    fill: isFav ? "hsl(0, 70%, 55%)" : "none",
                    transition: "all 0.2s",
                  }} />
                </button>
              )}
              {showDownload && current && (
                <a
                  href={current.url}
                  download
                  onClick={(e) => { e.stopPropagation(); resetUiTimer(); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 10, display: "flex" }}
                >
                  <Download style={{ width: 18, height: 18, color: "rgba(255,255,255,0.3)" }} />
                </a>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 10 }}
              >
                <X style={{ width: 18, height: 18, color: "rgba(255,255,255,0.3)" }} />
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
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.3 }}
              transition={{ duration: 0.4, ease }}
            >
              <Heart style={{ width: 64, height: 64, color: "hsl(0, 70%, 55%)", fill: "hsl(0, 70%, 55%)" }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image */}
        {current && (
          <motion.img
            key={current.id}
            src={current.url}
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
        )}
      </motion.div>
    </AnimatePresence>
  );
}
