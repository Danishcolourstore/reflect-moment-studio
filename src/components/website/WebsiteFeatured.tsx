import { Camera } from 'lucide-react';
import { ProgressiveImage } from '@/components/ProgressiveImage';

interface FeaturedEvent {
  id: string;
  name: string;
  slug: string;
  cover_url: string | null;
  event_type: string;
}

interface WebsiteFeaturedProps {
  events: FeaturedEvent[];
  coverPhotos: Record<string, string>;
  accent: string;
  onNavigate: (slug: string) => void;
  id?: string;
}

export function WebsiteFeatured({
  events,
  coverPhotos,
  accent,
  onNavigate,
  id,
}: WebsiteFeaturedProps) {
  if (events.length === 0) return null;

  return (
    <section id={id} className="py-16 px-4 sm:px-6" style={{ backgroundColor: '#0F0E0A' }}>
      <div className="text-center mb-10">
        <p
          className="text-[10px] uppercase tracking-[0.25em] font-medium mb-2"
          style={{ color: accent, opacity: 0.7 }}
        >
          Featured Work
        </p>
        <h2
          className="text-2xl sm:text-3xl font-light"
          style={{ fontFamily: "'Playfair Display', serif", color: '#EDEAE3' }}
        >
          Highlights
        </h2>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5">
        {events.map((ev) => {
          const cover = ev.cover_url || coverPhotos[ev.id] || null;
          return (
            <a
              key={ev.id}
              href={`/event/${ev.slug}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(ev.slug);
              }}
              className="group relative overflow-hidden rounded-lg cursor-pointer block"
            >
              <div className="aspect-[3/2] overflow-hidden" style={{ backgroundColor: '#17140D' }}>
                {cover ? (
                  <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-105">
                    <ProgressiveImage src={cover} alt={ev.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Camera className="h-10 w-10" style={{ color: '#A6A197', opacity: 0.2 }} />
                  </div>
                )}
                <div
                  className="absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(to top, rgba(12,11,8,0.9) 0%, transparent 60%)',
                  }}
                />
              </div>

              <div className="absolute bottom-0 inset-x-0 p-5">
                <p
                  className="text-[10px] uppercase tracking-[0.2em] mb-1"
                  style={{ color: accent, opacity: 0.7 }}
                >
                  {ev.event_type}
                </p>
                <h3
                  className="text-xl font-light tracking-wide"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#EDEAE3' }}
                >
                  {ev.name}
                </h3>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
