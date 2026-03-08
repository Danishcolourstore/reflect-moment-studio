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
  const accent = branding.studio_accent_color || '#C6A77B';
  const studioName = branding.studio_name || 'Studio';
  const tagline = branding.display_name || '';
  const coverUrl = branding.cover_url || null;
  const btnLabel = branding.hero_button_label;
  const btnUrl = branding.hero_button_url;

  // ── Vows Elegance: dramatic full-screen with large display text ──
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
