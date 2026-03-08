import { getTemplate } from '@/lib/website-templates';

interface WebsiteContactProps {
  template: string;
  branding: {
    studio_name: string;
    studio_accent_color: string | null;
    email?: string | null;
    whatsapp?: string | null;
    website?: string | null;
  } | null;
  photographerId?: string;
  id?: string;
  contactImageUrl?: string;
}

/**
 * "LET'S CONNECT" / "TRUST THROUGH EXCELLENCE" contact section.
 * Matches the reference: background image, large serif text, CTA button.
 */
export function WebsiteContact({ template, branding, id, contactImageUrl }: WebsiteContactProps) {
  const tmpl = getTemplate(template);
  const accent = branding?.studio_accent_color || '#C6A77B';
  const bgImage = contactImageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80';

  return (
    <section id={id} className="relative" style={{ minHeight: '70vh' }}>
      {/* Background image */}
      <div className="absolute inset-0 overflow-hidden">
        <img src={bgImage} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, ${tmpl.bg}CC 0%, ${tmpl.bg}88 30%, ${tmpl.bg}BB 70%, ${tmpl.bg}EE 100%)` }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-6 text-center py-24">
        <p
          className="text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-6"
          style={{ color: accent, fontFamily: '"DM Sans", sans-serif' }}
        >
          Let's Connect
        </p>

        <h2
          className="text-3xl sm:text-5xl lg:text-6xl font-light uppercase tracking-[0.06em] leading-[1.1] mb-2"
          style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', color: tmpl.text }}
        >
          Trust Through
        </h2>
        <h2
          className="text-4xl sm:text-6xl lg:text-7xl font-light italic tracking-wide"
          style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', color: tmpl.text }}
        >
          Excellence
        </h2>

        <div className="mt-8 w-12 h-[1px]" style={{ backgroundColor: accent, opacity: 0.4 }} />

        {/* CTA */}
        <a href="#contact-form" className="mt-10 inline-block">
          <button
            className="h-14 px-14 text-[11px] uppercase tracking-[0.3em] border rounded-full transition-all duration-500 hover:bg-white/10 hover:border-white/50"
            style={{ borderColor: 'rgba(242,237,228,0.35)', color: '#F2EDE4', backgroundColor: 'transparent' }}
          >
            Get Quote
          </button>
        </a>

        {/* Quick contact links */}
        {(branding?.email || branding?.whatsapp) && (
          <div className="flex items-center gap-6 mt-10">
            {branding?.whatsapp && (
              <a
                href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-100"
                style={{ color: tmpl.text, opacity: 0.6, fontFamily: '"DM Sans", sans-serif' }}
              >
                WhatsApp
              </a>
            )}
            {branding?.email && (
              <a
                href={`mailto:${branding.email}`}
                className="text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-100"
                style={{ color: tmpl.text, opacity: 0.6, fontFamily: '"DM Sans", sans-serif' }}
              >
                Email
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
