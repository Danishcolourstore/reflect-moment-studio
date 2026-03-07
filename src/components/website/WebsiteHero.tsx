import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

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
}

export function WebsiteHero({ branding, id }: WebsiteHeroProps) {
  if (!branding) return null;

  const accent = branding.studio_accent_color || '#C6A77B';
  const studioName = branding.studio_name || 'Studio';
  const tagline = branding.display_name || '';
  const coverUrl = branding.cover_url || null;
  const btnLabel = branding.hero_button_label;
  const btnUrl = branding.hero_button_url;

  return (
    <section id={id} className="relative" style={{ height: '100vh', minHeight: '600px', maxHeight: '1200px' }}>
      {/* Background image with Ken Burns effect */}
      {coverUrl ? (
        <>
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={coverUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover scale-105"
              loading="eager"
              style={{
                animation: 'heroZoom 20s ease-in-out infinite alternate',
              }}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(10,9,6,0.92) 0%, rgba(10,9,6,0.4) 35%, rgba(10,9,6,0.15) 60%, rgba(10,9,6,0.3) 100%)',
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: '#0A0906' }} />
      )}

      {/* Decorative top line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${accent}40, transparent)` }} />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-24 sm:pb-28 text-center"
      >
        {/* Optional logo */}
        {branding.studio_logo_url && (
          <img
            src={branding.studio_logo_url}
            alt=""
            className="h-14 sm:h-18 lg:h-20 object-contain mb-8 opacity-85"
            loading="eager"
          />
        )}

        {/* Small label */}
        <p
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] mb-5"
          style={{ color: accent, opacity: 0.8 }}
        >
          Photography Studio
        </p>

        {/* Studio name */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light tracking-[0.04em] leading-[1.05]"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: '#EDEAE3',
          }}
        >
          {studioName}
        </h1>

        {/* Accent line */}
        <div className="mt-6 mb-5 w-12 h-[1px]" style={{ backgroundColor: accent }} />

        {/* Tagline */}
        {tagline && (
          <p
            className="max-w-md text-sm sm:text-base leading-relaxed tracking-wide"
            style={{ color: 'rgba(237, 234, 227, 0.6)', fontFamily: "'DM Sans', sans-serif" }}
          >
            {tagline}
          </p>
        )}

        {/* CTA button */}
        {btnLabel && (
          <a href={btnUrl || '#portfolio'} className="mt-10 inline-block">
            <Button
              variant="outline"
              className="h-12 px-10 text-[11px] uppercase tracking-[0.18em] rounded-none border transition-all duration-300 hover:scale-[1.02]"
              style={{
                borderColor: accent,
                color: accent,
                backgroundColor: 'transparent',
              }}
            >
              {btnLabel}
            </Button>
          </a>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-40 animate-bounce">
        <ChevronDown className="h-5 w-5" style={{ color: '#EDEAE3' }} />
      </div>

      {/* Ken Burns animation */}
      <style>{`
        @keyframes heroZoom {
          0% { transform: scale(1.05); }
          100% { transform: scale(1.15); }
        }
      `}</style>
    </section>
  );
}
