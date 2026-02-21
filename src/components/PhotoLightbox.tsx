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
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Top bar: counter + close */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-white/50 text-[12px] tracking-wider font-medium">
          {currentIndex + 1} / {photos.length}
        </span>
        <button onClick={onClose}
          className="min-w-[44px] min-h-[44px] rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Image area */}
      <div className="flex-1 relative flex items-center justify-center min-h-0">
        {/* Prev arrow */}
        {currentIndex > 0 && (
          <button onClick={goPrev}
            className="absolute left-1 sm:left-4 z-10 min-w-[44px] min-h-[44px] rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Next arrow */}
        {currentIndex < photos.length - 1 && (
          <button onClick={goNext}
            className="absolute right-1 sm:right-4 z-10 min-w-[44px] min-h-[44px] rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition">
            <ChevronRight className="h-6 w-6" />
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

      {/* Bottom toolbar — thumb-reachable on mobile */}
      <div className="shrink-0 flex items-center justify-center gap-4 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {toggleFavorite && (
          <button onClick={() => toggleFavorite(photo.id)}
            className="min-w-[44px] min-h-[44px] rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 transition active:scale-110">
            <Heart className={`h-5 w-5 ${fav ? 'text-red-400' : ''}`} fill={fav ? 'currentColor' : 'none'} />
          </button>
        )}
        {canDownload && onDownload && (
          <button onClick={() => onDownload(photo)}
            className="min-w-[44px] min-h-[44px] rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 transition">
            <Download className="h-5 w-5" />
          </button>
        )}
        {onShare && (
          <button onClick={() => onShare(photo)}
            className="min-w-[44px] min-h-[44px] rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 transition">
            <Share2 className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
