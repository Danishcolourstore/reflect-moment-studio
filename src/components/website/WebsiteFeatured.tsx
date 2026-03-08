import { Camera } from 'lucide-react';
import { ProgressiveImage } from '@/components/ProgressiveImage';
import { getTemplate } from '@/lib/website-templates';

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
  template?: string;
}

export function WebsiteFeatured({
  events,
  coverPhotos,
  accent,
  onNavigate,
  id,
  template = 'dark-portfolio',
}: WebsiteFeaturedProps) {
  if (events.length === 0) return null;
  const tmpl = getTemplate(template);

  return (
    <section id={id} className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: tmpl.bg }}>
      {/* Section heading */}
      <div className="text-center mb-16 sm:mb-20">
        <p
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] mb-4"
          style={{ color: accent, opacity: 0.7 }}
        >
          Featured Work
        </p>
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide"
          style={{ fontFamily: tmpl.fontFamily, color: tmpl.text }}
        >
          Highlights
        </h2>
        <div className="mt-5 w-10 h-[1px] mx-auto" style={{ backgroundColor: accent, opacity: 0.5 }} />
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
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
              className="group relative overflow-hidden cursor-pointer block"
              style={{ borderRadius: '2px' }}
            >
              <div className="aspect-[3/2] overflow-hidden" style={{ backgroundColor: tmpl.cardBg }}>
                {cover ? (
                  <div className="h-full w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]">
                    <ProgressiveImage src={cover} alt={ev.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Camera className="h-10 w-10" style={{ color: tmpl.textSecondary, opacity: 0.15 }} />
                  </div>
                )}
                <div
                  className="absolute inset-0 opacity-40 group-hover:opacity-75 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(to top, ${tmpl.footerBg}F2 0%, transparent 60%)`,
                  }}
                />
              </div>

              <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6">
                <p
                  className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] mb-2"
                  style={{ color: accent, opacity: 0.8 }}
                >
                  {ev.event_type}
                </p>
                <h3
                  className="text-xl sm:text-2xl font-light tracking-wide"
                  style={{ fontFamily: tmpl.fontFamily, color: tmpl.text }}
                >
                  {ev.name}
                </h3>
              </div>

              {/* Hover reveal bar */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
                style={{ backgroundColor: accent }}
              />
            </a>
          );
        })}
      </div>
    </section>
  );
}
