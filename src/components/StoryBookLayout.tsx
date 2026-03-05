import { Heart, Download, Share2, Trash2 } from 'lucide-react';
import { ProgressiveImage } from '@/components/ProgressiveImage';
import { format } from 'date-fns';

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

/* ── Composition patterns that cycle through the gallery ── */
type CompositionType = 'full' | 'two-landscape' | 'three-collage' | 'portrait-pair' | 'two-asymmetric';

const COMPOSITION_SEQUENCE: CompositionType[] = [
  'full',
  'two-landscape',
  'three-collage',
  'portrait-pair',
  'two-asymmetric',
  'full',
  'three-collage',
  'two-landscape',
  'portrait-pair',
];

function PhotoOverlay({
  photo,
  isFav,
  toggleFavorite,
  canDownload,
  isOwner,
  onDelete,
  onShare,
  onDownload,
  watermarkText,
  onOpenLightbox,
}: {
  photo: Photo;
  isFav: boolean;
  toggleFavorite: (id: string) => void;
  canDownload: boolean;
  isOwner: boolean;
  onDelete?: (p: Photo) => void;
  onShare?: (p: Photo) => void;
  onDownload?: (p: Photo) => void;
  watermarkText?: string | null;
  onOpenLightbox?: (id: string) => void;
}) {
  return (
    <>
      {watermarkText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-[5]">
          <span className="font-serif text-white/15 text-xl sm:text-3xl rotate-[-20deg] whitespace-nowrap tracking-[0.2em]">
            {watermarkText}
          </span>
        </div>
      )}

      {/* Subtle hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-500 pointer-events-none" />

      {/* Heart */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.id); }}
        className="absolute top-3 right-3 z-10 min-w-[40px] min-h-[40px] rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
        style={isFav ? { opacity: 1 } : undefined}
      >
        <Heart
          className="h-4 w-4 transition-all duration-200"
          style={isFav ? { color: 'hsl(var(--primary))', fill: 'hsl(var(--primary))' } : { color: 'white' }}
        />
      </button>

      {/* Bottom actions */}
      <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {onShare && (
          <button onClick={(e) => { e.stopPropagation(); onShare(photo); }}
            className="rounded-full bg-black/30 backdrop-blur-sm p-2 text-white/80 hover:bg-black/50 transition">
            <Share2 className="h-3.5 w-3.5" />
          </button>
        )}
        {canDownload && onDownload && (
          <button onClick={(e) => { e.stopPropagation(); onDownload(photo); }}
            className="rounded-full bg-black/30 backdrop-blur-sm p-2 text-white/80 hover:bg-black/50 transition">
            <Download className="h-3.5 w-3.5" />
          </button>
        )}
        {isOwner && onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(photo); }}
            className="rounded-full bg-black/30 backdrop-blur-sm p-2 text-destructive hover:bg-black/50 transition">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </>
  );
}

/**
 * Story Book (Editorial) Layout
 * Presents photos as a cinematic visual narrative with varied compositions:
 * - Full-width hero sections
 * - Two-photo landscape rows
 * - Three-photo collage grids
 * - Vertical portrait pairs
 * - Asymmetric two-photo layouts
 */
export function StoryBookLayout({
  photos,
  eventName,
  eventDate,
  isFavorite,
  toggleFavorite,
  canDownload = false,
  isOwner = false,
  onDelete,
  onShare,
  onDownload,
  onOpenLightbox,
  watermarkText,
}: StoryBookLayoutProps) {
  if (photos.length === 0) return null;

  const heroPhoto = photos[0];
  const remainingPhotos = photos.slice(1);

  // Build composition blocks from remaining photos
  const blocks: { type: CompositionType; photos: Photo[]; sectionLabel?: string }[] = [];
  let idx = 0;
  let seqIdx = 0;

  while (idx < remainingPhotos.length) {
    const comp = COMPOSITION_SEQUENCE[seqIdx % COMPOSITION_SEQUENCE.length];
    const sectionLabel = remainingPhotos[idx]?.section || undefined;

    switch (comp) {
      case 'full':
        blocks.push({ type: 'full', photos: remainingPhotos.slice(idx, idx + 1), sectionLabel });
        idx += 1;
        break;
      case 'two-landscape':
        if (idx + 1 < remainingPhotos.length) {
          blocks.push({ type: 'two-landscape', photos: remainingPhotos.slice(idx, idx + 2), sectionLabel });
          idx += 2;
        } else {
          blocks.push({ type: 'full', photos: remainingPhotos.slice(idx, idx + 1), sectionLabel });
          idx += 1;
        }
        break;
      case 'three-collage':
        if (idx + 2 < remainingPhotos.length) {
          blocks.push({ type: 'three-collage', photos: remainingPhotos.slice(idx, idx + 3), sectionLabel });
          idx += 3;
        } else if (idx + 1 < remainingPhotos.length) {
          blocks.push({ type: 'two-landscape', photos: remainingPhotos.slice(idx, idx + 2), sectionLabel });
          idx += 2;
        } else {
          blocks.push({ type: 'full', photos: remainingPhotos.slice(idx, idx + 1), sectionLabel });
          idx += 1;
        }
        break;
      case 'portrait-pair':
        if (idx + 1 < remainingPhotos.length) {
          blocks.push({ type: 'portrait-pair', photos: remainingPhotos.slice(idx, idx + 2), sectionLabel });
          idx += 2;
        } else {
          blocks.push({ type: 'full', photos: remainingPhotos.slice(idx, idx + 1), sectionLabel });
          idx += 1;
        }
        break;
      case 'two-asymmetric':
        if (idx + 1 < remainingPhotos.length) {
          blocks.push({ type: 'two-asymmetric', photos: remainingPhotos.slice(idx, idx + 2), sectionLabel });
          idx += 2;
        } else {
          blocks.push({ type: 'full', photos: remainingPhotos.slice(idx, idx + 1), sectionLabel });
          idx += 1;
        }
        break;
    }
    seqIdx++;
  }

  const overlayProps = { toggleFavorite, canDownload, isOwner, onDelete, onShare, onDownload, watermarkText, onOpenLightbox };

  const renderPhoto = (photo: Photo, className: string) => (
    <div
      key={photo.id}
      className={`group relative overflow-hidden cursor-pointer ${className}`}
      onClick={() => onOpenLightbox?.(photo.id)}
    >
      <ProgressiveImage src={photo.url} alt={photo.file_name || ''} className="h-full w-full object-cover" />
      <PhotoOverlay photo={photo} isFav={isFavorite(photo.id)} {...overlayProps} />
    </div>
  );

  return (
    <div className="w-full">
      {/* ═══ HERO COVER ═══ */}
      <div
        className="group relative w-full h-[70vh] sm:h-[85vh] overflow-hidden cursor-pointer"
        onClick={() => onOpenLightbox?.(heroPhoto.id)}
      >
        <ProgressiveImage
          src={heroPhoto.url}
          alt={heroPhoto.file_name || ''}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Title overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 sm:pb-24 px-6 text-center z-10">
          {eventName && (
            <h1
              className="text-white text-4xl sm:text-6xl lg:text-7xl font-light tracking-wide leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {eventName}
            </h1>
          )}
          {eventDate && (
            <p className="text-white/50 text-sm sm:text-base mt-4 tracking-[0.2em] uppercase"
              style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {format(new Date(eventDate), 'MMMM d, yyyy')}
            </p>
          )}
        </div>

        <PhotoOverlay photo={heroPhoto} isFav={isFavorite(heroPhoto.id)} {...overlayProps} />
      </div>

      {/* ═══ STORY BLOCKS ═══ */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {blocks.map((block, bi) => {
          // Section divider
          const showSection = block.sectionLabel && (bi === 0 || blocks[bi - 1]?.sectionLabel !== block.sectionLabel);

          return (
            <div key={bi}>
              {showSection && (
                <div className="py-12 sm:py-16 text-center">
                  <p
                    className="text-sm sm:text-base tracking-[0.3em] uppercase text-muted-foreground/50"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {block.sectionLabel}
                  </p>
                  <div className="w-10 h-px bg-primary/30 mx-auto mt-4" />
                </div>
              )}

              <div className={`${showSection ? '' : 'mt-3 sm:mt-4'}`}>
                {block.type === 'full' && (
                  <div className="py-2 sm:py-3">
                    {renderPhoto(block.photos[0], 'w-full aspect-[16/9] sm:aspect-[21/9]')}
                  </div>
                )}

                {block.type === 'two-landscape' && (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 py-2 sm:py-3">
                    {block.photos.map(p => renderPhoto(p, 'aspect-[4/3]'))}
                  </div>
                )}

                {block.type === 'three-collage' && (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 py-2 sm:py-3">
                    <div className="col-span-2 row-span-2">
                      {renderPhoto(block.photos[0], 'aspect-[4/5] h-full')}
                    </div>
                    {renderPhoto(block.photos[1], 'aspect-square')}
                    {renderPhoto(block.photos[2], 'aspect-square')}
                  </div>
                )}

                {block.type === 'portrait-pair' && (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 py-2 sm:py-3">
                    {block.photos.map(p => renderPhoto(p, 'aspect-[3/4]'))}
                  </div>
                )}

                {block.type === 'two-asymmetric' && (
                  <div className="grid grid-cols-5 gap-2 sm:gap-3 py-2 sm:py-3">
                    <div className="col-span-3">
                      {renderPhoto(block.photos[0], 'aspect-[4/3] h-full')}
                    </div>
                    <div className="col-span-2">
                      {renderPhoto(block.photos[1], 'aspect-[3/4] h-full')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* End marker */}
      <div className="py-16 sm:py-24 text-center">
        <div className="w-12 h-px bg-primary/20 mx-auto" />
        <p
          className="mt-6 text-[11px] text-muted-foreground/30 tracking-[0.3em] uppercase"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {photos.length} moments captured
        </p>
      </div>
    </div>
  );
}
