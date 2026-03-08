import { Camera } from 'lucide-react';
import { ProgressiveImage } from '@/components/ProgressiveImage';

export interface PortfolioAlbum {
  id: string;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  category?: string;
  photo_urls?: string[];
}

interface WebsiteAlbumsProps {
  albums: PortfolioAlbum[];
  accent: string;
  onAlbumClick?: (albumId: string) => void;
  id?: string;
}

export function WebsiteAlbums({ albums, accent, onAlbumClick, id }: WebsiteAlbumsProps) {
  if (albums.length === 0) return null;

  return (
    <section id={id} className="py-16 sm:py-24 px-4" style={{ backgroundColor: '#0C0B08' }}>
      <div className="text-center mb-10 sm:mb-14">
        <p
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] mb-3"
          style={{ color: accent, opacity: 0.7 }}
        >
          Collections
        </p>
        <h2
          className="text-3xl sm:text-4xl font-light tracking-wide"
          style={{ fontFamily: "'Playfair Display', serif", color: '#EDEAE3' }}
        >
          Albums
        </h2>
        <div className="mt-4 w-10 h-[1px] mx-auto" style={{ backgroundColor: accent, opacity: 0.5 }} />
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {albums.map((album) => (
          <button
            key={album.id}
            onClick={() => onAlbumClick?.(album.id)}
            className="group relative block overflow-hidden rounded-lg text-left"
          >
            <div className="relative w-full" style={{ paddingBottom: '120%', backgroundColor: '#14120D' }}>
              {album.cover_url ? (
                <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.05]">
                  <ProgressiveImage
                    src={album.cover_url}
                    alt={album.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="h-8 w-8" style={{ color: '#A6A197', opacity: 0.15 }} />
                </div>
              )}
              <div
                className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4"
                style={{
                  background: 'linear-gradient(to top, rgba(8,7,4,0.9) 0%, rgba(8,7,4,0.3) 50%, transparent 100%)',
                }}
              >
                <p
                  className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mb-1"
                  style={{ color: accent, opacity: 0.8 }}
                >
                  {album.category || 'Collection'}
                </p>
                <h3
                  className="text-sm sm:text-base font-light tracking-wide leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#EDEAE3' }}
                >
                  {album.title}
                </h3>
                {album.photo_urls && album.photo_urls.length > 0 && (
                  <p className="mt-1 text-[8px] sm:text-[9px] tracking-[0.15em] uppercase" style={{ color: '#A6A197', opacity: 0.7 }}>
                    {album.photo_urls.length} photos
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
