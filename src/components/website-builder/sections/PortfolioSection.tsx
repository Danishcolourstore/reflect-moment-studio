import { type TemplateConfig } from '@/lib/website-templates';
import { getPortfolioImages } from '@/lib/website-demo-images';

interface PortfolioSectionProps {
  template: TemplateConfig;
  images?: string[];
  id?: string;
}

export function PortfolioSection({ template, images, id }: PortfolioSectionProps) {
  const t = template;
  const imgs = images && images.length > 0 ? images : getPortfolioImages(t.id);
  const variant = t.sections.portfolio;
  const gap = t.extras.portfolioGap ?? 6;

  const sectionHeading = (text: string, sub?: string) => (
    <div className="text-center mb-12 sm:mb-16">
      {sub && (
        <p style={{
          fontFamily: t.fonts.ui,
          fontSize: 10,
          letterSpacing: '0.3em',
          textTransform: 'uppercase' as const,
          color: t.colors.accent,
          opacity: 0.7,
          marginBottom: 12,
        }}>
          {sub}
        </p>
      )}
      <h2 style={{
        fontFamily: t.fonts.display,
        fontSize: t.id === 'alabaster' ? 11 : 'clamp(32px, 5vw, 42px)',
        fontWeight: t.fonts.displayWeight,
        fontStyle: t.id === 'heirloom' ? 'italic' : t.fonts.displayStyle,
        color: t.colors.text,
        letterSpacing: t.id === 'alabaster' ? '0.3em' : '0.02em',
        textTransform: t.id === 'alabaster' ? 'uppercase' as const : 'none' as const,
      }}>
        {text}
      </h2>
    </div>
  );

  /* ── Masonry (Reverie, Heirloom) ── */
  if (variant === 'masonry') {
    const cols = t.extras.portfolioCols ?? { desktop: 3, mobile: 2 };
    return (
      <section id={id} className="py-16 sm:py-24 px-4 sm:px-6" style={{ backgroundColor: t.colors.bg }}>
        {sectionHeading(
          t.id === 'heirloom' ? 'The Work' : 'Portfolio',
          t.id === 'reverie' ? 'Selected Work' : undefined,
        )}
        <div className="max-w-6xl mx-auto">
          <style>{`
            .wb-masonry { columns: ${cols.mobile}; column-gap: ${gap}px; }
            @media (min-width: 640px) { .wb-masonry { columns: ${cols.desktop}; } }
          `}</style>
          <div className="wb-masonry">
            {imgs.map((src, i) => (
              <div key={i} className="mb-[var(--gap)]" style={{ '--gap': `${gap}px` } as any}>
                <img
                  src={src}
                  alt={`Portfolio ${i + 1}`}
                  className="w-full block"
                  style={{
                    filter: t.extras.imageFilter,
                    transition: 'filter 400ms ease',
                  }}
                  onMouseEnter={(e) = loading="lazy" decoding="async"> {
                    if (t.extras.imageHoverFilter) (e.target as HTMLImageElement).style.filter = t.extras.imageHoverFilter;
                  }}
                  onMouseLeave={(e) => {
                    if (t.extras.imageFilter) (e.target as HTMLImageElement).style.filter = t.extras.imageFilter;
                  }}
                />
              </div>
            ))}
          </div>
          {t.id === 'reverie' && (
            <div className="text-center mt-10">
              <a
                href="#"
                className="transition-opacity hover:opacity-60"
                style={{
                  fontFamily: t.fonts.ui,
                  fontSize: 12,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  color: t.colors.accent,
                  textDecoration: 'underline',
                  textUnderlineOffset: 4,
                }}
              >
                View All Work
              </a>
            </div>
          )}
        </div>
      </section>
    );
  }

  /* ── Uniform Grid (Linen) ── */
  if (variant === 'uniform') {
    const cols = t.extras.portfolioCols ?? { desktop: 3, mobile: 2 };
    const categories = ['All', 'Weddings', 'Portraits', 'Events'];
    return (
      <section id={id} className="py-16 sm:py-24 px-4 sm:px-6" style={{ backgroundColor: t.colors.bg }}>
        {sectionHeading('Portfolio')}
        <div className="max-w-6xl mx-auto">
          {/* Category filters */}
          <div className="flex items-center justify-center gap-6 mb-8">
            {categories.map((cat, i) => (
              <button
                key={cat}
                className="transition-opacity hover:opacity-60"
                style={{
                  fontFamily: t.fonts.ui,
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  color: i === 0 ? t.colors.text : t.colors.textSecondary,
                  borderBottom: i === 0 ? `1px solid ${t.colors.text}` : 'none',
                  paddingBottom: 4,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div
            className="grid gap-[var(--gap)]"
            style={{
              '--gap': `${gap}px`,
              gridTemplateColumns: `repeat(${cols.mobile}, 1fr)`,
            } as any}
          >
            <style>{`
              @media (min-width: 640px) {
                .wb-uniform-grid { grid-template-columns: repeat(${cols.desktop}, 1fr) !important; }
              }
            `}</style>
            <div
              className="wb-uniform-grid grid gap-[var(--gap)]"
              style={{
                '--gap': `${gap}px`,
                gridTemplateColumns: `repeat(${cols.mobile}, 1fr)`,
              } as any}
            >
              {imgs.map((src, i) => (
                <div key={i} className="aspect-square overflow-hidden">
                  <img src={src} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ── Editorial (Vesper) ── */
  if (variant === 'editorial') {
    return (
      <section id={id} className="py-16 sm:py-24 px-4 sm:px-6" style={{ backgroundColor: t.colors.bg }}>
        {sectionHeading('Portfolio', 'Selected Work')}
        <div className="max-w-6xl mx-auto space-y-2">
          {/* Hero image */}
          {imgs[0] && (
            <div className="w-full overflow-hidden" style={{ height: '70vh', minHeight: 300 }}>
              <img src={imgs[0]} alt="Featured" className="w-full h-full object-cover" style={{ filter: t.extras.imageFilter }} loading="lazy" decoding="async" />
            </div>
          )}
          {/* Alternating layout */}
          <div className="grid grid-cols-3 gap-2">
            {imgs.slice(1, 4).map((src, i) => (
              <div key={i} className={i === 0 ? 'col-span-2 row-span-2' : 'col-span-1'}>
                <img
                  src={src}
                  alt={`Portfolio ${i + 2}`}
                  className="w-full h-full object-cover"
                  style={{ filter: t.extras.imageFilter }} loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {imgs.slice(4, 7).map((src, i) => (
              <div key={i}>
                <img src={src} alt={`Portfolio ${i + 5}`} className="w-full h-full object-cover" style={{ filter: t.extras.imageFilter }} loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ── Two Column (Alabaster) ── */
  return (
    <section id={id} className="py-16 sm:py-24 px-4 sm:px-6" style={{ backgroundColor: t.colors.bg }}>
      {sectionHeading('Work')}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-[2px]">
        {imgs.slice(0, 6).map((src, i) => (
          <div key={i} className="overflow-hidden" style={{ aspectRatio: i % 2 === 0 ? '3/4' : '4/3' }}>
            <img src={src} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
          </div>
        ))}
      </div>
    </section>
  );
}
