import { Camera, Calendar, MapPin } from 'lucide-react';
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
  event_type?: string;
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
      <section id={id} className="py-28 text-center" style={{ backgroundColor: '#0C0B08' }}>
        <Camera className="mx-auto h-10 w-10 mb-4" style={{ color: '#A6A197', opacity: 0.3 }} />
        <p className="text-sm" style={{ color: '#A6A197' }}>
          No public shoots yet
        </p>
      </section>
    );
  }

  // For large layout: first 2 items full width, rest 2-col
  const isLarge = layout === 'large';

  return (
    <section id={id} className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0C0B08' }}>
      {/* Section heading */}
      <div className="text-center mb-16 sm:mb-20">
        <p
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] mb-4"
          style={{ color: accent, opacity: 0.7 }}
        >
          Selected Work
        </p>
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: '#EDEAE3',
          }}
        >
          Portfolio
        </h2>
        <div className="mt-5 w-10 h-[1px] mx-auto" style={{ backgroundColor: accent, opacity: 0.5 }} />
      </div>

      <div className="max-w-6xl mx-auto">
        {isLarge ? (
          <div className="space-y-6">
            {events.map((ev, idx) => (
              <PortfolioCard
                key={ev.id}
                event={ev}
                coverPhotos={coverPhotos}
                accent={accent}
                onNavigate={onNavigate}
                aspectClass={idx < 2 ? 'aspect-[21/9]' : 'aspect-[16/10]'}
                large
              />
            ))}
          </div>
        ) : (
          <div className={`grid ${layout === 'masonry' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'} gap-5 sm:gap-6`}>
            {events.map((ev) => (
              <PortfolioCard
                key={ev.id}
                event={ev}
                coverPhotos={coverPhotos}
                accent={accent}
                onNavigate={onNavigate}
                aspectClass="aspect-[4/3]"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PortfolioCard({
  event: ev,
  coverPhotos,
  accent,
  onNavigate,
  aspectClass,
  large,
}: {
  event: PortfolioEvent;
  coverPhotos: Record<string, string>;
  accent: string;
  onNavigate: (slug: string) => void;
  aspectClass: string;
  large?: boolean;
}) {
  const coverUrl = ev.cover_url || coverPhotos[ev.id] || null;
  const eventType = (ev as any).event_type;

  return (
    <a
      href={`/event/${ev.slug}`}
      onClick={(e) => {
        e.preventDefault();
        onNavigate(ev.slug);
      }}
      className="group relative overflow-hidden cursor-pointer block"
      style={{ borderRadius: '2px' }}
    >
      <div
        className={`${aspectClass} overflow-hidden`}
        style={{ backgroundColor: '#14120D' }}
      >
        {coverUrl ? (
          <div className="h-full w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]">
            <ProgressiveImage
              src={coverUrl}
              alt={ev.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Camera className="h-8 w-8" style={{ color: '#A6A197', opacity: 0.15 }} />
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-500 opacity-50 group-hover:opacity-80"
          style={{
            background:
              'linear-gradient(to top, rgba(10,9,6,0.95) 0%, rgba(10,9,6,0.3) 40%, transparent 100%)',
          }}
        />
      </div>

      {/* Card content */}
      <div className={`absolute bottom-0 inset-x-0 ${large ? 'p-6 sm:p-8' : 'p-5 sm:p-6'}`}>
        {/* Category label */}
        {eventType && (
          <p
            className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] mb-2"
            style={{ color: accent, opacity: 0.8 }}
          >
            {eventType}
          </p>
        )}

        <h3
          className={`${large ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'} font-light tracking-wide`}
          style={{
            fontFamily: "'Playfair Display', serif",
            color: '#EDEAE3',
          }}
        >
          {ev.name}
        </h3>

        <div className="flex items-center gap-3 mt-2">
          <span
            className="text-[10px] tracking-[0.12em] uppercase flex items-center gap-1.5"
            style={{ color: 'rgba(166,161,151,0.7)' }}
          >
            <Calendar className="h-3 w-3" style={{ color: accent, opacity: 0.6 }} />
            {format(new Date(ev.event_date), 'MMM yyyy')}
          </span>
          {ev.location && (
            <span
              className="text-[10px] tracking-[0.12em] uppercase flex items-center gap-1.5"
              style={{ color: 'rgba(166,161,151,0.7)' }}
            >
              <MapPin className="h-3 w-3" style={{ color: accent, opacity: 0.6 }} />
              {ev.location}
            </span>
          )}
        </div>

        {ev.photo_count > 0 && (
          <p
            className="mt-3 text-[10px] tracking-[0.2em] uppercase"
            style={{ color: accent, opacity: 0.5 }}
          >
            {ev.photo_count} photographs
          </p>
        )}
      </div>

      {/* Hover reveal bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
        style={{ backgroundColor: accent }}
      />
    </a>
  );
}
