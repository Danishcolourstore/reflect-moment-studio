import { Heart, Download, Trash2 } from 'lucide-react';

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
}

/* ── Collage pattern: assigns aspect-ratio classes in a repeating cycle ── */
const COLLAGE_PATTERN: { ratio: string; span: string }[] = [
  { ratio: 'aspect-[3/2]', span: 'col-span-2 row-span-1' },     // landscape hero-ish
  { ratio: 'aspect-[4/5]', span: 'col-span-1 row-span-1' },     // portrait
  { ratio: 'aspect-square', span: 'col-span-1 row-span-1' },    // square
  { ratio: 'aspect-[3/2]', span: 'col-span-1 row-span-1' },     // landscape
  { ratio: 'aspect-[4/5]', span: 'col-span-1 row-span-1' },     // portrait
  { ratio: 'aspect-[3/2]', span: 'col-span-2 row-span-1' },     // wide highlight
  { ratio: 'aspect-square', span: 'col-span-1 row-span-1' },    // square
  { ratio: 'aspect-[4/5]', span: 'col-span-1 row-span-1' },     // portrait
  { ratio: 'aspect-[3/2]', span: 'col-span-1 row-span-1' },     // landscape
  { ratio: 'aspect-square', span: 'col-span-1 row-span-1' },    // square
];

const HERO_COLLAGE_COUNT = 9; // first N after hero go into the collage section

export function EditorialCollageGrid({
  photos,
  eventName,
  isFavorite,
  toggleFavorite,
  canDownload = false,
  isOwner = false,
  onDelete,
}: EditorialCollageGridProps) {
  if (photos.length === 0) return null;

  const heroPhoto = photos[0];
  const collagePhotos = photos.slice(1, 1 + HERO_COLLAGE_COUNT);
  const remainingPhotos = photos.slice(1 + HERO_COLLAGE_COUNT);

  const renderOverlay = (photo: Photo) => {
    const fav = isFavorite(photo.id);
    return (
      <>
        {/* Persistent heart when favorited */}
        {fav && (
          <button
            onClick={() => toggleFavorite(photo.id)}
            className="absolute top-2 right-2 rounded-full bg-destructive/80 text-destructive-foreground p-1.5 backdrop-blur-sm transition hover:bg-destructive/90 z-10"
          >
            <Heart className="h-3.5 w-3.5" fill="currentColor" />
          </button>
        )}
        {/* Hover actions */}
        <div className="absolute inset-0 transition-colors duration-200 group-hover:bg-foreground/15">
          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {!fav && (
              <button
                onClick={() => toggleFavorite(photo.id)}
                className="rounded-full bg-card/70 text-foreground/80 hover:bg-card/90 backdrop-blur-sm p-1.5 transition"
              >
                <Heart className="h-3.5 w-3.5" />
              </button>
            )}
            {canDownload && (
              <a
                href={photo.url}
                download={photo.file_name ?? true}
                className="rounded-full bg-card/70 backdrop-blur-sm p-1.5 text-foreground/80 hover:bg-card/90 transition"
              >
                <Download className="h-3.5 w-3.5" />
              </a>
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
        </div>
      </>
    );
  };

  return (
    <div className="space-y-0">
      {/* ── Hero Banner ── */}
      <div className="group relative w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] overflow-hidden mb-3">
        <img
          src={heroPhoto.url}
          alt=""
          className="h-full w-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        {/* Optional title overlay */}
        {eventName && (
          <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 z-10">
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-semibold text-card drop-shadow-lg leading-tight">
              {eventName}
            </h2>
          </div>
        )}
        {renderOverlay(heroPhoto)}
      </div>

      {/* ── Asymmetric Collage Grid ── */}
      {collagePhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[10px] sm:gap-3 mb-3">
          {collagePhotos.map((photo, i) => {
            const pattern = COLLAGE_PATTERN[i % COLLAGE_PATTERN.length];
            return (
              <div
                key={photo.id}
                className={`group relative overflow-hidden ${pattern.span} ${pattern.ratio}`}
              >
                <img
                  src={photo.url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
                {renderOverlay(photo)}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Masonry Continuation ── */}
      {remainingPhotos.length > 0 && (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-[10px] sm:gap-3">
          {remainingPhotos.map((photo) => (
            <div key={photo.id} className="group relative mb-[10px] sm:mb-3 break-inside-avoid">
              <img
                src={photo.url}
                alt=""
                className="w-full block"
                loading="lazy"
              />
              {renderOverlay(photo)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
