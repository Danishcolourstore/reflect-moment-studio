import { ChevronDown } from 'lucide-react';

interface TimelessWeddingHeroProps {
  coverUrl: string | null;
  coupleName?: string | null;
  eventDate: string;
  subtitle?: string | null;
  buttonLabel?: string | null;
  onScrollToGallery: () => void;
  studioLogoUrl?: string | null;
  studioName?: string | null;
}

export function TimelessWeddingHero({
  coverUrl,
  coupleName,
  eventDate,
  subtitle,
  buttonLabel,
  onScrollToGallery,
  studioLogoUrl,
  studioName,
}: TimelessWeddingHeroProps) {
  const hasContent = coupleName || coverUrl;
  if (!hasContent) return null;

  const formattedDate = (() => {
    try {
      return new Date(eventDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).toUpperCase();
    } catch (err) {
      console.error('Failed to load hero data:', err);
      return eventDate;
    }
  })();

  return (
    <div className="relative w-screen overflow-hidden" style={{ height: '85vh' }}>
      {/* Cover image — natural, no heavy processing */}
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: '#8A7E6D' }} />
      )}

      {/* Warm readability tint — airy, not cinematic */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(244, 241, 236, 0.25)' }}
      />

      {/* Gentle bottom gradient for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.25) 100%)',
        }}
      />

      {/* Studio monogram / logo — top center */}
      {(studioLogoUrl || studioName) && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
          {studioLogoUrl ? (
            <img
              src={studioLogoUrl}
              alt=""
              className="h-8 object-contain opacity-80"
              style={{ filter: 'brightness(10)' }}
            />
          ) : studioName ? (
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '9px',
                fontWeight: 300,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              {studioName}
            </span>
          ) : null}
        </div>
      )}

      {/* Center-aligned content */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-20 px-6 text-center">
        {coupleName && (
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              fontWeight: 300,
              fontSize: '48px',
              color: '#FFFFFF',
              letterSpacing: '0.05em',
              lineHeight: 1.15,
              textShadow: '0 1px 8px rgba(0,0,0,0.15)',
            }}
          >
            {coupleName}
          </h1>
        )}

        <p
          className="mt-4"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            fontWeight: 300,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          {formattedDate}
        </p>

        {subtitle && (
          <p
            className="mt-2"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            {subtitle}
          </p>
        )}

        {/* View Gallery — underlined text link */}
        <button
          onClick={onScrollToGallery}
          className="mt-8 transition-opacity duration-200 hover:opacity-70"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            fontWeight: 300,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#FFFFFF',
            background: 'none',
            border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.5)',
            paddingBottom: '2px',
            cursor: 'pointer',
          }}
        >
          {buttonLabel || 'View Gallery'}
        </button>
      </div>

      {/* Subtle scroll indicator */}
      <button
        onClick={onScrollToGallery}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce transition"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        <ChevronDown className="h-6 w-6" />
      </button>
    </div>
  );
}
