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
  heading?: string;
  subheading?: string;
  buttonLabel?: string;
}

function ContactLinks({ email, whatsapp, color, font }: { email?: string | null; whatsapp?: string | null; color: string; font: string }) {
  if (!email && !whatsapp) return null;
  return (
    <div className="flex items-center justify-center gap-6 mt-10">
      {email && (
        <a href={`mailto:${email}`} className="text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-100" style={{ color, opacity: 0.6, fontFamily: font }}>Email</a>
      )}
      {whatsapp && (
        <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-100" style={{ color, opacity: 0.6, fontFamily: font }}>WhatsApp</a>
      )}
    </div>
  );
}

export function WebsiteContact({ template, branding, id, heading, subheading }: WebsiteContactProps) {
  const tmpl = getTemplate(template);
  const accent = branding?.studio_accent_color || '#C6A77B';
  const title = heading || 'Get in Touch';
  const sub = subheading || '';

  // ── Clean Minimal ──
  if (template === 'clean-minimal') {
    return (
      <section id={id} className="py-24 sm:py-32 px-6" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] mb-6" style={{ color: '#999', fontFamily: '"Inter", sans-serif' }}>Contact</p>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-[1.1]" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
            {title}
          </h2>
          {sub && <p className="mt-4 text-sm sm:text-base" style={{ color: '#6B6B6B', fontFamily: '"Inter", sans-serif' }}>{sub}</p>}
          <div className="mt-8 w-12 h-[1px] mx-auto" style={{ backgroundColor: '#1A1A1A', opacity: 0.15 }} />
          <ContactLinks email={branding?.email} whatsapp={branding?.whatsapp} color="#1A1A1A" font='"Inter", sans-serif' />
        </div>
      </section>
    );
  }

  // ── Magazine Editorial ──
  if (template === 'magazine-editorial') {
    return (
      <section id={id} className="py-24 sm:py-32 px-6" style={{ backgroundColor: '#0F0F0F' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-6" style={{ color: 'rgba(237,237,237,0.35)', fontFamily: '"Syne", sans-serif' }}>Inquire</p>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-normal uppercase tracking-[0.04em] leading-[1.1]" style={{ fontFamily: '"Bodoni Moda", "Didot", serif', color: '#EDEDED' }}>
            {title}
          </h2>
          {sub && <p className="mt-4 text-sm sm:text-base" style={{ color: 'rgba(237,237,237,0.5)', fontFamily: '"Syne", sans-serif' }}>{sub}</p>}
          <div className="mt-8 w-16 h-[1px] mx-auto" style={{ backgroundColor: '#EDEDED', opacity: 0.15 }} />
          <ContactLinks email={branding?.email} whatsapp={branding?.whatsapp} color="#EDEDED" font='"Syne", sans-serif' />
        </div>
      </section>
    );
  }

  // ── Warm & Organic ──
  if (template === 'warm-organic') {
    return (
      <section id={id} className="py-24 sm:py-32 px-6" style={{ backgroundColor: '#FAF6F1' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] mb-6" style={{ color: '#8B7D6B', fontFamily: '"Nunito Sans", sans-serif' }}>Say Hello</p>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-[0.01em] leading-[1.1]" style={{ fontFamily: '"Lora", Georgia, serif', color: '#3D3228' }}>
            {title}
          </h2>
          {sub && <p className="mt-4 text-sm sm:text-base" style={{ color: '#8B7D6B', fontFamily: '"Nunito Sans", sans-serif' }}>{sub}</p>}
          <div className="mt-8 w-12 h-[1px] mx-auto" style={{ backgroundColor: '#3D3228', opacity: 0.15 }} />
          <ContactLinks email={branding?.email} whatsapp={branding?.whatsapp} color="#3D3228" font='"Nunito Sans", sans-serif' />
        </div>
      </section>
    );
  }

  // ── Bold Portfolio ──
  if (template === 'bold-portfolio') {
    return (
      <section id={id} className="py-24 sm:py-32 px-6" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] font-semibold mb-6" style={{ color: '#888', fontFamily: '"Space Grotesk", sans-serif' }}>Contact</p>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-normal uppercase leading-[0.9]" style={{ fontFamily: '"Bebas Neue", Impact, sans-serif', color: '#F0F0F0' }}>
            {title}
          </h2>
          {sub && <p className="mt-4 text-sm" style={{ color: 'rgba(240,240,240,0.5)', fontFamily: '"Space Grotesk", sans-serif' }}>{sub}</p>}
          <ContactLinks email={branding?.email} whatsapp={branding?.whatsapp} color="#F0F0F0" font='"Space Grotesk", sans-serif' />
        </div>
      </section>
    );
  }

  // ── Elegant Folio ──
  if (template === 'elegant-folio') {
    return (
      <section id={id} className="py-24 sm:py-32 px-6" style={{ backgroundColor: '#FDFBF8' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] mb-6" style={{ color: '#78716C', fontFamily: '"Outfit", sans-serif' }}>Get in Touch</p>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-[0.03em] leading-[1.1]" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', color: '#1C1917' }}>
            {title}
          </h2>
          {sub && <p className="mt-4 text-sm sm:text-base" style={{ color: '#78716C', fontFamily: '"Outfit", sans-serif' }}>{sub}</p>}
          <div className="mt-8 w-12 h-[1px] mx-auto" style={{ backgroundColor: '#78716C', opacity: 0.3 }} />
          <ContactLinks email={branding?.email} whatsapp={branding?.whatsapp} color="#1C1917" font='"Outfit", sans-serif' />
        </div>
      </section>
    );
  }

  // ── Starter One ──
  if (template === 'starter-one') {
    return (
      <section id={id} className="py-20 sm:py-28 px-6" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3" style={{ fontFamily: '"Inter", system-ui, sans-serif', color: '#111111' }}>
            {title}
          </h2>
          {sub && <p className="text-sm mb-6" style={{ color: '#6B7280', fontFamily: '"Inter", system-ui, sans-serif' }}>{sub}</p>}
          <ContactLinks email={branding?.email} whatsapp={branding?.whatsapp} color="#111111" font='"Inter", system-ui, sans-serif' />
        </div>
      </section>
    );
  }

  // ── Noir Starter ──
  if (template === 'noir-starter') {
    return (
      <section id={id} className="py-24 sm:py-32 px-6" style={{ backgroundColor: '#0D0D0D' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] mb-6" style={{ color: '#7A756E', fontFamily: '"Manrope", sans-serif' }}>Inquire</p>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-normal tracking-[0.02em] leading-[1.1]" style={{ fontFamily: '"Prata", Georgia, serif', color: '#E8E4DF' }}>
            {title}
          </h2>
          {sub && <p className="mt-4 text-sm sm:text-base" style={{ color: 'rgba(232,228,223,0.5)', fontFamily: '"Manrope", sans-serif' }}>{sub}</p>}
          <div className="mt-8 w-12 h-[1px] mx-auto" style={{ backgroundColor: '#E8E4DF', opacity: 0.15 }} />
          <ContactLinks email={branding?.email} whatsapp={branding?.whatsapp} color="#E8E4DF" font='"Manrope", sans-serif' />
        </div>
      </section>
    );
  }

  // ── Editorial Luxury ──
  if (template === 'editorial-luxury') {
    return (
      <section id={id} className="py-24 sm:py-32 px-6" style={{ backgroundColor: '#F5F0EA' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-6" style={{ color: '#6B6560', fontFamily: '"DM Sans", sans-serif' }}>Contact</p>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-light italic leading-[1.1]" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#2B2A28' }}>
            {title}
          </h2>
          {sub && <p className="mt-4 text-sm sm:text-base tracking-[0.05em]" style={{ color: '#6B6560', fontFamily: '"DM Sans", sans-serif' }}>{sub}</p>}
          <div className="mt-8 w-12 h-[1px] mx-auto" style={{ backgroundColor: '#D5CEC5' }} />
          <ContactLinks email={branding?.email} whatsapp={branding?.whatsapp} color="#2B2A28" font='"DM Sans", sans-serif' />
        </div>
      </section>
    );
  }

  // ── Vows Elegance (default) ──
  return (
    <section id={id} className="py-24 sm:py-32 px-6" style={{ backgroundColor: tmpl.bg }}>
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-6" style={{ color: accent, fontFamily: '"DM Sans", sans-serif' }}>Contact</p>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-light uppercase tracking-[0.06em] leading-[1.1]" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', color: tmpl.text }}>
          {title}
        </h2>
        {sub && <p className="mt-4 text-sm sm:text-base tracking-[0.05em]" style={{ color: tmpl.textSecondary, fontFamily: '"DM Sans", sans-serif' }}>{sub}</p>}
        <div className="mt-8 w-12 h-[1px] mx-auto" style={{ backgroundColor: accent, opacity: 0.4 }} />
        <ContactLinks email={branding?.email} whatsapp={branding?.whatsapp} color={tmpl.text} font='"DM Sans", sans-serif' />
      </div>
    </section>
  );
}