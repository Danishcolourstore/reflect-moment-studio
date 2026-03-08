import { Button } from '@/components/ui/button';
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

  const t = getTemplate(template || 'dark-portfolio');
  const accent = branding.studio_accent_color || '#C6A77B';
  const studioName = branding.studio_name || 'Studio';
  const tagline = branding.display_name || '';
  const coverUrl = branding.cover_url || null;
  const btnLabel = branding.hero_button_label;
  const btnUrl = branding.hero_button_url;

  // ── Minimal: split layout, text left, image right ──
  if (t.heroStyle === 'minimal') {
    return (
      <section id={id} className="min-h-[80vh] flex flex-col sm:flex-row" style={{ backgroundColor: t.bg }}>
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 py-16 sm:py-0">
          {branding.studio_logo_url && (
            <img src={branding.studio_logo_url} alt="" className="h-10 object-contain mb-8 self-start opacity-80" loading="eager" />
          )}
          <p className="text-[10px] uppercase tracking-[0.3em] mb-4" style={{ color: t.textSecondary }}>{tagline || 'Photography Studio'}</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-[1.1]" style={{ fontFamily: t.fontFamily, color: t.text }}>
            {studioName}
          </h1>
          <div className="mt-5 w-10 h-[1px]" style={{ backgroundColor: accent }} />
          {btnLabel && (
            <a href={btnUrl || '#portfolio'} className="mt-8 inline-block self-start">
              <Button variant="outline" className="h-11 px-8 text-[11px] uppercase tracking-[0.15em] rounded-sm" style={{ borderColor: t.text, color: t.text }}>
                {btnLabel}
              </Button>
            </a>
          )}
        </div>
        <div className="flex-1 relative min-h-[50vh] sm:min-h-0">
          {coverUrl ? (
            <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="eager" />
          ) : (
            <div className="absolute inset-0" style={{ backgroundColor: t.cardBg }} />
          )}
        </div>
      </section>
    );
  }

  // ── Compact: short hero with text overlay ──
  if (t.heroStyle === 'compact') {
    return (
      <section id={id} className="relative" style={{ height: '50vh', minHeight: '350px', maxHeight: '600px' }}>
        {coverUrl ? (
          <>
            <div className="absolute inset-0"><img src={coverUrl} alt="" className="h-full w-full object-cover" loading="eager" /></div>
            <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${t.bg}ee 0%, ${t.bg}60 50%, ${t.bg}30 100%)` }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: t.bg }} />
        )}
        <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-12 text-center">
          {branding.studio_logo_url && <img src={branding.studio_logo_url} alt="" className="h-10 object-contain mb-4 opacity-80" loading="eager" />}
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ fontFamily: t.fontFamily, color: t.text }}>{studioName}</h1>
          {tagline && <p className="mt-2 text-sm" style={{ color: t.textSecondary }}>{tagline}</p>}
        </div>
      </section>
    );
  }

  // ── Story: full-height with centered editorial text ──
  if (t.heroStyle === 'story') {
    return (
      <section id={id} className="relative" style={{ height: '100vh', minHeight: '600px' }}>
        {coverUrl ? (
          <>
            <div className="absolute inset-0 overflow-hidden">
              <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="eager" style={{ animation: 'heroZoom 25s ease-in-out infinite alternate' }} />
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(28,26,21,0.2) 0%, rgba(28,26,21,0.5) 60%, rgba(28,26,21,0.85) 100%)' }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: t.bg }} />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] mb-6" style={{ color: '#F8F6F1', opacity: 0.6 }}>The story of</p>
          {branding.studio_logo_url && <img src={branding.studio_logo_url} alt="" className="h-16 object-contain mb-6 opacity-90" loading="eager" />}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light italic tracking-wide leading-[1.1]" style={{ fontFamily: t.fontFamily, color: '#F8F6F1' }}>
            {studioName}
          </h1>
          <div className="mt-6 w-16 h-[1px]" style={{ backgroundColor: accent, opacity: 0.6 }} />
          {tagline && <p className="mt-6 text-base sm:text-lg tracking-wide font-light" style={{ color: 'rgba(248,246,241,0.7)', fontFamily: t.uiFontFamily }}>{tagline}</p>}
          {btnLabel && (
            <a href={btnUrl || '#portfolio'} className="mt-10 inline-block">
              <Button variant="outline" className="h-12 px-10 text-[11px] uppercase tracking-[0.18em] rounded-none border" style={{ borderColor: 'rgba(248,246,241,0.3)', color: '#F8F6F1', backgroundColor: 'transparent' }}>
                {btnLabel}
              </Button>
            </a>
          )}
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center opacity-30 animate-bounce">
          <ChevronDown className="h-5 w-5" style={{ color: '#F8F6F1' }} />
        </div>
        <style>{`@keyframes heroZoom { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }`}</style>
      </section>
    );
  }

  // ── Fullscreen: absolute immersion, name barely visible ──
  if (t.heroStyle === 'fullscreen') {
    return (
      <section id={id} className="relative" style={{ height: '100vh', minHeight: '600px' }}>
        {coverUrl ? (
          <>
            <div className="absolute inset-0 overflow-hidden">
              <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover scale-[1.02]" loading="eager" style={{ animation: 'heroZoom 30s ease-in-out infinite alternate' }} />
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%, transparent 70%, rgba(0,0,0,0.3) 100%)' }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: '#000' }} />
        )}
        <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-16 text-center">
          {branding.studio_logo_url && <img src={branding.studio_logo_url} alt="" className="h-12 object-contain mb-4 opacity-70" loading="eager" />}
          <h1 className="text-3xl sm:text-4xl font-light tracking-[0.08em] uppercase" style={{ fontFamily: t.fontFamily, color: '#F5F5F0', opacity: 0.85 }}>
            {studioName}
          </h1>
          {tagline && <p className="mt-3 text-xs tracking-[0.2em] uppercase" style={{ color: accent, opacity: 0.6 }}>{tagline}</p>}
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 opacity-20 animate-bounce">
          <ChevronDown className="h-5 w-5" style={{ color: '#F5F5F0' }} />
        </div>
        <style>{`@keyframes heroZoom { 0% { transform: scale(1.02); } 100% { transform: scale(1.1); } }`}</style>
      </section>
    );
  }

  // ── Vows Elegance: dramatic full-screen with large display text ──
  if (t.heroStyle === 'vows') {
    return (
      <section id={id} className="relative" style={{ height: '100vh', minHeight: '650px' }}>
        {coverUrl ? (
          <>
            <div className="absolute inset-0 overflow-hidden">
              <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="eager" style={{ animation: 'heroZoom 25s ease-in-out infinite alternate' }} />
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(12,10,7,0.25) 0%, rgba(12,10,7,0.15) 30%, rgba(12,10,7,0.3) 60%, rgba(12,10,7,0.7) 100%)' }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: '#0C0A07' }} />
        )}

        {/* Top nav bar overlay */}
        {branding.studio_logo_url && (
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 sm:px-10 py-5">
            <img src={branding.studio_logo_url} alt="" className="h-10 sm:h-12 object-contain opacity-80" loading="eager" />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
          {/* Subtitle above */}
          {tagline && (
            <p className="text-sm sm:text-base tracking-[0.25em] uppercase font-light mb-6" style={{ color: '#F2EDE4', opacity: 0.7, fontFamily: '"DM Sans", sans-serif' }}>
              {tagline}
            </p>
          )}
          {/* Large dramatic name */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-light uppercase tracking-[0.06em] leading-[0.95]" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', color: '#F2EDE4' }}>
            {studioName}
          </h1>
          {/* CTA button */}
          {btnLabel && (
            <a href={btnUrl || '#portfolio'} className="mt-10 inline-block">
              <button
                className="h-12 sm:h-14 px-10 sm:px-14 text-[11px] sm:text-xs uppercase tracking-[0.25em] border rounded-none transition-all duration-300 hover:bg-white/10"
                style={{ borderColor: 'rgba(242,237,228,0.35)', color: '#F2EDE4', backgroundColor: 'transparent' }}
              >
                {btnLabel}
              </button>
            </a>
          )}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 opacity-25 animate-bounce">
          <ChevronDown className="h-5 w-5" style={{ color: '#F2EDE4' }} />
        </div>
        <style>{`@keyframes heroZoom { 0% { transform: scale(1); } 100% { transform: scale(1.06); } }`}</style>
      </section>
    );
  }

  // ── Default: Cinematic / Wedding / Editorial (dark immersive) ──
  return (
    <section id={id} className="relative" style={{ height: '100vh', minHeight: '600px', maxHeight: '1200px' }}>
      {coverUrl ? (
        <>
          <div className="absolute inset-0 overflow-hidden">
            <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover scale-105" loading="eager" style={{ animation: 'heroZoom 20s ease-in-out infinite alternate' }} />
          </div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,9,6,0.92) 0%, rgba(10,9,6,0.4) 35%, rgba(10,9,6,0.15) 60%, rgba(10,9,6,0.3) 100%)' }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: '#0A0906' }} />
      )}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${accent}40, transparent)` }} />
      <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-24 sm:pb-28 text-center">
        {branding.studio_logo_url && <img src={branding.studio_logo_url} alt="" className="h-14 sm:h-18 lg:h-20 object-contain mb-8 opacity-85" loading="eager" />}
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] mb-5" style={{ color: accent, opacity: 0.8 }}>Photography Studio</p>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light tracking-[0.04em] leading-[1.05]" style={{ fontFamily: "'Playfair Display', serif", color: '#EDEAE3' }}>
          {studioName}
        </h1>
        <div className="mt-6 mb-5 w-12 h-[1px]" style={{ backgroundColor: accent }} />
        {tagline && <p className="max-w-md text-sm sm:text-base leading-relaxed tracking-wide" style={{ color: 'rgba(237, 234, 227, 0.6)', fontFamily: "'DM Sans', sans-serif" }}>{tagline}</p>}
        {btnLabel && (
          <a href={btnUrl || '#portfolio'} className="mt-10 inline-block">
            <Button variant="outline" className="h-12 px-10 text-[11px] uppercase tracking-[0.18em] rounded-none border transition-all duration-300 hover:scale-[1.02]" style={{ borderColor: accent, color: accent, backgroundColor: 'transparent' }}>
              {btnLabel}
            </Button>
          </a>
        )}
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-40 animate-bounce">
        <ChevronDown className="h-5 w-5" style={{ color: '#EDEAE3' }} />
      </div>
      <style>{`@keyframes heroZoom { 0% { transform: scale(1.05); } 100% { transform: scale(1.15); } }`}</style>
    </section>
  );
}
