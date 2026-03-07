import { Button } from '@/components/ui/button';

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
    <section id={id} className="relative" style={{ minHeight: '80vh' }}>
      {coverUrl ? (
        <>
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(12,11,8,0.85) 0%, rgba(12,11,8,0.3) 40%, rgba(12,11,8,0.5) 100%)',
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: '#131109' }} />
      )}

      <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-20 text-center"
        style={{ minHeight: '80vh' }}>
        {branding.studio_logo_url ? (
          <img
            src={branding.studio_logo_url}
            alt=""
            className="h-16 sm:h-20 object-contain mb-6 opacity-90"
            loading="eager"
          />
        ) : null}

        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-[0.02em]"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: '#EDEAE3',
          }}
        >
          {studioName}
        </h1>

        {tagline && (
          <p
            className="mt-4 max-w-lg text-sm sm:text-base leading-relaxed"
            style={{ color: '#A6A197' }}
          >
            {tagline}
          </p>
        )}

        {btnLabel && (
          <a
            href={btnUrl || '#portfolio'}
            className="mt-8 inline-block"
          >
            <Button
              variant="outline"
              className="h-11 px-8 text-[11px] uppercase tracking-[0.15em] rounded-full border-2 transition-all hover:scale-105"
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
    </section>
  );
}
