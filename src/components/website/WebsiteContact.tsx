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
  /** Custom heading — falls back to "Get in Touch" */
  heading?: string;
  /** Custom sub-heading */
  subheading?: string;
  /** CTA button label — falls back to "Contact" */
  buttonLabel?: string;
}

export function WebsiteContact({ template, branding, id, contactImageUrl, heading, subheading, buttonLabel }: WebsiteContactProps) {
  const tmpl = getTemplate(template);
  const accent = branding?.studio_accent_color || '#C6A77B';
  const isEditorial = template === 'editorial-luxury';

  const title = heading || 'Get in Touch';
  const sub = subheading || '';
  const cta = buttonLabel || 'Contact';

  if (isEditorial) {
    return (
      <section id={id} className="py-24 sm:py-32 px-6" style={{ backgroundColor: '#F5F0EA' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-6" style={{ color: '#6B6560', fontFamily: '"DM Sans", sans-serif' }}>
            Contact
          </p>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-light italic leading-[1.1]" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#2B2A28' }}>
            {title}
          </h2>
          {sub && (
            <p className="mt-4 text-sm sm:text-base tracking-[0.05em]" style={{ color: '#6B6560', fontFamily: '"DM Sans", sans-serif' }}>
              {sub}
            </p>
          )}
          <div className="mt-8 w-12 h-[1px] mx-auto" style={{ backgroundColor: '#D5CEC5' }} />
          {(branding?.email || branding?.whatsapp) && (
            <div className="flex items-center justify-center gap-6 mt-10">
              {branding?.email && (
                <a href={`mailto:${branding.email}`} className="text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-100" style={{ color: '#2B2A28', opacity: 0.6, fontFamily: '"DM Sans", sans-serif' }}>Email</a>
              )}
              {branding?.whatsapp && (
                <a href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-100" style={{ color: '#2B2A28', opacity: 0.6, fontFamily: '"DM Sans", sans-serif' }}>WhatsApp</a>
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  // Vows Elegance — clean text-based contact, no background image
  return (
    <section id={id} className="py-24 sm:py-32 px-6" style={{ backgroundColor: tmpl.bg }}>
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-6" style={{ color: accent, fontFamily: '"DM Sans", sans-serif' }}>Contact</p>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-light uppercase tracking-[0.06em] leading-[1.1]" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', color: tmpl.text }}>
          {title}
        </h2>
        {sub && (
          <p className="mt-4 text-sm sm:text-base tracking-[0.05em]" style={{ color: tmpl.textSecondary, fontFamily: '"DM Sans", sans-serif' }}>
            {sub}
          </p>
        )}
        <div className="mt-8 w-12 h-[1px] mx-auto" style={{ backgroundColor: accent, opacity: 0.4 }} />
        {(branding?.email || branding?.whatsapp) && (
          <div className="flex items-center justify-center gap-6 mt-10">
            {branding?.whatsapp && (
              <a href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-100" style={{ color: tmpl.text, opacity: 0.6, fontFamily: '"DM Sans", sans-serif' }}>WhatsApp</a>
            )}
            {branding?.email && (
              <a href={`mailto:${branding.email}`} className="text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-100" style={{ color: tmpl.text, opacity: 0.6, fontFamily: '"DM Sans", sans-serif' }}>Email</a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
