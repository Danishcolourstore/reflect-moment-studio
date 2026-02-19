import { Heart, Download, Trash2, Share2 } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  is_favorite: boolean;
  file_name: string | null;
}

interface Props {
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

function PhotoOverlay({
  photo, isFav, toggleFavorite, canDownload, isOwner, onDelete, onShare, onDownload, watermarkText,
}: {
  photo: Photo; isFav: boolean; toggleFavorite: (id: string) => void;
  canDownload: boolean; isOwner: boolean; onDelete?: (p: Photo) => void;
  onShare?: (p: Photo) => void; onDownload?: (p: Photo) => void;
  watermarkText?: string | null;
}) {
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
          className={`h-3.5 w-3.5 transition-all duration-200 ${isFav ? 'text-primary scale-110' : 'text-foreground/50 hover:text-foreground/70'}`}
          fill={isFav ? 'hsl(var(--primary))' : 'none'}
        />
      </button>
      <div className="absolute inset-0 transition-colors duration-200 group-hover:bg-foreground/10 pointer-events-none" />
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {onShare && (
          <button onClick={() => onShare(photo)}
            className="rounded-full bg-card/70 text-foreground/80 hover:bg-card/90 backdrop-blur-sm p-1.5 transition">
            <Share2 className="h-3.5 w-3.5" />
          </button>
        )}
        {canDownload && (
          <button onClick={() => onDownload ? onDownload(photo) : undefined}
            className="rounded-full bg-card/70 backdrop-blur-sm p-1.5 text-foreground/80 hover:bg-card/90 transition">
            <Download className="h-3.5 w-3.5" />
          </button>
        )}
        {isOwner && onDelete && (
          <button onClick={() => onDelete(photo)}
            className="rounded-full bg-card/70 backdrop-blur-sm p-1.5 text-destructive hover:bg-card/90 transition">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   1. Pixieset Editorial Layout
   ═══════════════════════════════════════════ */
export function PixiesetEditorialGrid({ photos, eventName, isFavorite, toggleFavorite, canDownload = false, isOwner = false, onDelete, onShare, onDownload, watermarkText }: Props) {
  if (photos.length === 0) return null;
  const hero = photos[0];
  const rest = photos.slice(1);

  const rows: Photo[][] = [];
  let i = 0;
  let rowSize = 2;
  while (i < rest.length) {
    rows.push(rest.slice(i, i + rowSize));
    i += rowSize;
    rowSize = rowSize === 2 ? 3 : 2;
  }

  return (
    <div>
      <div className="group relative w-full h-[50vh] sm:h-[60vh] lg:h-[68vh] overflow-hidden">
        <img src={hero.url} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
        {eventName && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-semibold text-card drop-shadow-lg text-center tracking-wide leading-tight px-4">
              {eventName}
            </h2>
          </div>
        )}
        <PhotoOverlay photo={hero} isFav={isFavorite(hero.id)} toggleFavorite={toggleFavorite} canDownload={canDownload} isOwner={isOwner} onDelete={onDelete} onShare={onShare} onDownload={onDownload} watermarkText={watermarkText} />
      </div>

      <div className="mt-3 space-y-[6px]">
        {rows.map((row, ri) => (
          <div key={ri} className={`grid gap-[6px] ${row.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {row.map((photo, ci) => {
              const aspect = row.length <= 2
                ? (ci % 2 === 0 ? 'aspect-[4/5]' : 'aspect-square')
                : 'aspect-square';
              return (
                <div key={photo.id} className={`group relative overflow-hidden ${aspect}`}>
                  <img src={photo.url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                  <PhotoOverlay photo={photo} isFav={isFavorite(photo.id)} toggleFavorite={toggleFavorite} canDownload={canDownload} isOwner={isOwner} onDelete={onDelete} onShare={onShare} onDownload={onDownload} watermarkText={watermarkText} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   2. Pic-Time Cinematic Masonry
   ═══════════════════════════════════════════ */
export function CinematicMasonryGrid({ photos, isFavorite, toggleFavorite, canDownload = false, isOwner = false, onDelete, onShare, onDownload, watermarkText }: Props) {
  if (photos.length === 0) return null;

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4">
      {photos.map((photo, i) => {
        const isFeature = i % 5 === 0;
        return (
          <div
            key={photo.id}
            className={`group relative break-inside-avoid mb-3 sm:mb-4 overflow-hidden ${isFeature ? 'sm:mb-5' : ''}`}
          >
            <img src={photo.url} alt="" className="w-full block" loading="lazy" />
            {isFeature && (
              <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.12)] pointer-events-none" />
            )}
            <PhotoOverlay photo={photo} isFav={isFavorite(photo.id)} toggleFavorite={toggleFavorite} canDownload={canDownload} isOwner={isOwner} onDelete={onDelete} onShare={onShare} onDownload={onDownload} watermarkText={watermarkText} />
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   3. Highlight Mosaic Layout
   ═══════════════════════════════════════════ */
export function HighlightMosaicGrid({ photos, eventName, isFavorite, toggleFavorite, canDownload = false, isOwner = false, onDelete, onShare, onDownload, watermarkText }: Props) {
  if (photos.length === 0) return null;

  const banner = photos[0];
  const mosaicPhotos = photos.slice(1);

  const MOSAIC_PATTERN = [
    'col-span-2 row-span-2 aspect-square',
    'col-span-1 row-span-1 aspect-[4/5]',
    'col-span-1 row-span-1 aspect-square',
    'col-span-1 row-span-1 aspect-[3/2]',
    'col-span-1 row-span-1 aspect-[4/5]',
  ];

  return (
    <div>
      <div className="group relative w-full h-[45vh] sm:h-[55vh] lg:h-[65vh] overflow-hidden">
        <img src={banner.url} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
        {eventName && (
          <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 z-10">
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-semibold text-card drop-shadow-lg leading-tight">
              {eventName}
            </h2>
          </div>
        )}
        <PhotoOverlay photo={banner} isFav={isFavorite(banner.id)} toggleFavorite={toggleFavorite} canDownload={canDownload} isOwner={isOwner} onDelete={onDelete} onShare={onShare} onDownload={onDownload} watermarkText={watermarkText} />
      </div>

      {mosaicPhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[6px] sm:gap-2 mt-3">
          {mosaicPhotos.map((photo, i) => {
            const pattern = MOSAIC_PATTERN[i % MOSAIC_PATTERN.length];
            return (
              <div key={photo.id} className={`group relative overflow-hidden ${pattern}`}>
                <img src={photo.url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                <PhotoOverlay photo={photo} isFav={isFavorite(photo.id)} toggleFavorite={toggleFavorite} canDownload={canDownload} isOwner={isOwner} onDelete={onDelete} onShare={onShare} onDownload={onDownload} watermarkText={watermarkText} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
