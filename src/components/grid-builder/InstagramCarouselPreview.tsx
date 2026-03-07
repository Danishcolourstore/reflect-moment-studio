import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  images: string[];
  onClose: () => void;
}

export default function InstagramCarouselPreview({ images, onClose }: Props) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = images.length;

  const goTo = useCallback((idx: number) => {
    setCurrent(Math.max(0, Math.min(total - 1, idx)));
  }, [total]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    setDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    setDragging(false);
    if (Math.abs(touchDeltaX.current) > 50) {
      if (touchDeltaX.current < 0 && current < total - 1) goTo(current + 1);
      if (touchDeltaX.current > 0 && current > 0) goTo(current - 1);
    }
    touchDeltaX.current = 0;
  };

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goTo(current - 1);
      if (e.key === 'ArrowRight') goTo(current + 1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, goTo, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* IG Top Bar */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-black border-b border-white/10">
        <button onClick={onClose} className="text-white/80 hover:text-white p-1">
          <X className="h-5 w-5" />
        </button>
        <span className="text-white text-xs font-medium tracking-wider uppercase">Preview</span>
        <div className="w-7" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile row */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-black">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-[2px]">
            <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
              <span className="text-[9px] text-white/70 font-bold">CS</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-white text-[13px] font-semibold leading-tight">colour.store</p>
            <p className="text-white/50 text-[11px] leading-tight">Original</p>
          </div>
          <MoreHorizontal className="h-5 w-5 text-white/70" />
        </div>

        {/* Carousel area */}
        <div className="relative bg-black">
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden"
            style={{ aspectRatio: '1 / 1' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{
                width: `${total * 100}%`,
                transform: `translateX(-${(current * 100) / total}%)`,
              }}
            >
              {images.map((src, i) => (
                <div key={i} className="h-full flex-shrink-0" style={{ width: `${100 / total}%` }}>
                  <img
                    src={src}
                    alt={`Slide ${i + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              ))}
            </div>

            {/* Desktop nav arrows */}
            {current > 0 && (
              <button
                onClick={() => goTo(current - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/80 flex items-center justify-center shadow-lg hover:bg-white transition-colors hidden sm:flex"
              >
                <ChevronLeft className="h-4 w-4 text-black/70" />
              </button>
            )}
            {current < total - 1 && (
              <button
                onClick={() => goTo(current + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/80 flex items-center justify-center shadow-lg hover:bg-white transition-colors hidden sm:flex"
              >
                <ChevronRight className="h-4 w-4 text-black/70" />
              </button>
            )}

            {/* Slide counter badge */}
            {total > 1 && (
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-0.5">
                <span className="text-white text-[11px] font-medium">{current + 1}/{total}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-black">
          <div className="flex items-center gap-4">
            <button onClick={() => setLiked(!liked)} className="transition-transform active:scale-125">
              <Heart className={`h-6 w-6 ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
            <MessageCircle className="h-6 w-6 text-white" />
            <Send className="h-6 w-6 text-white" />
          </div>

          {/* Pagination dots */}
          {total > 1 && (
            <div className="flex items-center gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === current
                      ? 'h-1.5 w-1.5 bg-[#0095F6]'
                      : 'h-1 w-1 bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}

          <button onClick={() => setSaved(!saved)} className="transition-transform active:scale-125">
            <Bookmark className={`h-6 w-6 ${saved ? 'fill-white text-white' : 'text-white'}`} />
          </button>
        </div>

        {/* Likes + caption */}
        <div className="px-3 pb-4 bg-black">
          <p className="text-white text-[13px] font-semibold mb-1">
            {liked ? '1 like' : '0 likes'}
          </p>
          <p className="text-white/90 text-[13px]">
            <span className="font-semibold">colour.store</span>{' '}
            <span className="text-white/60">Your caption here…</span>
          </p>
          <p className="text-white/40 text-[11px] mt-1.5 uppercase tracking-wide">Just now</p>
        </div>
      </div>
    </div>
  );
}
