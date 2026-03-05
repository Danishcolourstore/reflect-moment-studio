import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Heart, Download, Share2, Trash2, Camera, MapPin, Calendar } from 'lucide-react';
import { ProgressiveImage } from '@/components/ProgressiveImage';
import { format } from 'date-fns';

/* ── Types ── */
interface Photo {
  id: string;
  url: string;
  is_favorite?: boolean;
  file_name: string | null;
  section?: string | null;
}

interface StoryBookLayoutProps {
  photos: Photo[];
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  photographerName?: string;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  canDownload?: boolean;
  isOwner?: boolean;
  onDelete?: (photo: Photo) => void;
  onShare?: (photo: Photo) => void;
  onDownload?: (photo: Photo) => void;
  onOpenLightbox?: (photoId: string) => void;
  watermarkText?: string | null;
}

/* ── Composition types ── */
type CompositionType =
  | 'fullscreen-hero'
  | 'split-editorial'
  | 'triple-frame'
  | 'film-strip'
  | 'immersive-fullscreen'
  | 'minimal-grid'
  | 'portrait-pair'
  | 'two-asymmetric';

const COMPOSITION_SEQUENCE: CompositionType[] = [
  'split-editorial',
  'triple-frame',
  'film-strip',
  'immersive-fullscreen',
  'minimal-grid',
  'portrait-pair',
  'two-asymmetric',
  'split-editorial',
  'triple-frame',
  'immersive-fullscreen',
];

/* ── Palette constants (luxury warm-black) ── */
const SB = {
  bg: '#0C0B08',
  surface: '#131109',
  card: '#17140D',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  text: '#EDEAE3',
  textSecondary: '#A6A197',
  accent: '#C6A77B',
  overlay: 'rgba(12,11,8,0.6)',
};

/* ── Scroll-reveal hook ── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: '0px 0px -60px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ── RevealSection wrapper ── */
const RevealSection = memo(function RevealSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
});

/* ── Photo overlay with actions ── */
function PhotoOverlay({
  photo, isFav, toggleFavorite, canDownload, isOwner,
  onDelete, onShare, onDownload, watermarkText, onOpenLightbox,
}: {
  photo: Photo; isFav: boolean; toggleFavorite: (id: string) => void;
  canDownload: boolean; isOwner: boolean;
  onDelete?: (p: Photo) => void; onShare?: (p: Photo) => void;
  onDownload?: (p: Photo) => void; watermarkText?: string | null;
  onOpenLightbox?: (id: string) => void;
}) {
  return (
    <>
      {watermarkText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-[5]">
          <span className="text-xl sm:text-3xl rotate-[-20deg] whitespace-nowrap tracking-[0.2em]"
            style={{ fontFamily: "'Playfair Display', serif", color: 'rgba(237,234,227,0.08)' }}>
            {watermarkText}
          </span>
        </div>
      )}

      {/* Hover vignette */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 pointer-events-none" />

      {/* Heart */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.id); }}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
        style={{
          backgroundColor: 'rgba(12,11,8,0.5)',
          backdropFilter: 'blur(8px)',
          ...(isFav ? { opacity: 1 } : {}),
        }}
      >
        <Heart className="h-4 w-4 transition-all duration-200"
          style={isFav ? { color: SB.accent, fill: SB.accent } : { color: SB.text }} />
      </button>

      {/* Bottom actions */}
      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {onShare && (
          <button onClick={(e) => { e.stopPropagation(); onShare(photo); }}
            className="rounded-full p-2.5 transition"
            style={{ backgroundColor: 'rgba(12,11,8,0.5)', backdropFilter: 'blur(8px)', color: SB.textSecondary }}>
            <Share2 className="h-3.5 w-3.5" />
          </button>
        )}
        {canDownload && onDownload && (
          <button onClick={(e) => { e.stopPropagation(); onDownload(photo); }}
            className="rounded-full p-2.5 transition"
            style={{ backgroundColor: 'rgba(12,11,8,0.5)', backdropFilter: 'blur(8px)', color: SB.textSecondary }}>
            <Download className="h-3.5 w-3.5" />
          </button>
        )}
        {isOwner && onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(photo); }}
            className="rounded-full p-2.5 transition"
            style={{ backgroundColor: 'rgba(12,11,8,0.5)', backdropFilter: 'blur(8px)', color: '#E57373' }}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </>
  );
}

/* ── Storybook Image (with hover zoom) ── */
const StoryImage = memo(function StoryImage({
  photo, className = '', style = {}, overlayProps, onClick,
}: {
  photo: Photo;
  className?: string;
  style?: React.CSSProperties;
  overlayProps: any;
  onClick?: () => void;
}) {
  return (
    <div
      className={`group relative overflow-hidden cursor-pointer ${className}`}
      style={{ borderRadius: '2px', ...style }}
      onClick={onClick}
    >
      <div className="h-full w-full overflow-hidden transition-transform duration-700 ease-out group-hover:scale-[1.03]">
        <ProgressiveImage src={photo.url} alt={photo.file_name || ''} className="h-full w-full object-cover" />
      </div>
      <PhotoOverlay photo={photo} isFav={overlayProps.isFavorite(photo.id)} {...overlayProps} />
    </div>
  );
});

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export function StoryBookLayout({
  photos, eventName, eventDate, eventLocation, photographerName,
  isFavorite, toggleFavorite,
  canDownload = false, isOwner = false,
  onDelete, onShare, onDownload, onOpenLightbox, watermarkText,
}: StoryBookLayoutProps) {
  if (photos.length === 0) return null;

  const heroPhoto = photos[0];
  const remainingPhotos = photos.slice(1);

  // Build composition blocks
  const blocks: { type: CompositionType; photos: Photo[]; sectionLabel?: string }[] = [];
  let idx = 0;
  let seqIdx = 0;

  while (idx < remainingPhotos.length) {
    const comp = COMPOSITION_SEQUENCE[seqIdx % COMPOSITION_SEQUENCE.length];
    const sectionLabel = remainingPhotos[idx]?.section || undefined;

    const photosNeeded: Record<CompositionType, number> = {
      'fullscreen-hero': 1, 'split-editorial': 2, 'triple-frame': 3,
      'film-strip': 4, 'immersive-fullscreen': 1, 'minimal-grid': 4,
      'portrait-pair': 2, 'two-asymmetric': 2,
    };

    const needed = photosNeeded[comp];
    const available = remainingPhotos.length - idx;

    if (available >= needed) {
      blocks.push({ type: comp, photos: remainingPhotos.slice(idx, idx + needed), sectionLabel });
      idx += needed;
    } else if (available >= 2) {
      blocks.push({ type: 'portrait-pair', photos: remainingPhotos.slice(idx, idx + 2), sectionLabel });
      idx += 2;
    } else {
      blocks.push({ type: 'immersive-fullscreen', photos: remainingPhotos.slice(idx, idx + 1), sectionLabel });
      idx += 1;
    }
    seqIdx++;
  }

  const overlayProps = {
    isFavorite, toggleFavorite, canDownload, isOwner,
    onDelete, onShare, onDownload, watermarkText, onOpenLightbox,
  };

  const sectionSpacing = 'py-[60px] sm:py-[90px] lg:py-[120px]';

  return (
    <div style={{ backgroundColor: SB.bg, color: SB.text, fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* ═══════════ LAYOUT 01 — FULLSCREEN HERO (Cover) ═══════════ */}
      <div
        className="relative w-full overflow-hidden cursor-pointer group"
        style={{ height: '100vh', minHeight: '600px' }}
        onClick={() => onOpenLightbox?.(heroPhoto.id)}
      >
        <div className="absolute inset-0 transition-transform duration-[8s] ease-out group-hover:scale-[1.04]">
          <ProgressiveImage src={heroPhoto.url} alt={heroPhoto.file_name || ''} className="h-full w-full object-cover" />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0" style={{
          background: `linear-gradient(to top, ${SB.bg} 0%, transparent 40%, transparent 70%, rgba(12,11,8,0.3) 100%)`,
        }} />

        {/* Title overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-20 sm:pb-28 lg:pb-32 px-6 text-center z-10">
          {eventName && (
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-light tracking-[0.02em] leading-[1.1]"
              style={{ fontFamily: "'Playfair Display', serif", color: SB.text }}>
              {eventName}
            </h1>
          )}
          <div className="flex items-center gap-6 mt-6" style={{ color: SB.textSecondary }}>
            {eventDate && (
              <span className="flex items-center gap-2 text-xs sm:text-sm tracking-[0.2em] uppercase">
                <Calendar className="h-3.5 w-3.5" style={{ color: SB.accent }} />
                {format(new Date(eventDate), 'MMMM d, yyyy')}
              </span>
            )}
            {eventLocation && (
              <span className="flex items-center gap-2 text-xs sm:text-sm tracking-[0.2em] uppercase">
                <MapPin className="h-3.5 w-3.5" style={{ color: SB.accent }} />
                {eventLocation}
              </span>
            )}
          </div>
          {photographerName && (
            <p className="mt-4 text-[11px] tracking-[0.3em] uppercase" style={{ color: SB.textSecondary }}>
              <Camera className="inline h-3 w-3 mr-2" style={{ color: SB.accent }} />
              {photographerName}
            </p>
          )}
        </div>

        <PhotoOverlay photo={heroPhoto} isFav={isFavorite(heroPhoto.id)} {...overlayProps} />

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-[1px] h-8" style={{ backgroundColor: SB.accent, opacity: 0.4 }} />
        </div>
      </div>

      {/* ═══════════ STORY BLOCKS ═══════════ */}
      <div className="relative">
        {blocks.map((block, bi) => {
          const showSection = block.sectionLabel && (bi === 0 || blocks[bi - 1]?.sectionLabel !== block.sectionLabel);

          return (
            <div key={bi}>
              {/* Section divider */}
              {showSection && (
                <RevealSection className={sectionSpacing}>
                  <div className="text-center max-w-xl mx-auto px-6">
                    <div className="w-8 h-[1px] mx-auto mb-6" style={{ backgroundColor: SB.accent }} />
                    <p className="text-sm sm:text-base tracking-[0.3em] uppercase" style={{ color: SB.textSecondary }}>
                      {block.sectionLabel}
                    </p>
                  </div>
                </RevealSection>
              )}

              {/* ── SPLIT EDITORIAL (Layout 02) ── */}
              {block.type === 'split-editorial' && (
                <RevealSection className={`${sectionSpacing} max-w-[1400px] mx-auto px-4 sm:px-8`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center">
                    <StoryImage
                      photo={block.photos[0]}
                      className="aspect-[3/4] sm:aspect-[4/5]"
                      overlayProps={overlayProps}
                      onClick={() => onOpenLightbox?.(block.photos[0].id)}
                    />
                    <div className="flex flex-col gap-4 sm:gap-6">
                      <StoryImage
                        photo={block.photos[1]}
                        className="aspect-[4/3]"
                        overlayProps={overlayProps}
                        onClick={() => onOpenLightbox?.(block.photos[1].id)}
                      />
                      {block.photos[1].section && (
                        <p className="text-center text-[11px] tracking-[0.25em] uppercase italic"
                          style={{ fontFamily: "'Playfair Display', serif", color: SB.textSecondary }}>
                          {block.photos[1].section}
                        </p>
                      )}
                    </div>
                  </div>
                </RevealSection>
              )}

              {/* ── TRIPLE FRAME (Layout 03) ── */}
              {block.type === 'triple-frame' && (
                <RevealSection className={`${sectionSpacing} max-w-[1400px] mx-auto px-4 sm:px-8`}>
                  <div className="grid grid-cols-4 grid-rows-2 gap-3 sm:gap-4" style={{ minHeight: '500px' }}>
                    {/* Left tall */}
                    <div className="col-span-2 row-span-2">
                      <StoryImage
                        photo={block.photos[0]}
                        className="h-full w-full"
                        overlayProps={overlayProps}
                        onClick={() => onOpenLightbox?.(block.photos[0].id)}
                      />
                    </div>
                    {/* Top right */}
                    <div className="col-span-2 row-span-1">
                      <StoryImage
                        photo={block.photos[1]}
                        className="h-full w-full aspect-[16/9]"
                        overlayProps={overlayProps}
                        onClick={() => onOpenLightbox?.(block.photos[1].id)}
                      />
                    </div>
                    {/* Bottom right */}
                    <div className="col-span-2 row-span-1">
                      <StoryImage
                        photo={block.photos[2]}
                        className="h-full w-full aspect-[16/9]"
                        overlayProps={overlayProps}
                        onClick={() => onOpenLightbox?.(block.photos[2].id)}
                      />
                    </div>
                  </div>
                </RevealSection>
              )}

              {/* ── FILM STRIP (Layout 04) ── */}
              {block.type === 'film-strip' && (
                <RevealSection className={sectionSpacing}>
                  <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-3 sm:gap-4 px-4 sm:px-8" style={{ minWidth: 'min-content' }}>
                      {block.photos.map((p, pi) => (
                        <StoryImage
                          key={p.id}
                          photo={p}
                          className="flex-shrink-0 w-[280px] sm:w-[360px] lg:w-[420px] aspect-[3/4]"
                          overlayProps={overlayProps}
                          onClick={() => onOpenLightbox?.(p.id)}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Film strip markers */}
                  <div className="flex justify-center gap-2 mt-6">
                    {block.photos.map((_, i) => (
                      <div key={i} className="w-6 h-[2px] rounded-full" style={{ backgroundColor: i === 0 ? SB.accent : SB.border }} />
                    ))}
                  </div>
                </RevealSection>
              )}

              {/* ── IMMERSIVE FULLSCREEN (Layout 05) ── */}
              {block.type === 'immersive-fullscreen' && (
                <RevealSection className={sectionSpacing}>
                  <div
                    className="relative w-full group cursor-pointer overflow-hidden"
                    style={{ height: '85vh', minHeight: '500px' }}
                    onClick={() => onOpenLightbox?.(block.photos[0].id)}
                  >
                    <div className="h-full w-full overflow-hidden transition-transform duration-700 ease-out group-hover:scale-[1.02]">
                      <ProgressiveImage src={block.photos[0].url} alt="" className="h-full w-full object-cover" />
                    </div>
                    {/* Subtle bottom caption */}
                    {block.photos[0].section && (
                      <div className="absolute bottom-0 inset-x-0 py-8 text-center"
                        style={{ background: `linear-gradient(to top, ${SB.bg}, transparent)` }}>
                        <p className="text-[11px] tracking-[0.3em] uppercase italic"
                          style={{ fontFamily: "'Playfair Display', serif", color: SB.textSecondary }}>
                          {block.photos[0].section}
                        </p>
                      </div>
                    )}
                    <PhotoOverlay photo={block.photos[0]} isFav={isFavorite(block.photos[0].id)} {...overlayProps} />
                  </div>
                </RevealSection>
              )}

              {/* ── MINIMAL GRID (Layout 06) ── */}
              {block.type === 'minimal-grid' && (
                <RevealSection className={`${sectionSpacing} max-w-[1200px] mx-auto px-4 sm:px-8`}>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {block.photos.map(p => (
                      <StoryImage
                        key={p.id}
                        photo={p}
                        className="aspect-square"
                        overlayProps={overlayProps}
                        onClick={() => onOpenLightbox?.(p.id)}
                      />
                    ))}
                  </div>
                </RevealSection>
              )}

              {/* ── PORTRAIT PAIR ── */}
              {block.type === 'portrait-pair' && (
                <RevealSection className={`${sectionSpacing} max-w-[1100px] mx-auto px-4 sm:px-8`}>
                  <div className="grid grid-cols-2 gap-3 sm:gap-5">
                    {block.photos.map((p, pi) => (
                      <RevealSection key={p.id} delay={pi * 150}>
                        <StoryImage
                          photo={p}
                          className="aspect-[3/4]"
                          overlayProps={overlayProps}
                          onClick={() => onOpenLightbox?.(p.id)}
                        />
                      </RevealSection>
                    ))}
                  </div>
                </RevealSection>
              )}

              {/* ── TWO ASYMMETRIC ── */}
              {block.type === 'two-asymmetric' && (
                <RevealSection className={`${sectionSpacing} max-w-[1400px] mx-auto px-4 sm:px-8`}>
                  <div className="grid grid-cols-5 gap-3 sm:gap-5">
                    <div className="col-span-3">
                      <StoryImage
                        photo={block.photos[0]}
                        className="aspect-[4/3] h-full"
                        overlayProps={overlayProps}
                        onClick={() => onOpenLightbox?.(block.photos[0].id)}
                      />
                    </div>
                    <div className="col-span-2">
                      <StoryImage
                        photo={block.photos[1]}
                        className="aspect-[3/4] h-full"
                        overlayProps={overlayProps}
                        onClick={() => onOpenLightbox?.(block.photos[1].id)}
                      />
                    </div>
                  </div>
                </RevealSection>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══════════ END MARKER ═══════════ */}
      <RevealSection className="py-20 sm:py-32 text-center">
        <div className="w-12 h-[1px] mx-auto" style={{ backgroundColor: SB.accent, opacity: 0.3 }} />
        <p className="mt-8 text-3xl sm:text-4xl font-light italic"
          style={{ fontFamily: "'Playfair Display', serif", color: SB.textSecondary, opacity: 0.5 }}>
          fin
        </p>
        <p className="mt-4 text-[10px] tracking-[0.3em] uppercase"
          style={{ color: SB.textSecondary, opacity: 0.3 }}>
          {photos.length} moments · curated with care
        </p>
      </RevealSection>
    </div>
  );
}
