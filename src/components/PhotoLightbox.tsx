import { useEffect, useCallback, useState, useRef } from 'react';
import { Heart, Download, X, ChevronLeft, ChevronRight, Share2, ZoomIn, ZoomOut, RotateCcw, Link2, MessageCircle, Instagram } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

export function PhotoLightbox({
  photos, currentIndex, open, onClose, onIndexChange,
  isFavorite, toggleFavorite, canDownload, onDownload, onShare,
  eventTitle,
}: PhotoLightboxProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [swiping, setSwiping] = useState(false);

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const [showZoomControls, setShowZoomControls] = useState(false);

  // Pinch zoom
  const pinchStartRef = useRef({ dist: 0, zoom: 1 });

  // Double tap
  const lastTapRef = useRef(0);

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) onIndexChange(currentIndex + 1);
  }, [currentIndex, photos.length, onIndexChange]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onIndexChange(currentIndex - 1);
  }, [currentIndex, onIndexChange]);

  // Reset zoom on photo change
  useEffect(() => {
    setZoom(1);
    setTranslate({ x: 0, y: 0 });
  }, [currentIndex]);

  // Preload next 2 images at medium resolution (not full)
  useEffect(() => {
    if (!open) return;
    for (let i = 1; i <= 2; i++) {
      const next = photos[currentIndex + i];
      if (next?.url) {
        const img = new Image();
        img.src = getOptimizedUrl(next.url, 'medium');
      }
    }
  }, [currentIndex, photos, open]);

  // Full-res state: load medium first, then upgrade to full
  const [fullLoaded, setFullLoaded] = useState(false);
  useEffect(() => {
    setFullLoaded(false);
    if (!open || !photo?.url) return;
    const img = new Image();
    img.onload = () => setFullLoaded(true);
    img.src = photo.url;
  }, [open, currentIndex]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      // Desktop keyboard shortcuts
      if ((e.key === 'f' || e.key === 'F') && toggleFavorite && photo) {
        e.preventDefault();
        toggleFavorite(photo.id);
      }
      if ((e.key === 'd' || e.key === 'D') && canDownload && onDownload && photo) {
        e.preventDefault();
        onDownload(photo);
      }
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose, goNext, goPrev, toggleFavorite, canDownload, onDownload, photos, currentIndex]);

  if (!open || photos.length === 0) return null;

  const photo = photos[currentIndex];
  if (!photo) return null;
  const fav = isFavorite?.(photo.id) ?? false;

  // Desktop scroll zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom(prev => {
      const next = Math.max(1, Math.min(4, prev + delta));
      if (next === 1) setTranslate({ x: 0, y: 0 });
      return next;
    });
  };

  // Desktop pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || zoom <= 1) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setTranslate({ x: panStartRef.current.tx + dx, y: panStartRef.current.ty + dy });
  };
  const handleMouseUp = () => setIsPanning(false);

  // Double click zoom toggle
  const handleDoubleClick = () => {
    if (zoom > 1) {
      setZoom(1);
      setTranslate({ x: 0, y: 0 });
    } else {
      setZoom(2.5);
    }
  };

  // Touch handlers (swipe + pinch zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartRef.current = { dist: Math.hypot(dx, dy), zoom };
      return;
    }
    // Double tap detection
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleDoubleClick();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    if (zoom > 1) {
      // Pan mode on mobile
      setIsPanning(true);
      panStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: translate.x, ty: translate.y };
      return;
    }
    setTouchStart(e.touches[0].clientX);
    setTouchDelta(0);
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const ratio = newDist / pinchStartRef.current.dist;
      setZoom(Math.max(1, Math.min(4, pinchStartRef.current.zoom * ratio)));
      return;
    }
    if (isPanning && zoom > 1) {
      const dx = e.touches[0].clientX - panStartRef.current.x;
      const dy = e.touches[0].clientY - panStartRef.current.y;
      setTranslate({ x: panStartRef.current.tx + dx, y: panStartRef.current.ty + dy });
      return;
    }
    if (touchStart === null) return;
    setTouchDelta(e.touches[0].clientX - touchStart);
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    if (zoom > 1) {
      if (zoom === 1) setTranslate({ x: 0, y: 0 });
      setTouchStart(null);
      setTouchDelta(0);
      setSwiping(false);
      return;
    }
    if (touchStart === null) return;
    if (Math.abs(touchDelta) > 60) {
      if (touchDelta < 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
    setTouchDelta(0);
    setSwiping(false);
  };

  const photoUrl = photo.url;
  const shareUrl = `${window.location.origin}${window.location.pathname}?photo=${photo.id}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: eventTitle || 'Photo', text: 'Check out this photo', url: shareUrl });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied');
  };

  const imgTransform = zoom > 1 || (swiping && touchDelta !== 0)
    ? `scale(${zoom}) translate(${translate.x / zoom}px, ${translate.y / zoom}px)${swiping && touchDelta !== 0 && zoom <= 1 ? ` translateX(${touchDelta * 0.4}px)` : ''}`
    : swiping && touchDelta !== 0
      ? `translateX(${touchDelta * 0.4}px)`
      : undefined;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200"
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0 bg-gradient-to-b from-black/40 to-transparent">
        <span className="text-white/50 text-[13px] tracking-[0.12em] font-sans font-light">
          {currentIndex + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-3">
          {/* Desktop keyboard hints */}
          <div className="hidden lg:flex items-center gap-2 text-white/25 text-[10px] font-sans tracking-wider">
            <span className="border border-white/15 rounded px-1.5 py-0.5">←→</span>
            <span className="border border-white/15 rounded px-1.5 py-0.5">F</span>
            <span className="border border-white/15 rounded px-1.5 py-0.5">D</span>
            <span className="border border-white/15 rounded px-1.5 py-0.5">ESC</span>
          </div>
          <button onClick={onClose}
            className="min-w-[48px] min-h-[48px] rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 active:scale-90">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 relative flex items-center justify-center min-h-0"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => setShowZoomControls(true)}
        onMouseLeave={() => { setShowZoomControls(false); handleMouseUp(); }}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
      >
        {currentIndex > 0 && zoom <= 1 && (
          <button onClick={goPrev}
            className="absolute left-3 sm:left-8 z-10 min-w-[52px] min-h-[52px] rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300 active:scale-90 shadow-lg shadow-black/20">
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}

        {currentIndex < photos.length - 1 && zoom <= 1 && (
          <button onClick={goNext}
            className="absolute right-3 sm:right-8 z-10 min-w-[52px] min-h-[52px] rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300 active:scale-90 shadow-lg shadow-black/20">
            <ChevronRight className="h-7 w-7" />
          </button>
        )}

        <img
          src={fullLoaded ? photo.url : getOptimizedUrl(photo.url, 'medium')}
          alt=""
          className="max-h-full max-w-[95vw] object-contain select-none transition-all duration-300 rounded-sm"
          style={imgTransform ? { transform: imgTransform } : undefined}
          draggable={false}
        />

        {/* Zoom controls pill */}
        {(zoom > 1 || showZoomControls) && (
          <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-2 py-1 transition-opacity duration-200 ${zoom > 1 || showZoomControls ? 'opacity-100' : 'opacity-0'}`}>
            <button onClick={() => setZoom(prev => Math.max(1, prev - 0.5))} className="p-1.5 text-white/70 hover:text-white">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-white/60 text-[11px] min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(prev => Math.min(4, prev + 0.5))} className="p-1.5 text-white/70 hover:text-white">
              <ZoomIn className="h-4 w-4" />
            </button>
            {zoom > 1 && (
              <button onClick={() => { setZoom(1); setTranslate({ x: 0, y: 0 }); }} className="p-1.5 text-white/70 hover:text-white">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="shrink-0 flex items-center justify-center gap-4 px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/40 to-transparent">
        {toggleFavorite && (
          <button onClick={() => { toggleFavorite(photo.id); if (navigator.vibrate) navigator.vibrate(10); }}
            className="min-w-[56px] min-h-[56px] rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white/90 hover:bg-white/20 transition-all duration-300 active:scale-95 shadow-lg shadow-black/20">
            <Heart className={`h-6 w-6 transition-all duration-300 ${fav ? 'text-red-400 scale-110' : ''}`} fill={fav ? 'currentColor' : 'none'} />
          </button>
        )}
        {canDownload && onDownload && (
          <button onClick={() => onDownload(photo)}
            className="min-w-[56px] min-h-[56px] rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white/90 hover:bg-white/20 transition-all duration-300 active:scale-95 shadow-lg shadow-black/20">
            <Download className="h-6 w-6" />
          </button>
        )}
        {/* Share button with social options */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="min-w-[56px] min-h-[56px] rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white/90 hover:bg-white/20 transition-all duration-300 active:scale-95 shadow-lg shadow-black/20 md:flex hidden">
              <Share2 className="h-6 w-6" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3 rounded-xl" align="center" side="top">
            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium mb-2">SHARE THIS PHOTO</p>
            <div className="space-y-0.5">
              <button onClick={handleCopyLink} className="w-full flex items-center gap-2.5 px-2 py-2 text-[12px] text-foreground hover:bg-secondary rounded-lg transition-colors">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" /> Copy Photo Link
              </button>
              <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, '_blank')} className="w-full flex items-center gap-2.5 px-2 py-2 text-[12px] text-foreground hover:bg-secondary rounded-lg transition-colors">
                <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" /> Share on WhatsApp
              </button>
              <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')} className="w-full flex items-center gap-2.5 px-2 py-2 text-[12px] text-foreground hover:bg-secondary rounded-lg transition-colors">
                <span className="h-3.5 w-3.5 text-muted-foreground flex items-center justify-center text-[10px] font-bold">F</span> Share on Facebook
              </button>
              <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out this photo from ${eventTitle || 'gallery'}`)}`, '_blank')} className="w-full flex items-center gap-2.5 px-2 py-2 text-[12px] text-foreground hover:bg-secondary rounded-lg transition-colors">
                <span className="h-3.5 w-3.5 text-muted-foreground flex items-center justify-center text-[10px] font-bold">X</span> Share on Twitter
              </button>
              {canDownload && onDownload && (
                <button onClick={() => onDownload(photo)} className="w-full flex items-center gap-2.5 px-2 py-2 text-[12px] text-foreground hover:bg-secondary rounded-lg transition-colors">
                  <Download className="h-3.5 w-3.5 text-muted-foreground" /> Download Photo
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
        {/* Mobile share - native */}
        <button onClick={handleNativeShare}
          className="min-w-[56px] min-h-[56px] rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white/90 hover:bg-white/20 transition-all duration-300 active:scale-95 shadow-lg shadow-black/20 md:hidden">
          <Share2 className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
