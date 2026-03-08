import { ChevronDown } from 'lucide-react';
import { getTemplate } from '@/lib/website-templates';

interface StudioBranding {
  studio_name: string;
  studio_logo_url: string | null;
  studio_accent_color: string | null;
  display_name?: string | null;
  cover_url?: string | null;
  hero_button_label?: string | null;
  hero_button_url?: string | null;
}

interface WebsiteHeroProps {
  branding: StudioBranding | null;
  id?: string;
  template?: string;
}

export function WebsiteHero({ branding, id, template }: WebsiteHeroProps) {
  if (!branding) return null;

  const t = getTemplate(template || 'vows-elegance');
  const studioName = branding.studio_name || 'Studio';
  const tagline = branding.display_name || '';
  const coverUrl = branding.cover_url || null;
  const btnLabel = branding.hero_button_label;
  const btnUrl = branding.hero_button_url;
  const isEditorial = template === 'editorial-luxury';

  if (isEditorial) {
    return (
      <section id={id} style={{ backgroundColor: '#F5F0EA' }}>
        {/* Editorial nav bar */}
        <nav className="flex items-center justify-between px-6 sm:px-12 py-5" style={{ borderBottom: '1px solid #D5CEC5' }}>
          {branding.studio_logo_url ? (
            <img src={branding.studio_logo_url} alt="" className="h-10 sm:h-12 object-contain" loading="eager" />
          ) : (
            <span
              className="text-sm sm:text-base tracking-[0.15em] font-light"
              style={{ color: '#2B2A28', fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              {studioName}
            </span>
          )}
          <div className="hidden sm:flex items-center gap-8">
            {['Home', 'About', 'Gallery', 'Experience', 'Journal', 'Inquire'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-[10px] uppercase tracking-[0.2em] font-normal transition-opacity hover:opacity-100"
                style={{ color: '#6B6560', fontFamily: '"DM Sans", sans-serif' }}
              >
                {item}
              </a>
            ))}
          </div>
        </nav>

        {/* Hero image */}
        <div className="relative" style={{ minHeight: '75vh' }}>
          {coverUrl ? (
            <div className="w-full px-4 sm:px-8 pt-6 sm:pt-8">
              <div className="relative overflow-hidden" style={{ height: 'calc(75vh - 80px)' }}>
                <img
                  src={coverUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="eager"
                />
                {/* Title overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-14"
                  style={{ background: 'linear-gradient(to top, rgba(43,42,40,0.6) 0%, transparent 100%)' }}>
                  <h1
                    className="text-3xl sm:text-5xl lg:text-7xl font-light tracking-[0.04em] leading-[1.1]"
                    style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F5F0EA' }}
                  >
                    {studioName}
                  </h1>
                  {tagline && (
                    <p
                      className="text-xs sm:text-sm tracking-[0.2em] uppercase font-light mt-3"
                      style={{ color: '#F5F0EA', opacity: 0.8, fontFamily: '"DM Sans", sans-serif' }}
                    >
                      {tagline}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
              <h1
                className="text-4xl sm:text-6xl lg:text-8xl font-light tracking-[0.04em]"
                style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#2B2A28' }}
              >
                {studioName}
              </h1>
              {tagline && (
                <p className="text-xs sm:text-sm tracking-[0.25em] uppercase mt-4" style={{ color: '#6B6560' }}>
                  {tagline}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Scroll hint */}
        <div className="flex justify-center py-6 opacity-30 animate-bounce">
          <ChevronDown className="h-5 w-5" style={{ color: '#2B2A28' }} />
        </div>
      </section>
    );
  }

  // ── Vows Elegance (dark cinematic) ──
  return (
    <section id={id} className="relative" style={{ height: '100vh', minHeight: '700px' }}>
      {coverUrl ? (
        <>
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={coverUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
              style={{ animation: 'vowsHeroZoom 30s ease-in-out infinite alternate' }}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(12,10,7,0.30) 0%, rgba(12,10,7,0.10) 25%, rgba(12,10,7,0.15) 50%, rgba(12,10,7,0.55) 80%, rgba(12,10,7,0.80) 100%)',
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: '#0C0A07' }} />
      )}

      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 sm:px-12 py-6">
        {branding.studio_logo_url ? (
          <img src={branding.studio_logo_url} alt="" className="h-12 sm:h-14 object-contain opacity-90" loading="eager" />
        ) : (
          <span
            className="text-xs sm:text-sm uppercase tracking-[0.3em] font-light"
            style={{ color: '#F2EDE4', opacity: 0.8, fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            {studioName}
          </span>
        )}
        <nav className="hidden sm:flex items-center gap-8">
          {['Home', 'About Us', 'Gallery', 'Contact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
              className="text-[11px] uppercase tracking-[0.2em] font-light transition-opacity hover:opacity-100"
              style={{ color: '#F2EDE4', opacity: 0.7, fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              {item}
            </a>
          ))}
        </nav>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
        {tagline && (
          <p
            className="text-base sm:text-lg lg:text-xl tracking-[0.25em] uppercase font-light mb-6 sm:mb-8"
            style={{ color: '#F2EDE4', opacity: 0.75, fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            {tagline}
          </p>
        )}
        <h1
          className="text-[clamp(2.5rem,8vw,8rem)] font-light uppercase tracking-[0.08em] leading-[0.95]"
          style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', color: '#F2EDE4' }}
        >
          {studioName}
        </h1>
        {btnLabel && (
          <a href={btnUrl || '#contact'} className="mt-10 sm:mt-14 inline-block">
            <button
              className="h-14 sm:h-16 px-12 sm:px-16 text-[11px] sm:text-xs uppercase tracking-[0.3em] border border-white/30 rounded-full transition-all duration-500 hover:bg-white/10 hover:border-white/50"
              style={{ color: '#F2EDE4', backgroundColor: 'transparent' }}
            >
              {btnLabel}
            </button>
          </a>
        )}
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 opacity-30 animate-bounce">
        <ChevronDown className="h-5 w-5" style={{ color: '#F2EDE4' }} />
      </div>

      <style>{`@keyframes vowsHeroZoom { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }`}</style>
    </section>
  );
}
