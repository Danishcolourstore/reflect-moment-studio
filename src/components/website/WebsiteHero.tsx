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

  const t = getTemplate(template || 'vows-elegance');
  const studioName = branding.studio_name || 'Studio';
  const tagline = branding.display_name || '';
  const coverUrl = branding.cover_url || null;
  const btnLabel = branding.hero_button_label;
  const btnUrl = branding.hero_button_url;

  return (
    <section id={id} className="relative" style={{ height: '100vh', minHeight: '700px' }}>
      {/* Background image with slow zoom */}
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

      {/* Top nav overlay */}
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

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
        {/* Tagline above - smaller subtitle */}
        {tagline && (
          <p
            className="text-base sm:text-lg lg:text-xl tracking-[0.25em] uppercase font-light mb-6 sm:mb-8"
            style={{ color: '#F2EDE4', opacity: 0.75, fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            {tagline}
          </p>
        )}

        {/* Main title - very large dramatic display */}
        <h1
          className="text-[clamp(2.5rem,8vw,8rem)] font-light uppercase tracking-[0.08em] leading-[0.95]"
          style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', color: '#F2EDE4' }}
        >
          {studioName}
        </h1>

        {/* CTA button - elegant outlined pill */}
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

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 opacity-30 animate-bounce">
        <ChevronDown className="h-5 w-5" style={{ color: '#F2EDE4' }} />
      </div>

      <style>{`@keyframes vowsHeroZoom { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }`}</style>
    </section>
  );
}
