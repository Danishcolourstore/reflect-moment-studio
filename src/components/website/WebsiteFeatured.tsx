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
  /** Custom section heading */
  heading?: string;
}

export function WebsiteFeatured({ events, coverPhotos, accent, onNavigate, id, template = 'vows-elegance', heading }: WebsiteFeaturedProps) {
  if (events.length === 0) return null;
  const tmpl = getTemplate(template);
  const isEditorial = template === 'editorial-luxury';
  const textColor = isEditorial ? '#2B2A28' : tmpl.text;
  const title = heading || 'Featured Work';

  return (
    <section id={id} className="py-20 sm:py-32 px-6 sm:px-8" style={{ backgroundColor: isEditorial ? '#F5F0EA' : tmpl.bg }}>
      <div className="text-center mb-16 sm:mb-24">
        <p
          className="text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-4"
          style={{ color: accent, opacity: 0.7, fontFamily: '"DM Sans", sans-serif' }}
        >
          Gallery
        </p>
        <h2
          className={`text-3xl sm:text-5xl lg:text-6xl font-light tracking-[0.04em] ${isEditorial ? 'italic' : 'uppercase tracking-[0.06em]'}`}
          style={{ fontFamily: isEditorial ? '"Playfair Display", Georgia, serif' : '"Cormorant Garamond", Georgia, serif', color: textColor }}
        >
          {title}
        </h2>
        <div className="mt-6 w-12 h-[1px] mx-auto" style={{ backgroundColor: isEditorial ? '#D5CEC5' : accent, opacity: 0.4 }} />
      </div>

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {events.map((ev, idx) => {
          const cover = ev.cover_url || coverPhotos[ev.id] || null;
          const isEven = idx % 2 === 0;
          return (
            <a
              key={ev.id}
              href={`/event/${ev.slug}`}
              onClick={(e) => { e.preventDefault(); onNavigate(ev.slug); }}
              className="group relative block overflow-hidden"
              style={{ borderRadius: isEditorial ? '0' : '2px' }}
            >
              <div className={`${isEditorial ? 'aspect-[16/10]' : 'aspect-[16/9] sm:aspect-[21/9]'} overflow-hidden`} style={{ backgroundColor: isEditorial ? '#E8E2DA' : tmpl.cardBg }}>
                {cover ? (
                  <div className="h-full w-full transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]">
                    <ProgressiveImage src={cover} alt={ev.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Camera className="h-12 w-12" style={{ color: isEditorial ? '#B5AEA5' : tmpl.textSecondary, opacity: 0.1 }} />
                  </div>
                )}
                <div
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{
                    background: isEditorial
                      ? (isEven ? 'linear-gradient(to right, rgba(43,42,40,0.55) 0%, rgba(43,42,40,0.2) 40%, transparent 70%)' : 'linear-gradient(to left, rgba(43,42,40,0.55) 0%, rgba(43,42,40,0.2) 40%, transparent 70%)')
                      : (isEven ? `linear-gradient(to right, ${tmpl.bg}DD 0%, ${tmpl.bg}66 40%, transparent 70%)` : `linear-gradient(to left, ${tmpl.bg}DD 0%, ${tmpl.bg}66 40%, transparent 70%)`),
                  }}
                />
              </div>

              <div className={`absolute inset-0 flex flex-col justify-center px-8 sm:px-16 ${isEven ? 'items-start' : 'items-end text-right'}`}>
                <p
                  className="text-[10px] sm:text-xs uppercase tracking-[0.3em] mb-3"
                  style={{ color: isEditorial ? '#F5F0EA' : accent, fontFamily: '"DM Sans", sans-serif' }}
                >
                  {ev.event_type}
                </p>
                <h3
                  className={`text-2xl sm:text-3xl lg:text-4xl font-light tracking-[0.05em] ${isEditorial ? 'italic' : 'uppercase'}`}
                  style={{ fontFamily: isEditorial ? '"Playfair Display", Georgia, serif' : '"Cormorant Garamond", Georgia, serif', color: isEditorial ? '#F5F0EA' : tmpl.text }}
                >
                  {ev.name}
                </h3>
                <span
                  className="mt-4 inline-flex items-center text-[10px] uppercase tracking-[0.25em] opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0"
                  style={{ color: isEditorial ? '#F5F0EA' : accent, fontFamily: '"DM Sans", sans-serif' }}
                >
                  View Gallery →
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
