import { type TemplateConfig } from '@/lib/website-templates';
import { getHeroImage } from '@/lib/website-demo-images';

interface HeroSectionProps {
  template: TemplateConfig;
  studioName: string;
  tagline?: string;
  coverImage?: string;
}

export function HeroSection({ template, studioName, tagline = 'Wedding Photography', coverImage }: HeroSectionProps) {
  const t = template;
  const img = coverImage || getHeroImage(t.id);
  const variant = t.sections.hero;

  /* ── Collage Quad (Monolith) — 4-image B&W mosaic + headline + pill CTA ── */
  if (variant === 'collage-quad') {
    const tiles: string[] = (t.extras?.heroQuad as string[] | undefined) || [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80',
      'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=1200&q=80',
    ];
    const headline: string = t.extras?.heroHeadline || 'Witness to rare moments';
    const ctaLabel: string = t.extras?.heroCta || 'View the Work';

    return (
      <section
        className="relative w-full overflow-hidden"
        style={{ minHeight: '92vh', backgroundColor: t.colors.bg }}
      >
        {/* 2x2 image grid */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {tiles.slice(0, 4).map((src, i) => (
            <div key={i} className="relative overflow-hidden">
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: 'grayscale(100%) contrast(1.05)' }} loading="lazy" decoding="async" />
            </div>
          ))}
        </div>

        {/* Subtle global darken so text reads */}
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.32)' }} />

        {/* Centered headline + CTA */}
        <div className="relative z-10 flex h-full min-h-[92vh] flex-col items-center justify-center px-6 text-center">
          <h1
            style={{
              fontFamily: t.fonts.display,
              fontSize: 'clamp(38px, 8vw, 72px)',
              fontWeight: 400,
              fontStyle: 'normal',
              letterSpacing: '-0.005em',
              color: '#FFFFFF',
              lineHeight: 1.1,
              maxWidth: 880,
            }}
          >
            {headline}
          </h1>

          <a
            href="#portfolio"
            className="inline-flex items-center justify-center transition-opacity hover:opacity-80"
            style={{
              marginTop: 36,
              fontFamily: t.fonts.ui,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase' as const,
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.55)',
              borderRadius: 999,
              padding: '14px 36px',
              textDecoration: 'none',
              backdropFilter: 'blur(2px)',
            }}
          >
            {ctaLabel}
          </a>
        </div>
      </section>
    );
  }

  /* ── Centered (Reverie, Heirloom) ── */
  if (variant === 'centered') {
    return (
      <section className="relative w-full overflow-hidden" style={{ height: '100vh', minHeight: 500 }}>
        <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
        {/* Film grain for Heirloom */}
        {t.id === 'heirloom' && (
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          }} />
        )}
        {/* Heirloom border frame */}
        {t.id === 'heirloom' && (
          <div
            className="absolute pointer-events-none"
            style={{
              inset: t.extras.heroFrameInset,
              border: t.extras.heroFrameBorder,
            }}
          />
        )}
        {/* Warm overlay */}
        {t.extras.heroOverlay && (
          <div className="absolute inset-0" style={{ backgroundColor: t.extras.heroOverlay }} />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          {/* Year (Heirloom) */}
          {t.id === 'heirloom' && t.extras.yearEstablished && (
            <p style={{
              fontFamily: t.fonts.ui,
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'white',
              marginBottom: 12,
            }}>
              Est. {t.extras.yearEstablished}
            </p>
          )}
          <h1 style={{
            fontFamily: t.fonts.display,
            fontSize: 'clamp(42px, 8vw, 72px)',
            fontWeight: t.fonts.displayWeight,
            fontStyle: t.fonts.displayStyle,
            letterSpacing: '-0.01em',
            color: 'white',
            lineHeight: 1.1,
          }}>
            {studioName}
          </h1>
          <p style={{
            fontFamily: t.fonts.ui,
            fontSize: 13,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'white',
            marginTop: 16,
          }}>
            {tagline}
          </p>
          {t.id === 'reverie' && (
            <div style={{
              width: 40,
              height: 1,
              backgroundColor: t.colors.accent,
              marginTop: 24,
            }} />
          )}
        </div>
        {/* Scroll indicator */}
        {t.id === 'reverie' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="w-px h-8 bg-white/40 skeleton-block" />
          </div>
        )}
      </section>
    );
  }

  /* ── Split Left (Linen) ── */
  if (variant === 'split-left') {
    return (
      <section className="w-full flex flex-col sm:flex-row" style={{ minHeight: '100vh' }}>
        <div className="sm:hidden w-full" style={{ height: '50vh' }}>
          <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
        </div>
        <div
          className="flex flex-col justify-center px-8 sm:px-12 py-16 sm:w-1/2"
          style={{ backgroundColor: t.colors.heroBg }}
        >
          <h1 style={{
            fontFamily: t.fonts.display,
            fontSize: 'clamp(40px, 5vw, 58px)',
            fontWeight: t.fonts.displayWeight,
            color: t.colors.heroText,
            lineHeight: 1.1,
          }}>
            {studioName}
          </h1>
          <p style={{
            fontFamily: t.fonts.ui,
            fontSize: 13,
            color: t.colors.textSecondary,
            letterSpacing: '0.1em',
            marginTop: 20,
          }}>
            {tagline}
          </p>
          <a
            href="#portfolio"
            className="mt-8 inline-block transition-opacity hover:opacity-60"
            style={{
              fontFamily: t.fonts.ui,
              fontSize: 12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: t.colors.text,
              textDecoration: 'underline',
              textUnderlineOffset: 4,
            }}
          >
            View Work
          </a>
        </div>
        <div className="hidden sm:block sm:w-1/2">
          <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
        </div>
      </section>
    );
  }

  /* ── Split Right (Alabaster) ── */
  if (variant === 'split-right') {
    return (
      <section className="w-full flex flex-col sm:flex-row" style={{ minHeight: '100vh' }}>
        <div
          className="flex flex-col justify-center px-8 sm:px-12 py-16 sm:w-[35%]"
          style={{ backgroundColor: t.colors.heroBg }}
        >
          <h1 style={{
            fontFamily: t.fonts.display,
            fontSize: 'clamp(48px, 6vw, 72px)',
            fontWeight: '300',
            color: t.colors.heroText,
            lineHeight: 0.95,
          }}>
            {studioName.split(' ').map((word, i) => (
              <span key={i} className="block">{word}</span>
            ))}
          </h1>
          <p style={{
            fontFamily: t.fonts.ui,
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: t.colors.textSecondary,
            marginTop: 32,
            fontWeight: '300',
          }}>
            {tagline}
          </p>
          <div style={{
            width: '100%',
            height: 1,
            backgroundColor: t.colors.border,
            marginTop: 24,
          }} />
        </div>
        <div className="sm:w-[65%]" style={{ minHeight: '50vh' }}>
          <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
        </div>
      </section>
    );
  }

  /* ── Bottom Left (Vesper) ── */
  return (
    <section className="relative w-full overflow-hidden" style={{ height: '100vh', minHeight: 500 }}>
      <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
      <div
        className="absolute inset-0"
        style={{
          background: t.extras.heroOverlay || 'linear-gradient(to bottom, transparent 40%, rgba(20,14,8,0.4) 100%)',
        }}
      />
      <div className="absolute bottom-16 sm:bottom-20 left-6 sm:left-10">
        <p style={{
          fontFamily: t.fonts.ui,
          fontSize: 12,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'white',
          marginBottom: 12,
        }}>
          {tagline}
        </p>
        <h1 style={{
          fontFamily: t.fonts.display,
          fontSize: 'clamp(44px, 7vw, 64px)',
          fontWeight: t.fonts.displayWeight,
          fontStyle: t.fonts.displayStyle,
          color: 'white',
          lineHeight: 1.1,
        }}>
          {studioName}
        </h1>
      </div>
    </section>
  );
}
