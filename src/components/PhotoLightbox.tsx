import { useEffect, useCallback, useState } from 'react';
import { Heart, Download, X, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';

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
}

export function PhotoLightbox({
  photos, currentIndex, open, onClose, onIndexChange,
  isFavorite, toggleFavorite, canDownload, onDownload, onShare,
}: PhotoLightboxProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) onIndexChange(currentIndex + 1);
  }, [currentIndex, photos.length, onIndexChange]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onIndexChange(currentIndex - 1);
  }, [currentIndex, onIndexChange]);

  // Preload next 2 images for instant swiping
  useEffect(() => {
    if (!open) return;
    for (let i = 1; i <= 2; i++) {
      const next = photos[currentIndex + i];
      if (next?.url) {
        const img = new Image();
        img.src = next.url;
      }
    }
  }, [currentIndex, photos, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose, goNext, goPrev]);

  if (!open || photos.length === 0) return null;

  const photo = photos[currentIndex];
  if (!photo) return null;
  const fav = isFavorite?.(photo.id) ?? false;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setTouchDelta(0);
    setSwiping(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    setTouchDelta(e.touches[0].clientX - touchStart);
  };
  const handleTouchEnd = () => {
    if (touchStart === null) return;
    if (Math.abs(touchDelta) > 60) {
      if (touchDelta < 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
    setTouchDelta(0);
    setSwiping(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col"
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0">
        <span className="text-white/40 text-[13px] tracking-[0.1em] font-sans font-light">
          {currentIndex + 1} / {photos.length}
        </span>
        <button onClick={onClose}
          className="min-w-[48px] min-h-[48px] rounded-full bg-white/8 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all duration-200">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Image area */}
      <div className="flex-1 relative flex items-center justify-center min-h-0">
        {currentIndex > 0 && (
          <button onClick={goPrev}
            className="absolute left-2 sm:left-6 z-10 min-w-[48px] min-h-[48px] rounded-full bg-white/8 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all duration-200">
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}

        {currentIndex < photos.length - 1 && (
          <button onClick={goNext}
            className="absolute right-2 sm:right-6 z-10 min-w-[48px] min-h-[48px] rounded-full bg-white/8 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all duration-200">
            <ChevronRight className="h-7 w-7" />
          </button>
        )}

        <img
          src={photo.url}
          alt=""
          className="max-h-full max-w-[95vw] object-contain select-none transition-transform duration-150"
          style={swiping && touchDelta !== 0 ? { transform: `translateX(${touchDelta * 0.4}px)` } : undefined}
          draggable={false}
        />
      </div>

      {/* Bottom toolbar — larger, more refined */}
      <div className="shrink-0 flex items-center justify-center gap-5 px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {toggleFavorite && (
          <button onClick={() => toggleFavorite(photo.id)}
            className="min-w-[52px] min-h-[52px] rounded-full bg-white/8 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-white/15 transition-all duration-200 active:scale-105">
            <Heart className={`h-6 w-6 ${fav ? 'text-red-400' : ''}`} fill={fav ? 'currentColor' : 'none'} />
          </button>
        )}
        {canDownload && onDownload && (
          <button onClick={() => onDownload(photo)}
            className="min-w-[52px] min-h-[52px] rounded-full bg-white/8 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-white/15 transition-all duration-200">
            <Download className="h-6 w-6" />
          </button>
        )}
        {onShare && (
          <button onClick={() => onShare(photo)}
            className="min-w-[52px] min-h-[52px] rounded-full bg-white/8 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-white/15 transition-all duration-200">
            <Share2 className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}
