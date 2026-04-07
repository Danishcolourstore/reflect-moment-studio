import { type TemplateConfig } from '@/lib/website-templates';

interface AboutSectionProps {
  template: TemplateConfig;
  heading?: string;
  body?: string;
  portraitImage?: string;
  id?: string;
}

const PORTRAIT = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80';

export function AboutSection({ template, heading = 'About', body, portraitImage, id }: AboutSectionProps) {
  const t = template;
  const img = portraitImage || PORTRAIT;
  const variant = t.sections.about;
  const defaultBody = body || "We believe in capturing the real moments - the stolen glances, the quiet laughter, the tears of joy. Our approach is documentary at heart but editorial in execution. Every wedding tells a story, and we are here to tell yours beautifully.";

  /* ── Two Column (Reverie, Vesper) ── */
  if (variant === 'two-col') {
    const isVesper = t.id === 'vesper';
    return (
      <section id={id} className="py-20 sm:py-32 px-6 sm:px-10" style={{ backgroundColor: t.colors.bg }}>
        {/* Vesper pull quote */}
        {isVesper && (
          <div className="max-w-3xl mx-auto text-center mb-20">
            <p style={{
              fontFamily: t.fonts.display,
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontStyle: 'italic',
              color: t.colors.text,
              lineHeight: 1.6,
            }}>
              "Every love story deserves to be remembered in its most beautiful light."
            </p>
          </div>
        )}
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-10 sm:gap-16">
          <div className="sm:w-[55%]">
            <div className="relative">
              <img
                src={img}
                alt="Photographer portrait"
                className="w-full object-cover"
                style={{
                  filter: isVesper ? t.extras.imageFilter : undefined,
                  maxHeight: 600,
                }}
              />
              {t.id === 'reverie' && (
                <div
                  className="absolute right-0 top-4 bottom-4"
                  style={{ width: 4, backgroundColor: t.colors.accent }}
                />
              )}
            </div>
          </div>
          <div className="sm:w-[45%] flex flex-col justify-center">
            {t.id === 'reverie' && (
              <div style={{ width: 60, height: 1, backgroundColor: t.colors.accent, marginBottom: 24 }} />
            )}
            <h2 style={{
              fontFamily: t.fonts.display,
              fontSize: 42,
              fontWeight: t.fonts.displayWeight,
              fontStyle: t.fonts.displayStyle,
              color: t.colors.text,
              marginBottom: 20,
            }}>
              {heading}
            </h2>
            <p style={{
              fontFamily: t.fonts.ui,
              fontSize: 15,
              lineHeight: 1.8,
              color: t.colors.textSecondary,
            }}>
              {defaultBody}
            </p>
          </div>
        </div>
      </section>
    );
  }

  /* ── Full Width Image (Linen, Heirloom) ── */
  if (variant === 'full-width-image') {
    return (
      <section id={id} style={{ backgroundColor: t.colors.bg }}>
        <div className="w-full" style={{ height: '60vh', minHeight: 300 }}>
          <img
            src={img}
            alt="About"
            className="w-full h-full object-cover"
            style={{ filter: t.extras.imageFilter }}
          />
          {t.id === 'heirloom' && (
            <p className="text-center mt-3" style={{
              fontFamily: t.fonts.ui,
              fontSize: 11,
              fontStyle: 'italic',
              color: t.colors.textSecondary,
            }}>
              In our studio, every frame tells a story
            </p>
          )}
        </div>
        <div className="max-w-[560px] mx-auto text-center px-6 py-16 sm:py-24">
          <h2 style={{
            fontFamily: t.fonts.display,
            fontSize: 42,
            fontWeight: t.fonts.displayWeight,
            fontStyle: t.id === 'heirloom' ? 'italic' : t.fonts.displayStyle,
            color: t.colors.text,
            marginBottom: 20,
          }}>
            {t.id === 'heirloom' ? 'Our Story' : heading}
          </h2>
          <p style={{
            fontFamily: t.fonts.ui,
            fontSize: 15,
            lineHeight: 1.9,
            color: t.colors.textSecondary,
          }}>
            {defaultBody}
          </p>
        </div>
      </section>
    );
  }

  /* ── Typography First (Alabaster) ── */
  return (
    <section id={id} className="py-20 sm:py-32 px-6 sm:px-10" style={{ backgroundColor: t.colors.bg }}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-12">
        <div className="sm:w-1/2 relative flex flex-col justify-center">
          {/* Watermark letter */}
          <span
            className="absolute pointer-events-none select-none"
            style={{
              fontFamily: t.fonts.display,
              fontSize: 'clamp(120px, 15vw, 200px)',
              fontWeight: '300',
              color: '#F5F5F5',
              top: -20,
              left: -10,
              lineHeight: 1,
            }}
          >
            A
          </span>
          <h2
            className="relative"
            style={{
              fontFamily: t.fonts.display,
              fontSize: 38,
              fontWeight: '300',
              color: t.colors.text,
              marginBottom: 24,
            }}
          >
            {heading}
          </h2>
          <p
            className="relative"
            style={{
              fontFamily: t.fonts.ui,
              fontSize: 14,
              fontWeight: '300',
              lineHeight: 2.0,
              color: t.colors.textSecondary,
              maxWidth: 480,
            }}
          >
            {defaultBody}
          </p>
        </div>
        <div className="sm:w-1/2">
          <img src={img} alt="About" className="w-full object-cover" style={{ maxHeight: 600 }} />
        </div>
      </div>
    </section>
  );
}
