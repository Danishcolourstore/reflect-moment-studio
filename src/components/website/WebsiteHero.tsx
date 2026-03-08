import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
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

/* ── Reusable mobile hamburger nav ── */
function MobileNavOverlay({ items, isOpen, onClose, color }: { items: string[]; isOpen: boolean; onClose: () => void; color: string }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] md:hidden animate-in fade-in duration-200" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative flex flex-col items-center justify-center h-full gap-6" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 p-2">
          <X className="h-6 w-6" style={{ color }} />
        </button>
        {items.map(item => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            onClick={onClose}
            className="text-base uppercase tracking-[0.2em] font-light transition-opacity hover:opacity-100"
            style={{ color, opacity: 0.9 }}
          >
            {item}
          </a>
        ))}
      </div>
    </div>
  );
}

export function WebsiteHero({ branding, id, template }: WebsiteHeroProps) {
  if (!branding) return null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const t = getTemplate(template || 'vows-elegance');
  const studioName = branding.studio_name || 'Studio';
  const tagline = branding.display_name || '';
  const coverUrl = branding.cover_url || null;
  const btnLabel = branding.hero_button_label;
  const btnUrl = branding.hero_button_url;
  const isEditorial = template === 'editorial-luxury';
  const isModernGrid = template === 'modern-photography-grid';
  const isCinematic = template === 'cinematic-wedding-story';

  // ── Cinematic Wedding Story Hero ──
  if (isCinematic) {
    const navItems = ['Home', 'About', 'Portfolio', 'Journal', 'Contact'];
    const textColor = coverUrl ? '#FAF8F5' : '#1A1715';
    return (
      <section id={id} className="relative" style={{ minHeight: '100vh' }}>
        {coverUrl ? (
          <>
            <div className="absolute inset-0 overflow-hidden">
              <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="eager" style={{ animation: 'cinematicZoom 25s ease-in-out infinite alternate' }} />
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(26,23,21,0.15) 0%, rgba(26,23,21,0.05) 30%, rgba(26,23,21,0.3) 70%, rgba(26,23,21,0.65) 100%)' }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: '#FAF8F5' }} />
        )}

        <MobileNavOverlay items={navItems} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} color={textColor} />

        <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-6">
          {branding.studio_logo_url ? (
            <img src={branding.studio_logo_url} alt="" className="h-8 sm:h-10 md:h-12 object-contain" loading="eager" />
          ) : (
            <span className="text-base sm:text-lg md:text-xl tracking-[0.08em] font-light" style={{ color: textColor, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              {studioName}
            </span>
          )}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] uppercase tracking-[0.2em] font-medium transition-opacity hover:opacity-100" style={{ color: textColor, opacity: 0.7, fontFamily: '"DM Sans", sans-serif' }}>
                {item}
              </a>
            ))}
          </div>
          <button className="md:hidden p-2 -mr-2" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" style={{ color: textColor }} />
          </button>
          {btnLabel && (
            <a href={btnUrl || '#contact'} className="hidden md:block">
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: textColor, fontFamily: '"DM Sans", sans-serif' }}>{btnLabel}</span>
            </a>
          )}
        </nav>

        <div className="relative z-10 flex flex-col items-center justify-center h-screen px-6 sm:px-8 text-center">
          {tagline && (
            <p className="text-xs sm:text-sm tracking-[0.3em] uppercase mb-3 sm:mb-4" style={{ color: coverUrl ? 'rgba(250,248,245,0.6)' : '#7A756E', fontFamily: '"DM Sans", sans-serif' }}>
              ( {tagline} )
            </p>
          )}
          <h1 className="text-[clamp(2rem,7vw,7rem)] font-light tracking-[0.03em] leading-[0.95]" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', color: textColor }}>
            {studioName}
          </h1>
        </div>

        <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-10 opacity-30 animate-bounce">
          <ChevronDown className="h-5 w-5" style={{ color: textColor }} />
        </div>
        <style>{`@keyframes cinematicZoom { 0% { transform: scale(1); } 100% { transform: scale(1.06); } }`}</style>
      </section>
    );
  }

  // ── Modern Photography Grid Hero ──
  if (isModernGrid) {
    const navItems = ['Home', 'About', 'Projects', 'Team', 'Clients', 'Blog', 'Contact'];
    return (
      <section id={id} style={{ backgroundColor: '#FFFFFF' }}>
        <MobileNavOverlay items={navItems} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} color="#1A1A1A" />

        <nav className="flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          {branding.studio_logo_url ? (
            <img src={branding.studio_logo_url} alt="" className="h-7 sm:h-8 md:h-10 object-contain" loading="eager" />
          ) : (
            <span className="text-sm sm:text-base font-semibold tracking-[0.02em]" style={{ color: '#1A1A1A', fontFamily: '"DM Sans", sans-serif' }}>
              {studioName}
            </span>
          )}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navItems.map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[11px] uppercase tracking-[0.12em] font-medium transition-opacity hover:opacity-70" style={{ color: '#1A1A1A', fontFamily: '"DM Sans", sans-serif' }}>
                {item}
              </a>
            ))}
          </div>
          <button className="md:hidden p-2 -mr-2" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" style={{ color: '#1A1A1A' }} />
          </button>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-2 lg:order-1 text-center lg:text-left">
              {tagline && (
                <p className="text-[11px] uppercase tracking-[0.25em] font-medium mb-3 sm:mb-4" style={{ color: '#999', fontFamily: '"DM Sans", sans-serif' }}>
                  {tagline}
                </p>
              )}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-[1.1] tracking-tight" style={{ fontFamily: '"DM Sans", sans-serif', color: '#1A1A1A' }}>
                {studioName}
              </h1>
              {(branding as any).bio && (
                <p className="mt-4 sm:mt-6 text-sm leading-relaxed max-w-md mx-auto lg:mx-0" style={{ color: '#6B6B6B' }}>
                  {(branding as any).bio}
                </p>
              )}
              {btnLabel && (
                <a href={btnUrl || '#portfolio'} className="mt-6 sm:mt-8 inline-block">
                  <button className="h-11 sm:h-12 px-8 sm:px-10 text-[11px] uppercase tracking-[0.2em] font-medium border border-black rounded-full transition-all duration-300 hover:bg-black hover:text-white" style={{ color: '#1A1A1A' }}>
                    {btnLabel}
                  </button>
                </a>
              )}
            </div>
            <div className="order-1 lg:order-2">
              {coverUrl ? (
                <div className="overflow-hidden rounded-sm">
                  <img src={coverUrl} alt="" className="w-full aspect-[4/5] sm:aspect-[4/5] object-cover" loading="eager" />
                </div>
              ) : (
                <div className="w-full aspect-[4/5] rounded-sm flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
                  <span className="text-sm" style={{ color: '#CCC' }}>Upload hero image</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Editorial Luxury ──
  if (isEditorial) {
    const navItems = ['Home', 'About', 'Gallery', 'Experience', 'Journal', 'Inquire'];
    return (
      <section id={id} style={{ backgroundColor: '#F5F0EA' }}>
        <MobileNavOverlay items={navItems} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} color="#2B2A28" />

        <nav className="flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-5" style={{ borderBottom: '1px solid #D5CEC5' }}>
          {branding.studio_logo_url ? (
            <img src={branding.studio_logo_url} alt="" className="h-8 sm:h-10 md:h-12 object-contain" loading="eager" />
          ) : (
            <span className="text-sm sm:text-base tracking-[0.15em] font-light" style={{ color: '#2B2A28', fontFamily: '"Playfair Display", Georgia, serif' }}>
              {studioName}
            </span>
          )}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navItems.map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] uppercase tracking-[0.2em] font-normal transition-opacity hover:opacity-100" style={{ color: '#6B6560', fontFamily: '"DM Sans", sans-serif' }}>
                {item}
              </a>
            ))}
          </div>
          <button className="md:hidden p-2 -mr-2" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" style={{ color: '#2B2A28' }} />
          </button>
        </nav>

        <div className="relative" style={{ minHeight: '60vh' }}>
          {coverUrl ? (
            <div className="w-full px-3 sm:px-4 md:px-8 pt-4 sm:pt-6 md:pt-8">
              <div className="relative overflow-hidden" style={{ height: 'clamp(300px, 60vh, calc(75vh - 80px))' }}>
                <img src={coverUrl} alt="" className="h-full w-full object-cover" loading="eager" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 md:p-14" style={{ background: 'linear-gradient(to top, rgba(43,42,40,0.6) 0%, transparent 100%)' }}>
                  <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-light tracking-[0.04em] leading-[1.1]" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#F5F0EA' }}>
                    {studioName}
                  </h1>
                  {tagline && (
                    <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-light mt-2 sm:mt-3" style={{ color: '#F5F0EA', opacity: 0.8, fontFamily: '"DM Sans", sans-serif' }}>
                      {tagline}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 sm:py-32 px-6 text-center">
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-light tracking-[0.04em]" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#2B2A28' }}>
                {studioName}
              </h1>
              {tagline && (
                <p className="text-xs sm:text-sm tracking-[0.25em] uppercase mt-3 sm:mt-4" style={{ color: '#6B6560' }}>{tagline}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-center py-4 sm:py-6 opacity-30 animate-bounce">
          <ChevronDown className="h-5 w-5" style={{ color: '#2B2A28' }} />
        </div>
      </section>
    );
  }

  // ── Vows Elegance (dark cinematic) ──
  const vowsNavItems = ['Home', 'About Us', 'Gallery', 'Contact'];
  const vowsTextColor = '#F2EDE4';
  return (
    <section id={id} className="relative" style={{ height: '100vh', minHeight: '600px' }}>
      {coverUrl ? (
        <>
          <div className="absolute inset-0 overflow-hidden">
            <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="eager" style={{ animation: 'vowsHeroZoom 30s ease-in-out infinite alternate' }} />
          </div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(12,10,7,0.30) 0%, rgba(12,10,7,0.10) 25%, rgba(12,10,7,0.15) 50%, rgba(12,10,7,0.55) 80%, rgba(12,10,7,0.80) 100%)' }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: '#0C0A07' }} />
      )}

      <MobileNavOverlay items={vowsNavItems} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} color={vowsTextColor} />

      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-6">
        {branding.studio_logo_url ? (
          <img src={branding.studio_logo_url} alt="" className="h-10 sm:h-12 md:h-14 object-contain opacity-90" loading="eager" />
        ) : (
          <span className="text-xs sm:text-sm uppercase tracking-[0.3em] font-light" style={{ color: vowsTextColor, opacity: 0.8, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            {studioName}
          </span>
        )}
        <nav className="hidden md:flex items-center gap-8">
          {vowsNavItems.map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} className="text-[11px] uppercase tracking-[0.2em] font-light transition-opacity hover:opacity-100" style={{ color: vowsTextColor, opacity: 0.7, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              {item}
            </a>
          ))}
        </nav>
        <button className="md:hidden p-2 -mr-2" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
          <Menu className="h-5 w-5" style={{ color: vowsTextColor }} />
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 text-center">
        {tagline && (
          <p className="text-sm sm:text-base md:text-lg lg:text-xl tracking-[0.25em] uppercase font-light mb-4 sm:mb-6 md:mb-8" style={{ color: vowsTextColor, opacity: 0.75, fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            {tagline}
          </p>
        )}
        <h1 className="text-[clamp(2rem,8vw,8rem)] font-light uppercase tracking-[0.08em] leading-[0.95]" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', color: vowsTextColor }}>
          {studioName}
        </h1>
        {btnLabel && (
          <a href={btnUrl || '#contact'} className="mt-8 sm:mt-10 md:mt-14 inline-block">
            <button className="h-12 sm:h-14 md:h-16 px-8 sm:px-12 md:px-16 text-[10px] sm:text-[11px] md:text-xs uppercase tracking-[0.3em] border border-white/30 rounded-full transition-all duration-500 hover:bg-white/10 hover:border-white/50" style={{ color: vowsTextColor, backgroundColor: 'transparent' }}>
              {btnLabel}
            </button>
          </a>
        )}
      </div>

      <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-10 opacity-30 animate-bounce">
        <ChevronDown className="h-5 w-5" style={{ color: vowsTextColor }} />
      </div>
      <style>{`@keyframes vowsHeroZoom { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }`}</style>
    </section>
  );
}
