import { Heart, Download, Trash2, Share2 } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  is_favorite: boolean;
  file_name: string | null;
}

interface EditorialCollageGridProps {
  photos: Photo[];
  eventName?: string;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  canDownload?: boolean;
  isOwner?: boolean;
  onDelete?: (photo: Photo) => void;
  onShare?: (photo: Photo) => void;
  onDownload?: (photo: Photo) => void;
  watermarkText?: string | null;
}

const COLLAGE_PATTERN: { ratio: string; span: string }[] = [
  { ratio: 'aspect-[3/2]', span: 'col-span-2 row-span-1' },
  { ratio: 'aspect-[4/5]', span: 'col-span-1 row-span-1' },
  { ratio: 'aspect-square', span: 'col-span-1 row-span-1' },
  { ratio: 'aspect-[3/2]', span: 'col-span-1 row-span-1' },
  { ratio: 'aspect-[4/5]', span: 'col-span-1 row-span-1' },
  { ratio: 'aspect-[3/2]', span: 'col-span-2 row-span-1' },
  { ratio: 'aspect-square', span: 'col-span-1 row-span-1' },
  { ratio: 'aspect-[4/5]', span: 'col-span-1 row-span-1' },
  { ratio: 'aspect-[3/2]', span: 'col-span-1 row-span-1' },
  { ratio: 'aspect-square', span: 'col-span-1 row-span-1' },
];

const HERO_COLLAGE_COUNT = 9;

export function EditorialCollageGrid({
  photos,
  eventName,
  isFavorite,
  toggleFavorite,
  canDownload = false,
  isOwner = false,
  onDelete,
  onShare,
  onDownload,
  watermarkText,
}: EditorialCollageGridProps) {
  if (photos.length === 0) return null;

  const heroPhoto = photos[0];
  const collagePhotos = photos.slice(1, 1 + HERO_COLLAGE_COUNT);
  const remainingPhotos = photos.slice(1 + HERO_COLLAGE_COUNT);

  const renderOverlay = (photo: Photo) => {
    const fav = isFavorite(photo.id);
    return (
      <>
        {watermarkText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-[5]">
            <span className="font-serif text-foreground/10 text-lg sm:text-2xl rotate-[-25deg] whitespace-nowrap tracking-[0.15em]">
              {watermarkText}
            </span>
          </div>
        )}
        {/* Always-visible heart */}
        <button
          onClick={() => toggleFavorite(photo.id)}
          className="absolute top-2 right-2 z-10 rounded-full bg-card/60 backdrop-blur-sm p-1.5 transition-all duration-200 hover:bg-card/80 active:scale-125"
        >
          <Heart
            className={`h-3.5 w-3.5 transition-all duration-200 ${fav ? 'text-primary scale-110' : 'text-foreground/50 hover:text-foreground/70'}`}
            fill={fav ? 'hsl(var(--primary))' : 'none'}
          />
        </button>
        <div className="absolute inset-0 transition-opacity duration-300 group-hover:bg-foreground/8 pointer-events-none" />
        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {onShare && (
            <button
              onClick={() => onShare(photo)}
              className="rounded-full bg-card/70 text-foreground/80 hover:bg-card/90 backdrop-blur-sm p-1.5 transition"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          )}
          {canDownload && (
            <button
              onClick={() => onDownload ? onDownload(photo) : undefined}
              className="rounded-full bg-card/70 backdrop-blur-sm p-1.5 text-foreground/80 hover:bg-card/90 transition"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
          {isOwner && onDelete && (
            <button
              onClick={() => onDelete(photo)}
              className="rounded-full bg-card/70 backdrop-blur-sm p-1.5 text-destructive hover:bg-card/90 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-0">
      {/* Hero Banner */}
      <div className="group relative w-full h-[55vh] sm:h-[65vh] lg:h-[75vh] overflow-hidden mb-4">
        <img src={heroPhoto.url} alt="" className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-[0.92]" loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        {eventName && (
          <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 z-10">
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-semibold text-card drop-shadow-lg leading-tight">
              {eventName}
            </h2>
          </div>
        )}
        {renderOverlay(heroPhoto)}
      </div>

      {/* Asymmetric Collage Grid */}
      {collagePhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
          {collagePhotos.map((photo, i) => {
            const pattern = COLLAGE_PATTERN[i % COLLAGE_PATTERN.length];
            return (
              <div key={photo.id} className={`group relative overflow-hidden rounded-lg ${pattern.span} ${pattern.ratio}`}>
                <img src={photo.url} alt="" className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-[0.92]" loading="lazy" />
                {renderOverlay(photo)}
              </div>
            );
          })}
        </div>
      )}

      {/* Masonry Continuation */}
      {remainingPhotos.length > 0 && (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-4">
          {remainingPhotos.map((photo) => (
            <div key={photo.id} className="group relative mb-3 sm:mb-4 break-inside-avoid rounded-lg overflow-hidden">
              <img src={photo.url} alt="" className="w-full block transition-opacity duration-300 group-hover:opacity-[0.92]" loading="lazy" />
              {renderOverlay(photo)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
