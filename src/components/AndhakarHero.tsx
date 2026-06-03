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
    <div
      style={{
        position: "relative",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#0D0D0D",
      }}
    >
      {/* Cover image */}
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.7,
          }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, backgroundColor: "#0D0D0D" }} />
      )}

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
        }}
      />

      {/* Gradient fade */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, #0D0D0D 0%, transparent 30%, transparent 50%, #2C2C2C 75%, #8B8B8B 95%, #0D0D0D 100%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 96,
          paddingLeft: 24,
          paddingRight: 24,
          textAlign: "center",
        }}
      >
        {coupleName && (
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(32px, 6vw, 64px)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "#C8C8C8",
              letterSpacing: "-0.01em",
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            {coupleName}
          </h1>
        )}

        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 300,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#8B8B8B",
            marginTop: 12,
            marginBottom: 0,
          }}
        >
          {formattedDate}
        </p>

        {subtitle && (
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 300,
              color: "#8B8B8B",
              marginTop: 8,
              marginBottom: 0,
            }}
          >
            {subtitle}
          </p>
        )}

        <button
          onClick={onScrollToGallery}
          style={{
            marginTop: 32,
            padding: "12px 32px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 300,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#C8C8C8",
            backgroundColor: "transparent",
            border: "1px solid rgba(212,212,212,0.4)",
            cursor: "pointer",
            transition: "border-color 200ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(212,212,212,0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(212,212,212,0.4)";
          }}
        >
          {buttonLabel || "View Gallery"}
        </button>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={onScrollToGallery}
        style={{
          position: "absolute",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(200,200,200,0.3)",
          animation: "bounce 1s infinite",
          padding: 0,
        }}
      >
        <ChevronDown size={32} strokeWidth={1} />
      </button>
    </div>
  );
}
