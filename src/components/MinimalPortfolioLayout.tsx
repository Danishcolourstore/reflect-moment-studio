import { Heart, Download, Share2, Trash2 } from 'lucide-react';
import { ProgressiveImage } from '@/components/ProgressiveImage';

interface Photo {
  id: string;
  url: string;
  is_favorite?: boolean;
  file_name: string | null;
}

interface MinimalPortfolioLayoutProps {
  photos: Photo[];
  eventName?: string;
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

/**
 * Minimal Portfolio Layout
 * Large images with generous whitespace — designed for fine art photography.
 * Each photo is displayed full-width with ample vertical spacing.
 */
export function MinimalPortfolioLayout({
  photos,
  eventName,
  isFavorite,
  toggleFavorite,
  canDownload = false,
  isOwner = false,
  onDelete,
  onShare,
  onDownload,
  onOpenLightbox,
  watermarkText,
}: MinimalPortfolioLayoutProps) {
  if (photos.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Title */}
      {eventName && (
        <div className="text-center py-16 sm:py-24">
          <h2
            className="font-serif text-3xl sm:text-5xl font-light text-foreground tracking-wide"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {eventName}
          </h2>
          <div className="w-12 h-px bg-primary mx-auto mt-6" />
        </div>
      )}

      {/* Photos — one per row, generous spacing */}
      <div className="space-y-16 sm:space-y-24">
        {photos.map((photo) => {
          const fav = isFavorite(photo.id);
          return (
            <div
              key={photo.id}
              className="group relative cursor-pointer"
              onClick={() => onOpenLightbox?.(photo.id)}
            >
              <ProgressiveImage
                src={photo.url}
                alt={photo.file_name || ''}
                className="w-full h-auto block"
              />

              {/* Watermark */}
              {watermarkText && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <span className="font-serif text-white/20 text-2xl sm:text-4xl whitespace-nowrap tracking-[0.2em] rotate-[-15deg]">
                    {watermarkText}
                  </span>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 pointer-events-none" />

              {/* Heart */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.id); }}
                className="absolute top-4 right-4 z-10 min-w-[44px] min-h-[44px] rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                style={fav ? { opacity: 1 } : undefined}
              >
                <Heart
                  className="h-5 w-5 transition-all duration-200"
                  style={fav ? { color: 'hsl(var(--primary))', fill: 'hsl(var(--primary))' } : { color: 'white' }}
                />
              </button>

              {/* Actions */}
              <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {onShare && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onShare(photo); }}
                    className="rounded-full bg-black/40 backdrop-blur-sm p-2.5 text-white/80 hover:bg-black/60 transition"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                )}
                {canDownload && onDownload && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDownload(photo); }}
                    className="rounded-full bg-black/40 backdrop-blur-sm p-2.5 text-white/80 hover:bg-black/60 transition"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}
                {isOwner && onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(photo); }}
                    className="rounded-full bg-black/40 backdrop-blur-sm p-2.5 text-destructive hover:bg-black/60 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* File name caption */}
              {photo.file_name && (
                <p className="mt-3 text-center text-[11px] text-muted-foreground/40 tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {photo.file_name}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* End mark */}
      <div className="py-20 text-center">
        <div className="w-8 h-px bg-border mx-auto" />
      </div>
    </div>
  );
}
