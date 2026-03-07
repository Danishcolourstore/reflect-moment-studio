import { Camera, Calendar, MapPin, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ProgressiveImage } from '@/components/ProgressiveImage';

interface PortfolioEvent {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  location: string | null;
  cover_url: string | null;
  photo_count: number;
}

interface WebsitePortfolioProps {
  events: PortfolioEvent[];
  coverPhotos: Record<string, string>;
  accent: string;
  layout?: 'grid' | 'masonry' | 'large';
  onNavigate: (slug: string) => void;
  id?: string;
}

export function WebsitePortfolio({
  events,
  coverPhotos,
  accent,
  layout = 'grid',
  onNavigate,
  id,
}: WebsitePortfolioProps) {
  if (events.length === 0) {
    return (
      <section id={id} className="py-20 text-center" style={{ backgroundColor: '#0C0B08' }}>
        <Camera className="mx-auto h-10 w-10 mb-4" style={{ color: '#A6A197', opacity: 0.3 }} />
        <p className="text-sm" style={{ color: '#A6A197' }}>
          No public shoots yet
        </p>
      </section>
    );
  }

  const gridCols =
    layout === 'large'
      ? 'grid-cols-1 sm:grid-cols-2'
      : layout === 'masonry'
      ? 'grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  const aspectClass = layout === 'large' ? 'aspect-[16/10]' : 'aspect-[4/3]';

  return (
    <section id={id} className="py-16 px-4 sm:px-6" style={{ backgroundColor: '#0C0B08' }}>
      {/* Section heading */}
      <div className="text-center mb-12">
        <div className="w-8 h-[1px] mx-auto mb-4" style={{ backgroundColor: accent }} />
        <p className="text-xs tracking-[0.3em] uppercase" style={{ color: '#A6A197' }}>
          Portfolio · {events.length} {events.length === 1 ? 'shoot' : 'shoots'}
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className={`grid ${gridCols} gap-4 sm:gap-5`}>
          {events.map((ev) => {
            const coverUrl = ev.cover_url || coverPhotos[ev.id] || null;
            return (
              <a
                key={ev.id}
                href={`/event/${ev.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(ev.slug);
                }}
                className="group relative overflow-hidden cursor-pointer block"
                style={{ borderRadius: '4px' }}
              >
                <div
                  className={`${aspectClass} overflow-hidden`}
                  style={{ backgroundColor: '#17140D' }}
                >
                  {coverUrl ? (
                    <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-105">
                      <ProgressiveImage
                        src={coverUrl}
                        alt={ev.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Camera className="h-8 w-8" style={{ color: '#A6A197', opacity: 0.2 }} />
                    </div>
                  )}

                  <div
                    className="absolute inset-0 transition-opacity duration-500 opacity-60 group-hover:opacity-100"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(12,11,8,0.85) 0%, rgba(12,11,8,0.1) 50%, transparent 100%)',
                    }}
                  />
                </div>

                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
                  <h3
                    className="text-base sm:text-lg font-light tracking-wide"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: '#EDEAE3',
                    }}
                  >
                    {ev.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span
                      className="text-[10px] tracking-[0.15em] uppercase flex items-center gap-1"
                      style={{ color: '#A6A197' }}
                    >
                      <Calendar className="h-3 w-3" style={{ color: accent }} />
                      {format(new Date(ev.event_date), 'MMM yyyy')}
                    </span>
                    {ev.location && (
                      <span
                        className="text-[10px] tracking-[0.15em] uppercase flex items-center gap-1"
                        style={{ color: '#A6A197' }}
                      >
                        <MapPin className="h-3 w-3" style={{ color: accent }} />
                        {ev.location}
                      </span>
                    )}
                  </div>
                  {ev.photo_count > 0 && (
                    <p
                      className="mt-2 text-[10px] tracking-[0.2em] uppercase"
                      style={{ color: accent, opacity: 0.7 }}
                    >
                      {ev.photo_count} photos
                    </p>
                  )}
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ExternalLink className="h-4 w-4" style={{ color: accent }} />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
