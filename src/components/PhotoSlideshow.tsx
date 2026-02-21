import { useEffect, useCallback, useState, useRef } from 'react';
import { X, Play, Pause } from 'lucide-react';

interface SlideshowProps {
  photos: { id: string; url: string }[];
  open: boolean;
  onClose: () => void;
  startIndex?: number;
}

export function PhotoSlideshow({ photos, open, onClose, startIndex = 0 }: SlideshowProps) {
  const [index, setIndex] = useState(startIndex);
  const [playing, setPlaying] = useState(true);
  const [fadeKey, setFadeKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setIndex(prev => (prev + 1) % photos.length);
    setFadeKey(k => k + 1);
  }, [photos.length]);

  useEffect(() => {
    if (!open) return;
    setIndex(startIndex);
    setPlaying(true);
    setFadeKey(0);
  }, [open, startIndex]);

  useEffect(() => {
    if (!open || !playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(advance, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [open, playing, advance]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p); }
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || photos.length === 0) return null;
  const photo = photos[index];

  return (
    <div className="fixed inset-0 z-[110] bg-black flex items-center justify-center">
      {/* Fade transition image */}
      <img
        key={fadeKey}
        src={photo.url}
        alt=""
        className="max-h-full max-w-full object-contain select-none animate-fade-in"
        draggable={false}
      />

      {/* Counter */}
      <div className="absolute top-4 left-4 text-white/40 text-[12px] tracking-wider">
        {index + 1} / {photos.length}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-3 pb-6 pt-12 bg-gradient-to-t from-black/60 to-transparent">
        <button onClick={() => setPlaying(p => !p)}
          className="min-w-[44px] min-h-[44px] rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 transition active:scale-95">
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <button onClick={onClose}
          className="min-w-[44px] min-h-[44px] rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 transition active:scale-95">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
