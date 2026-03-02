import { ChevronDown } from 'lucide-react';

interface AndhakarHeroProps {
  coverUrl: string | null;
  coupleName?: string | null;
  eventDate: string;
  subtitle?: string | null;
  buttonLabel?: string | null;
  onScrollToGallery: () => void;
}

export function AndhakarHero({
  coverUrl,
  coupleName,
  eventDate,
  subtitle,
  buttonLabel,
  onScrollToGallery,
}: AndhakarHeroProps) {
  const hasContent = coupleName || coverUrl;
  if (!hasContent) return null;

  const formattedDate = (() => {
    try {
      return new Date(eventDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).toUpperCase();
    } catch {
      return eventDate;
    }
  })();

  return (
    <div className="relative h-screen overflow-hidden" style={{ backgroundColor: '#0D0D0D' }}>
      {/* Cover image */}
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.7 }}
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: '#0D0D0D' }} />
      )}

      {/* Dark cinematic overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.35)' }}
      />

      {/* Gradient fade: dark → grey at bottom */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, #0D0D0D 0%, transparent 30%, transparent 50%, #2C2C2C 75%, #8B8B8B 95%, #0D0D0D 100%)',
        }}
      />

      {/* Center-aligned content */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 px-6 text-center">
        {coupleName && (
          <h1
            className="text-4xl md:text-6xl leading-tight"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              color: '#C8C8C8',
              letterSpacing: '-0.01em',
            }}
          >
            {coupleName}
          </h1>
        )}

        <p
          className="mt-3"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#8B8B8B',
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
              fontWeight: 400,
              color: '#8B8B8B',
            }}
          >
            {subtitle}
          </p>
        )}

        <button
          onClick={onScrollToGallery}
          className="mt-8 px-8 py-3 rounded-full transition-all duration-200"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#1A1A1A',
            backgroundColor: 'transparent',
            border: '1px solid #D4D4D4',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(212, 212, 212, 0.15)';
            e.currentTarget.style.color = '#C8C8C8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#1A1A1A';
          }}
        >
          {buttonLabel || 'View Gallery'}
        </button>
      </div>

      <button
        onClick={onScrollToGallery}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce transition"
        style={{ color: 'rgba(200, 200, 200, 0.3)' }}
      >
        <ChevronDown className="h-8 w-8" />
      </button>
    </div>
  );
}
