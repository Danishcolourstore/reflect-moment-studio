import { Camera } from 'lucide-react';
import { ProgressiveImage } from '@/components/ProgressiveImage';
import { getTemplate } from '@/lib/website-templates';

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
  template?: string;
}

export function WebsitePortfolio({
  events,
  coverPhotos,
  accent,
  layout = 'grid',
  onNavigate,
  id,
  template = 'dark-portfolio',
}: WebsitePortfolioProps) {
  const tmpl = getTemplate(template);

  if (events.length === 0) {
    return (
      <section id={id} className="py-28 text-center" style={{ backgroundColor: tmpl.bg }}>
        <Camera className="mx-auto h-10 w-10 mb-4" style={{ color: tmpl.textSecondary, opacity: 0.3 }} />
        <p className="text-sm" style={{ color: tmpl.textSecondary }}>No public shoots yet</p>
      </section>
    );
  }

  return (
    <section id={id} className="py-16 sm:py-24 px-3 sm:px-4" style={{ backgroundColor: tmpl.bg }}>
      {/* Section heading */}
      <div className="text-center mb-10 sm:mb-14">
        <p
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] mb-3"
          style={{ color: accent, opacity: 0.7 }}
        >
          Selected Work
        </p>
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide"
          style={{ fontFamily: tmpl.fontFamily, color: tmpl.text }}
        >
          Portfolio
        </h2>
        <div className="mt-4 w-10 h-[1px] mx-auto" style={{ backgroundColor: accent, opacity: 0.5 }} />
      </div>

      {/* Photo wall grid */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-1.5">
        {events.map((ev) => (
          <PortfolioCell
            key={ev.id}
            event={ev}
            coverPhotos={coverPhotos}
            accent={accent}
            onNavigate={onNavigate}
            tmpl={tmpl}
          />
        ))}
      </div>
    </section>
  );
}

function PortfolioCell({
  event: ev,
  coverPhotos,
  accent,
  onNavigate,
  tmpl,
}: {
  event: { id: string; name: string; slug: string; cover_url: string | null; photo_count: number; event_type?: string };
  coverPhotos: Record<string, string>;
  accent: string;
  onNavigate: (slug: string) => void;
  tmpl: ReturnType<typeof getTemplate>;
}) {
  const coverUrl = ev.cover_url || coverPhotos[ev.id] || null;
  const eventType = ev.event_type;

  return (
    <a
      href={`/event/${ev.slug}`}
      onClick={(e) => {
        e.preventDefault();
        onNavigate(ev.slug);
      }}
      className="group relative block overflow-hidden cursor-pointer"
    >
      {/* Fixed 4:5 aspect ratio container */}
      <div className="relative w-full" style={{ paddingBottom: '125%', backgroundColor: tmpl.cardBg }}>
        {coverUrl ? (
          <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.05]">
            <ProgressiveImage
              src={coverUrl}
              alt={ev.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="h-7 w-7" style={{ color: tmpl.textSecondary, opacity: 0.15 }} />
          </div>
        )}

        {/* Hover overlay with info */}
        <div
          className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
          style={{
            background: `linear-gradient(to top, ${tmpl.footerBg}DD 0%, ${tmpl.footerBg}4D 50%, transparent 100%)`,
          }}
        >
          {eventType && (
            <p
              className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] mb-1"
              style={{ color: accent, opacity: 0.9 }}
            >
              {eventType}
            </p>
          )}
          <h3
            className="text-sm sm:text-base font-light tracking-wide leading-tight"
            style={{ fontFamily: tmpl.fontFamily, color: tmpl.text }}
          >
            {ev.name}
          </h3>
          {ev.photo_count > 0 && (
            <p className="mt-1 text-[8px] sm:text-[9px] tracking-[0.15em] uppercase" style={{ color: tmpl.textSecondary, opacity: 0.7 }}>
              {ev.photo_count} photos
            </p>
          )}
        </div>
      </div>
    </a>
  );
}
