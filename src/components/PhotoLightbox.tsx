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

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 60) {
      if (diff < 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Close */}
      <button onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 backdrop-blur-sm p-2 text-white/80 hover:text-white hover:bg-white/20 transition">
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-10 text-white/50 text-[11px] tracking-wider">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Action buttons */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {toggleFavorite && (
          <button onClick={() => toggleFavorite(photo.id)}
            className="rounded-full bg-white/10 backdrop-blur-sm p-2 text-white/80 hover:bg-white/20 transition active:scale-110">
            <Heart className={`h-4 w-4 ${fav ? 'text-red-400' : ''}`} fill={fav ? 'currentColor' : 'none'} />
          </button>
        )}
        {canDownload && onDownload && (
          <button onClick={() => onDownload(photo)}
            className="rounded-full bg-white/10 backdrop-blur-sm p-2 text-white/80 hover:bg-white/20 transition">
            <Download className="h-4 w-4" />
          </button>
        )}
        {onShare && (
          <button onClick={() => onShare(photo)}
            className="rounded-full bg-white/10 backdrop-blur-sm p-2 text-white/80 hover:bg-white/20 transition">
            <Share2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Prev */}
      {currentIndex > 0 && (
        <button onClick={goPrev}
          className="absolute left-2 sm:left-4 z-10 rounded-full bg-white/10 backdrop-blur-sm p-2 text-white/70 hover:text-white hover:bg-white/20 transition">
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next */}
      {currentIndex < photos.length - 1 && (
        <button onClick={goNext}
          className="absolute right-2 sm:right-4 z-10 rounded-full bg-white/10 backdrop-blur-sm p-2 text-white/70 hover:text-white hover:bg-white/20 transition">
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <img
        src={photo.url}
        alt=""
        className="max-h-[90vh] max-w-[95vw] object-contain select-none"
        draggable={false}
      />
    </div>
  );
}
