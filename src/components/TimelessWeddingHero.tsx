import { ChevronDown } from 'lucide-react';

interface TimelessWeddingHeroProps {
  coverUrl: string | null;
  coupleName?: string | null;
  eventDate: string;
  subtitle?: string | null;
  buttonLabel?: string | null;
  onScrollToGallery: () => void;
}

export function TimelessWeddingHero({
  coverUrl,
  coupleName,
  eventDate,
  subtitle,
  buttonLabel,
  onScrollToGallery,
}: TimelessWeddingHeroProps) {
  // Hide hero entirely if no couple name and no cover
  const hasContent = coupleName || coverUrl;
  if (!hasContent) return null;

  const formattedDate = (() => {
    try {
      return new Date(eventDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return eventDate;
    }
  })();

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Cover image */}
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: '#2B2B2B' }} />
      )}

      {/* Soft neutral overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.18)' }}
      />

      {/* Gradient fade to content */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 50%, #FAF8F5)',
        }}
      />

      {/* Center-aligned content */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 px-6 text-center">
        {coupleName && (
          <h1
            className="text-4xl md:text-6xl leading-tight"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              color: '#2B2B2B',
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
            color: '#8A8A8A',
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
              color: '#8A8A8A',
            }}
          >
            {subtitle}
          </p>
        )}

        {(buttonLabel || true) && (
          <button
            onClick={onScrollToGallery}
            className="mt-8 px-8 py-3 rounded-full transition-all duration-200"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#2B2B2B',
              backgroundColor: 'rgba(43, 43, 43, 0.06)',
              border: '1px solid rgba(43, 43, 43, 0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(43, 43, 43, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(43, 43, 43, 0.06)';
            }}
          >
            {buttonLabel || 'View Gallery'}
          </button>
        )}
      </div>

      <button
        onClick={onScrollToGallery}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce transition"
        style={{ color: 'rgba(43, 43, 43, 0.3)' }}
      >
        <ChevronDown className="h-8 w-8" />
      </button>
    </div>
  );
}
