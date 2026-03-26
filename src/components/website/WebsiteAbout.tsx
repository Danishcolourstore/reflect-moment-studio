import { Instagram, Globe, MessageCircle } from 'lucide-react';
import { getTemplate } from '@/lib/website-templates';

interface StudioBranding {
  studio_name: string;
  studio_logo_url: string | null;
  studio_accent_color: string | null;
  bio?: string | null;
  display_name?: string | null;
  instagram?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  cover_url?: string | null;
  about_image_url?: string | null;
}

interface WebsiteAboutProps {
  template: string;
  branding: StudioBranding | null;
  id?: string;
}

/* Social links helper */
function SocialLinks({ branding, color, className = '' }: { branding: StudioBranding; color: string; className?: string }) {
  return (
    <div className={`flex items-center gap-5 ${className}`}>
      {branding.instagram && (
        <a href={`https://instagram.com/${branding.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] hover:opacity-100 opacity-60 transition-opacity duration-300"
          style={{ color }}>
          <Instagram className="h-4 w-4" /> Instagram
        </a>
      )}
      {branding.website && (
        <a href={branding.website.startsWith('http') ? branding.website : `https://${branding.website}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] hover:opacity-100 opacity-60 transition-opacity duration-300"
          style={{ color }}>
          <Globe className="h-4 w-4" /> Website
        </a>
      )}
      {branding.whatsapp && (
        <a href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] hover:opacity-100 opacity-50 transition-opacity duration-300"
          style={{ color }}>
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
      )}
    </div>
  );
}

function getAboutImage(branding: StudioBranding) {
  return (branding as any).about_image_url || branding.cover_url || null;
}

export function WebsiteAbout({ template, branding, id }: WebsiteAboutProps) {
  if (!branding?.bio) return null;

  const tmpl = getTemplate(template);
  const accent = branding.studio_accent_color || '#C6A77B';
  const bioParagraphs = branding.bio.split('\n').filter(p => p.trim());
  const aboutImg = getAboutImage(branding);

  // ── Clean Minimal ──
  if (template === 'clean-minimal') {
    return (
      <section id={id} style={{ backgroundColor: '#FFFFFF' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[70vh]">
          <div className="relative overflow-hidden min-h-[400px] lg:min-h-0">
            {aboutImg ? (
              <img src={aboutImg} alt={branding.studio_name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="absolute inset-0" style={{ backgroundColor: '#F5F5F5' }} />
            )}
          </div>
          <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-16 sm:py-20">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] mb-3" style={{ color: '#999', fontFamily: '"Inter", sans-serif' }}>
              About
            </p>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight mb-8" style={{ color: '#1A1A1A', fontFamily: '"Playfair Display", Georgia, serif' }}>
              {branding.studio_name}
            </h3>
            <div className="space-y-5">
              {bioParagraphs.map((para, i) => (
                <p key={i} className="text-sm sm:text-base leading-[1.9] tracking-wide" style={{ color: '#6B6B6B', fontFamily: '"Inter", sans-serif' }}>
                  {para}
                </p>
              ))}
            </div>
            <SocialLinks branding={branding} color="#1A1A1A" className="mt-10" />
          </div>
        </div>
      </section>
    );
  }

  // ── Magazine Editorial ──
  if (template === 'magazine-editorial') {
    return (
      <section id={id} style={{ backgroundColor: '#0F0F0F' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[70vh]">
          <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-16 sm:py-20 order-2 lg:order-1">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-3" style={{ color: 'rgba(237,237,237,0.4)', fontFamily: '"Syne", sans-serif' }}>
              The Photographer
            </p>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-normal uppercase tracking-[0.04em] mb-8" style={{ color: '#EDEDED', fontFamily: '"Bodoni Moda", "Didot", serif' }}>
              {branding.studio_name}
            </h3>
            <div className="space-y-5">
              {bioParagraphs.map((para, i) => (
                <p key={i} className="text-sm sm:text-base leading-[2] tracking-wide" style={{ color: 'rgba(237,237,237,0.6)', fontFamily: '"Syne", sans-serif' }}>
                  {para}
                </p>
              ))}
            </div>
            <SocialLinks branding={branding} color="#EDEDED" className="mt-10" />
          </div>
          <div className="relative overflow-hidden min-h-[400px] lg:min-h-0 order-1 lg:order-2">
            {aboutImg ? (
              <img src={aboutImg} alt={branding.studio_name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" style={{ filter: 'contrast(1.05) brightness(0.95)' }} />
            ) : (
              <div className="absolute inset-0" style={{ backgroundColor: '#1A1A1A' }} />
            )}
          </div>
        </div>
      </section>
    );
  }

  // ── Warm & Organic ──
  if (template === 'warm-organic') {
    return (
      <section id={id} style={{ backgroundColor: '#FAF6F1' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[70vh]">
          <div className="relative overflow-hidden min-h-[400px] lg:min-h-0">
            {aboutImg ? (
              <div className="absolute inset-0 p-4 sm:p-6 lg:p-10">
                <img src={aboutImg} alt={branding.studio_name} className="h-full w-full object-cover rounded-lg" loading="lazy" />
              </div>
            ) : (
              <div className="absolute inset-0 m-6 rounded-lg" style={{ backgroundColor: '#EDE7DF' }} />
            )}
          </div>
          <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-16 sm:py-20">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] mb-3" style={{ color: '#8B7D6B', fontFamily: '"Nunito Sans", sans-serif' }}>
              About Me
            </p>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-[0.01em] mb-8" style={{ color: '#3D3228', fontFamily: '"Lora", Georgia, serif' }}>
              {branding.studio_name}
            </h3>
            <div className="space-y-5">
              {bioParagraphs.map((para, i) => (
                <p key={i} className="text-sm sm:text-base leading-[2] tracking-wide" style={{ color: '#8B7D6B', fontFamily: '"Nunito Sans", sans-serif' }}>
                  {para}
                </p>
              ))}
            </div>
            <SocialLinks branding={branding} color="#3D3228" className="mt-10" />
          </div>
        </div>
      </section>
    );
  }

  // ── Bold Portfolio ──
  if (template === 'bold-portfolio') {
    return (
      <section id={id} style={{ backgroundColor: '#0A0A0A' }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-12 md:px-20 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 items-center">
            <div className="lg:col-span-2">
              {aboutImg ? (
                <img src={aboutImg} alt={branding.studio_name} className="w-full aspect-[3/4] object-cover" loading="lazy" style={{ filter: 'grayscale(0.1) contrast(1.1)' }} />
              ) : (
                <div className="w-full aspect-[3/4]" style={{ backgroundColor: '#1A1A1A' }} />
              )}
            </div>
            <div className="lg:col-span-3">
              <p className="text-[11px] uppercase tracking-[0.3em] font-semibold mb-4" style={{ color: '#888', fontFamily: '"Space Grotesk", sans-serif' }}>
                About
              </p>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-normal uppercase leading-[0.9] mb-8" style={{ fontFamily: '"Bebas Neue", Impact, sans-serif', color: '#F0F0F0' }}>
                {branding.studio_name}
              </h3>
              <div className="space-y-5">
                {bioParagraphs.map((para, i) => (
                  <p key={i} className="text-sm sm:text-base leading-[1.9]" style={{ color: 'rgba(240,240,240,0.6)', fontFamily: '"Space Grotesk", sans-serif' }}>
                    {para}
                  </p>
                ))}
              </div>
              <SocialLinks branding={branding} color="#F0F0F0" className="mt-10" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Elegant Folio ──
  if (template === 'elegant-folio') {
    return (
      <section id={id} style={{ backgroundColor: '#FDFBF8' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[70vh]">
          <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-16 sm:py-20">
            <div className="w-12 h-[1px] mb-6" style={{ backgroundColor: '#78716C', opacity: 0.3 }} />
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] mb-3" style={{ color: '#78716C', fontFamily: '"Outfit", sans-serif' }}>
              About the Artist
            </p>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-[0.03em] mb-8" style={{ color: '#1C1917', fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              {branding.studio_name}
            </h3>
            <div className="space-y-5">
              {bioParagraphs.map((para, i) => (
                <p key={i} className="text-sm sm:text-base leading-[2] tracking-wide" style={{ color: '#78716C', fontFamily: '"Outfit", sans-serif' }}>
                  {para}
                </p>
              ))}
            </div>
            <SocialLinks branding={branding} color="#1C1917" className="mt-10" />
          </div>
          <div className="relative overflow-hidden min-h-[400px] lg:min-h-0">
            {aboutImg ? (
              <img src={aboutImg} alt={branding.studio_name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="absolute inset-0" style={{ backgroundColor: '#F0EDE8' }} />
            )}
          </div>
        </div>
      </section>
    );
  }

  // ── Starter One ──
  if (template === 'starter-one') {
    return (
      <section id={id} style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto px-6 sm:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              {aboutImg ? (
                <img src={aboutImg} alt={branding.studio_name} className="w-full aspect-[4/5] object-cover rounded-xl" loading="lazy" />
              ) : (
                <div className="w-full aspect-[4/5] rounded-xl" style={{ backgroundColor: '#F3F4F6' }} />
              )}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-4" style={{ color: '#111111', fontFamily: '"Inter", system-ui, sans-serif' }}>
                About {branding.studio_name}
              </h3>
              <div className="space-y-4">
                {bioParagraphs.map((para, i) => (
                  <p key={i} className="text-sm leading-[1.8]" style={{ color: '#6B7280', fontFamily: '"Inter", system-ui, sans-serif' }}>
                    {para}
                  </p>
                ))}
              </div>
              <SocialLinks branding={branding} color="#111111" className="mt-8" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Noir Starter ──
  if (template === 'noir-starter') {
    return (
      <section id={id} style={{ backgroundColor: '#0D0D0D' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[70vh]">
          <div className="relative overflow-hidden min-h-[400px] lg:min-h-0">
            {aboutImg ? (
              <img src={aboutImg} alt={branding.studio_name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" style={{ filter: 'brightness(0.9) contrast(1.05)' }} />
            ) : (
              <div className="absolute inset-0" style={{ backgroundColor: '#1A1A1A' }} />
            )}
          </div>
          <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-16 sm:py-20">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] mb-3" style={{ color: '#7A756E', fontFamily: '"Manrope", sans-serif' }}>
              About
            </p>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-normal tracking-[0.02em] mb-8" style={{ color: '#E8E4DF', fontFamily: '"Prata", Georgia, serif' }}>
              {branding.studio_name}
            </h3>
            <div className="space-y-5">
              {bioParagraphs.map((para, i) => (
                <p key={i} className="text-sm sm:text-base leading-[2] tracking-wide" style={{ color: 'rgba(232,228,223,0.6)', fontFamily: '"Manrope", sans-serif' }}>
                  {para}
                </p>
              ))}
            </div>
            <SocialLinks branding={branding} color="#E8E4DF" className="mt-10" />
          </div>
        </div>
      </section>
    );
  }

  // ── Editorial Luxury ──
  if (template === 'editorial-luxury') {
    const textColor = '#2B2A28';
    const secondaryColor = '#6B6560';
    return (
      <section id={id} style={{ backgroundColor: '#F5F0EA' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[70vh]">
          <div className="relative overflow-hidden min-h-[400px] lg:min-h-0">
            {aboutImg ? (
              <img src={aboutImg} alt={branding.studio_name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="absolute inset-0" style={{ backgroundColor: '#E8E2DA' }} />
            )}
          </div>
          <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-16 sm:py-20">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-3" style={{ color: accent, fontFamily: '"DM Sans", sans-serif' }}>
              About the Photographer
            </p>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light italic mb-8" style={{ color: textColor, fontFamily: '"Playfair Display", Georgia, serif' }}>
              {branding.studio_name}
            </h3>
            <div className="space-y-5">
              {bioParagraphs.map((para, i) => (
                <p key={i} className="text-sm sm:text-base leading-[2] tracking-wide" style={{ color: secondaryColor, fontFamily: '"DM Sans", sans-serif' }}>
                  {para}
                </p>
              ))}
            </div>
            <SocialLinks branding={branding} color={textColor} className="mt-10" />
          </div>
        </div>
      </section>
    );
  }

  // ── Vows Elegance (default) ──
  return (
    <section id={id} style={{ backgroundColor: tmpl.bg }}>
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[70vh]">
        <div className="relative overflow-hidden min-h-[400px] md:min-h-0">
          {branding.cover_url ? (
            <img src={branding.cover_url} alt={branding.studio_name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="absolute inset-0" style={{ backgroundColor: tmpl.cardBg }} />
          )}
        </div>
        <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-16 sm:py-20">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-6" style={{ color: accent, fontFamily: '"DM Sans", sans-serif' }}>
            Your World Our Vision
          </p>
          <p className="text-sm sm:text-base leading-[2] tracking-wide" style={{ color: tmpl.textSecondary, fontFamily: '"DM Sans", sans-serif' }}>
            {bioParagraphs[0] || branding.bio}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[80vh]">
        <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-16 sm:py-20 order-2 md:order-1">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] mb-3" style={{ color: accent, fontFamily: '"DM Sans", sans-serif' }}>Hey I'm</p>
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-light uppercase tracking-[0.06em] mb-8" style={{ color: tmpl.text, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            {branding.studio_name}
          </h3>
          <div className="space-y-5">
            {bioParagraphs.slice(1).map((para, i) => (
              <p key={i} className="text-sm sm:text-base leading-[2] tracking-wide" style={{ color: tmpl.textSecondary, fontFamily: '"DM Sans", sans-serif' }}>
                {para}
              </p>
            ))}
            {bioParagraphs.length <= 1 && (
              <p className="text-sm sm:text-base leading-[2] tracking-wide" style={{ color: tmpl.textSecondary, fontFamily: '"DM Sans", sans-serif' }}>
                {branding.bio}
              </p>
            )}
          </div>
          <SocialLinks branding={branding} color={tmpl.text} className="mt-10" />
          <a href="#about" className="inline-flex items-center mt-8 text-[10px] uppercase tracking-[0.25em] transition-opacity hover:opacity-100" style={{ color: accent, opacity: 0.8, fontFamily: '"DM Sans", sans-serif' }}>
            More About Us →
          </a>
        </div>
        <div className="relative overflow-hidden min-h-[400px] md:min-h-0 order-1 md:order-2">
          {aboutImg ? (
            <img src={aboutImg} alt={branding.studio_name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="absolute inset-0" style={{ backgroundColor: tmpl.cardBg }} />
          )}
        </div>
      </div>
    </section>
  );
}