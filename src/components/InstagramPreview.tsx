import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Grid3X3, LayoutGrid } from 'lucide-react';

interface InstagramPreviewProps {
  photos: string[];
  username?: string;
  caption?: string;
  onClose: () => void;
}

export default function InstagramPreview({
  photos,
  username = 'photographer',
  caption = '',
  onClose,
}: InstagramPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [viewMode, setViewMode] = useState<'post' | 'grid'>('post');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentSlide > 0) goTo(currentSlide - 1);
      if (e.key === 'ArrowRight' && currentSlide < photos.length - 1) goTo(currentSlide + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentSlide, photos.length]);

  const goTo = (idx: number) => {
    setIsTransitioning(true);
    setCurrentSlide(idx);
    setSwipeOffset(0);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDelta.current = 0;
    setIsTransitioning(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientX - touchStartX.current;
    touchDelta.current = delta;
    // Prevent overscroll at edges
    if ((currentSlide === 0 && delta > 0) || (currentSlide === photos.length - 1 && delta < 0)) {
      setSwipeOffset(delta * 0.3);
    } else {
      setSwipeOffset(delta);
    }
  };

  const onTouchEnd = () => {
    const threshold = 60;
    if (touchDelta.current < -threshold && currentSlide < photos.length - 1) {
      goTo(currentSlide + 1);
    } else if (touchDelta.current > threshold && currentSlide > 0) {
      goTo(currentSlide - 1);
    } else {
      setIsTransitioning(true);
      setSwipeOffset(0);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handleDoubleTap = () => {
    setLiked(true);
  };

  if (photos.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[60] h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Mode toggle */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] flex bg-white/10 rounded-full p-0.5">
        <button
          onClick={() => setViewMode('post')}
          className={`px-4 py-1.5 rounded-full text-[11px] font-medium tracking-wide transition-all ${
            viewMode === 'post' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
          }`}
        >
          Post
        </button>
        <button
          onClick={() => setViewMode('grid')}
          className={`px-4 py-1.5 rounded-full text-[11px] font-medium tracking-wide transition-all ${
            viewMode === 'grid' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
          }`}
        >
          Grid
        </button>
      </div>

      {viewMode === 'post' ? (
        /* ─── Post View ─── */
        <div className="w-full max-w-[375px] bg-black rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl mx-4"
          style={{ maxHeight: '90vh' }}
        >
          {/* Phone notch */}
          <div className="flex items-center justify-center pt-2 pb-1">
            <div className="w-32 h-5 bg-black rounded-full border border-white/5" />
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 28px)', scrollbarWidth: 'none' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 p-[2px]">
                <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                  <span className="text-white text-[9px] font-bold">
                    {username[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-semibold truncate">{username}</p>
              </div>
              <MoreHorizontal className="h-5 w-5 text-white/70" />
            </div>

            {/* Carousel */}
            <div
              className="relative w-full overflow-hidden bg-neutral-900"
              style={{ aspectRatio: '4/5' }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onDoubleClick={handleDoubleTap}
            >
              <div
                className="flex h-full"
                style={{
                  transform: `translateX(calc(-${currentSlide * 100}% + ${swipeOffset}px))`,
                  transition: isTransitioning ? 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
                }}
              >
                {photos.map((url, i) => (
                  <div key={i} className="w-full h-full shrink-0">
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>

              {/* Carousel dots */}
              {photos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {photos.map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === currentSlide ? 6 : 5,
                        height: i === currentSlide ? 6 : 5,
                        backgroundColor: i === currentSlide ? '#3b82f6' : 'rgba(255,255,255,0.4)',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Slide counter */}
              {photos.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-0.5">
                  <span className="text-white text-[11px] font-medium">
                    {currentSlide + 1}/{photos.length}
                  </span>
                </div>
              )}

              {/* Desktop nav arrows */}
              {currentSlide > 0 && (
                <button
                  onClick={() => goTo(currentSlide - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 flex items-center justify-center text-black/70 hover:bg-white transition-all hidden md:flex"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {currentSlide < photos.length - 1 && (
                <button
                  onClick={() => goTo(currentSlide + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 flex items-center justify-center text-black/70 hover:bg-white transition-all hidden md:flex"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Action bar */}
            <div className="flex items-center px-3 pt-2.5 pb-1">
              <div className="flex items-center gap-4 flex-1">
                <button onClick={() => setLiked(!liked)} className="transition-transform active:scale-125">
                  <Heart
                    className={`h-6 w-6 transition-colors ${liked ? 'text-red-500 fill-red-500' : 'text-white'}`}
                  />
                </button>
                <MessageCircle className="h-6 w-6 text-white" style={{ transform: 'scaleX(-1)' }} />
                <Send className="h-5 w-5 text-white -rotate-12" />
              </div>
              <button onClick={() => setSaved(!saved)} className="transition-transform active:scale-110">
                <Bookmark
                  className={`h-6 w-6 transition-colors ${saved ? 'text-white fill-white' : 'text-white'}`}
                />
              </button>
            </div>

            {/* Likes */}
            <div className="px-3 pt-1">
              <p className="text-white text-[13px] font-semibold">
                {liked ? '1 like' : '0 likes'}
              </p>
            </div>

            {/* Caption */}
            {caption && (
              <div className="px-3 pt-1 pb-4">
                <p className="text-white/90 text-[13px] leading-snug">
                  <span className="font-semibold mr-1.5">{username}</span>
                  {caption}
                </p>
              </div>
            )}

            {/* Home indicator */}
            <div className="flex justify-center pb-2 pt-1">
              <div className="w-28 h-1 bg-white/30 rounded-full" />
            </div>
          </div>
        </div>
      ) : (
        /* ─── Grid View ─── */
        <div className="w-full max-w-[375px] bg-black rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl mx-4"
          style={{ maxHeight: '90vh' }}
        >
          {/* Phone notch */}
          <div className="flex items-center justify-center pt-2 pb-1">
            <div className="w-32 h-5 bg-black rounded-full border border-white/5" />
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 28px)', scrollbarWidth: 'none' }}>
            {/* Profile header */}
            <div className="px-4 pt-2 pb-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 p-[2px]">
                  <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold">
                      {username[0]?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="text-white text-[14px] font-semibold flex-1">{username}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mb-3">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 p-[2px] shrink-0">
                  <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {username[0]?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-6 flex-1 justify-center">
                  <div className="text-center">
                    <p className="text-white text-[15px] font-bold">{Math.max(photos.length, 12)}</p>
                    <p className="text-white/50 text-[11px]">posts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-[15px] font-bold">2.4k</p>
                    <p className="text-white/50 text-[11px]">followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-[15px] font-bold">186</p>
                    <p className="text-white/50 text-[11px]">following</p>
                  </div>
                </div>
              </div>

              <p className="text-white text-[13px] font-semibold">{username}</p>
              <p className="text-white/60 text-[12px] mt-0.5">Photographer ✦ Visual Stories</p>

              {/* Edit profile button */}
              <div className="flex gap-1.5 mt-3">
                <div className="flex-1 bg-white/10 rounded-lg py-1.5 text-center">
                  <span className="text-white text-[12px] font-semibold">Edit profile</span>
                </div>
                <div className="flex-1 bg-white/10 rounded-lg py-1.5 text-center">
                  <span className="text-white text-[12px] font-semibold">Share profile</span>
                </div>
              </div>
            </div>

            {/* Grid tabs */}
            <div className="flex border-t border-white/10">
              <div className="flex-1 py-2.5 flex justify-center border-b border-white">
                <Grid3X3 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 py-2.5 flex justify-center">
                <LayoutGrid className="h-5 w-5 text-white/40" />
              </div>
            </div>

            {/* Photo grid */}
            <div className="grid grid-cols-3 gap-[1px]">
              {/* First cell: the carousel post (shows first photo with multi-post icon) */}
              <div className="relative aspect-square">
                <img src={photos[0]} alt="" className="h-full w-full object-cover" />
                {photos.length > 1 && (
                  <div className="absolute top-1.5 right-1.5">
                    <svg className="h-4 w-4 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="3" width="15" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                      <rect x="6" y="6" width="15" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                )}
              </div>
              {/* Placeholder posts */}
              {Array.from({ length: 8 }).map((_, i) => {
                const photo = photos[Math.min(i + 1, photos.length - 1)];
                return (
                  <div key={i} className="aspect-square bg-neutral-900">
                    {photo ? (
                      <img src={photo} alt="" className="h-full w-full object-cover opacity-40" />
                    ) : (
                      <div className="h-full w-full bg-neutral-800" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Home indicator */}
            <div className="flex justify-center pb-2 pt-3">
              <div className="w-28 h-1 bg-white/30 rounded-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
