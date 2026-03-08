import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

interface Props {
  images: string[];
  onClose: () => void;
  /** width / height ratio of the canvas. Defaults to 1 (square). */
  canvasRatio?: number;
}

type PreviewMode = 'feed' | 'story';

function resolveMode(ratio: number): PreviewMode {
  // 9:16 = 0.5625
  if (ratio <= 0.6) return 'story';
  return 'feed';
}

function getFeedContainerRatio(ratio: number): string {
  if (ratio <= 0.85) return '4 / 5';
  if (ratio >= 1.3) return '1.91 / 1';
  return '1 / 1';
}

// ─── Story Preview ─────────────────────────────────────────
function StoryPreview({ images, onClose }: { images: string[]; onClose: () => void }) {
  const [current, setCurrent] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const total = images.length;
  const touchStartX = useRef(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && current > 0) setCurrent(c => c - 1);
      if (e.key === 'ArrowRight' && current < total - 1) setCurrent(c => c + 1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, total, onClose]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3 && current > 0) setCurrent(c => c - 1);
    else if (x > rect.width * 0.7 && current < total - 1) setCurrent(c => c + 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Phone frame */}
      <div className="relative w-full max-w-[375px] h-full max-h-[812px] bg-black overflow-hidden rounded-none sm:rounded-[40px]">

        {/* Story image — full bleed */}
        <div className="absolute inset-0" onClick={handleTap}>
          <img
            src={images[current]}
            alt={`Story ${current + 1}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* ─── Safe zone overlays ─── */}
        {showSafeZones && (
          <div className="absolute inset-0 pointer-events-none z-30">
            {/* Top safe zone ~250px of 1920 = 13% */}
            <div
              className="absolute top-0 left-0 right-0 bg-red-500/15 border-b border-dashed border-red-400/50"
              style={{ height: '13%' }}
            />
            <div className="absolute left-2 text-[8px] text-red-400/80 font-mono uppercase tracking-widest" style={{ top: '13.5%' }}>
              ↑ top safe zone (250px)
            </div>
            {/* Bottom safe zone ~350px of 1920 = 18.2% */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-red-500/15 border-t border-dashed border-red-400/50"
              style={{ height: '18.2%' }}
            />
            <div className="absolute right-2 text-[8px] text-red-400/80 font-mono uppercase tracking-widest" style={{ bottom: '18.7%' }}>
              ↓ bottom safe zone (350px)
            </div>
            {/* Center crosshair */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
            {/* Text safe area */}
            <div
              className="absolute border border-dotted border-green-400/30"
              style={{ top: '13%', left: '5%', right: '5%', bottom: '18.2%' }}
            />
            <div className="absolute text-[7px] text-green-400/50 font-mono uppercase tracking-widest" style={{ top: '14%', right: '6%' }}>
              content safe
            </div>
          </div>
        )}

        {/* ─── Story progress bar ─── */}
        <div className="absolute top-0 left-0 right-0 z-40 px-2 pt-3">
          <div className="flex gap-0.5">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className="flex-1 h-[2px] rounded-full overflow-hidden bg-white/25">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: i < current ? '100%' : i === current ? '60%' : '0%' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ─── Top UI: avatar, username, time, close ─── */}
        <div className="absolute top-0 left-0 right-0 z-40 pt-5 px-3 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-[2px] flex-shrink-0">
            <div className="h-full w-full rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">CS</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <p className="text-white text-[13px] font-semibold truncate">colour.store</p>
            <span className="text-white/50 text-[11px] flex-shrink-0">2h</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <MoreHorizontal className="h-5 w-5 text-white/80" />
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ─── Bottom UI: message bar + reactions ─── */}
        <div className="absolute bottom-0 left-0 right-0 z-40 px-3 pb-4 pt-8 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-10 rounded-full border border-white/25 bg-white/5 backdrop-blur-sm flex items-center px-4">
              <span className="text-white/40 text-[13px]">Send message</span>
            </div>
            <button onClick={() => setLiked(!liked)} className="transition-transform active:scale-125">
              <Heart className={`h-6 w-6 ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
            <Send className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* ─── Safe zone toggle ─── */}
        <button
          onClick={() => setShowSafeZones(!showSafeZones)}
          className="absolute bottom-16 right-3 z-50 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10 hover:bg-black/70 transition-colors"
          title={showSafeZones ? 'Hide safe zones' : 'Show safe zones'}
        >
          {showSafeZones ? <EyeOff className="h-3.5 w-3.5 text-white/70" /> : <Eye className="h-3.5 w-3.5 text-white/70" />}
        </button>

        {/* ─── Desktop nav hint ─── */}
        {total > 1 && (
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-1 z-40 pointer-events-none">
            {current > 0 && (
              <button onClick={() => setCurrent(c => c - 1)} className="pointer-events-auto h-7 w-7 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hidden sm:flex">
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
            )}
            <div />
            {current < total - 1 && (
              <button onClick={() => setCurrent(c => c + 1)} className="pointer-events-auto h-7 w-7 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hidden sm:flex">
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Feed Preview (original) ───────────────────────────────
function FeedPreview({ images, onClose, canvasRatio }: { images: string[]; onClose: () => void; canvasRatio: number }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const total = images.length;

  const containerRatio = getFeedContainerRatio(canvasRatio);

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
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-black border-b border-white/10">
        <button onClick={onClose} className="text-white/80 hover:text-white p-1"><X className="h-5 w-5" /></button>
        <span className="text-white text-xs font-medium tracking-wider uppercase">Preview</span>
        <div className="w-7" />
      </div>

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

        {/* Carousel */}
        <div className="relative bg-black">
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden"
            style={{ aspectRatio: containerRatio }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ width: `${total * 100}%`, transform: `translateX(-${(current * 100) / total}%)` }}
            >
              {images.map((src, i) => (
                <div key={i} className="h-full flex-shrink-0 flex items-center justify-center bg-black" style={{ width: `${100 / total}%` }}>
                  <img src={src} alt={`Slide ${i + 1}`} className="max-w-full max-h-full object-contain" draggable={false} />
                </div>
              ))}
            </div>

            {current > 0 && (
              <button onClick={() => goTo(current - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/80 flex items-center justify-center shadow-lg hover:bg-white transition-colors hidden sm:flex">
                <ChevronLeft className="h-4 w-4 text-black/70" />
              </button>
            )}
            {current < total - 1 && (
              <button onClick={() => goTo(current + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/80 flex items-center justify-center shadow-lg hover:bg-white transition-colors hidden sm:flex">
                <ChevronRight className="h-4 w-4 text-black/70" />
              </button>
            )}

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
          {total > 1 && (
            <div className="flex items-center gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-200 ${i === current ? 'h-1.5 w-1.5 bg-[#0095F6]' : 'h-1 w-1 bg-white/30'}`}
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
          <p className="text-white text-[13px] font-semibold mb-1">{liked ? '1 like' : '0 likes'}</p>
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

// ─── Main Export ────────────────────────────────────────────
export default function InstagramCarouselPreview({ images, onClose, canvasRatio = 1 }: Props) {
  const mode = resolveMode(canvasRatio);

  if (mode === 'story') {
    return <StoryPreview images={images} onClose={onClose} />;
  }

  return <FeedPreview images={images} onClose={onClose} canvasRatio={canvasRatio} />;
}
