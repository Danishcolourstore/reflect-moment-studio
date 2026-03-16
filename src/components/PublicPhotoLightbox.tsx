import { useEffect, useCallback, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Download, Heart } from "lucide-react";

interface PublicPhotoLightboxProps {
  photos: { id: string; url: string }[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  showDownload?: boolean;
  favorites: Set<string>;
  onToggleFavorite: (photoId: string) => void;
}

export function PublicPhotoLightbox({
  photos, currentIndex, onClose, onNavigate, showDownload, favorites, onToggleFavorite,
}: PublicPhotoLightboxProps) {
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const current = photos[currentIndex];
  const total = photos.length;

  // Preload adjacent images
  useEffect(() => {
    const preload = (idx: number) => {
      if (idx >= 0 && idx < total) {
        const img = new Image();
        img.src = photos[idx].url;
      }
    };
    preload(currentIndex - 1);
    preload(currentIndex + 1);
  }, [currentIndex, photos, total]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const navigate = useCallback((dir: "left" | "right") => {
    const next = dir === "right" ? currentIndex + 1 : currentIndex - 1;
    if (next < 0 || next >= total || animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      onNavigate(next);
      setAnimating(false);
      setDirection(null);
    }, 250);
  }, [currentIndex, total, animating, onNavigate]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") navigate("left");
      if (e.key === "ArrowRight") navigate("right");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, navigate]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (touchDeltaX.current > 60) navigate("left");
    else if (touchDeltaX.current < -60) navigate("right");
  };

  const isFav = current ? favorites.has(current.id) : false;

  const animClass = animating
    ? direction === "right"
      ? "translate-x-[-8%] opacity-0"
      : "translate-x-[8%] opacity-0"
    : "translate-x-0 opacity-100";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.95)" }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white transition-colors duration-200"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Top-right actions */}
      <div className="absolute top-4 right-16 z-10 flex items-center gap-2">
        {current && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(current.id); }}
            className="p-2 text-white/70 hover:text-white transition-colors duration-200"
          >
            <Heart className={`w-5 h-5 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
          </button>
        )}
        {showDownload && current && (
          <a
            href={current.url}
            download
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-white/70 hover:text-white transition-colors duration-200"
          >
            <Download className="w-5 h-5" />
          </a>
        )}
      </div>

      {/* Left arrow */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); navigate("left"); }}
          className="absolute left-2 sm:left-6 z-10 p-3 text-white/50 hover:text-white transition-colors duration-200"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Right arrow */}
      {currentIndex < total - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); navigate("right"); }}
          className="absolute right-2 sm:right-6 z-10 p-3 text-white/50 hover:text-white transition-colors duration-200"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Image */}
      {current && (
        <img
          key={current.id}
          src={current.url}
          alt=""
          onClick={(e) => e.stopPropagation()}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className={`max-w-[90vw] max-h-[90vh] object-contain select-none transition-all duration-250 ease-out ${animClass}`}
          draggable={false}
        />
      )}

      {/* Counter */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm tracking-wide"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {currentIndex + 1} / {total}
      </div>
    </div>
  );
}
