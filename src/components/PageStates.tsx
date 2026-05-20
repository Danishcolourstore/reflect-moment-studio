import { RefreshCw } from 'lucide-react';

export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="skeleton-block" style={{ height: 28, width: 160 }} />
      <div className="skeleton-block" style={{ height: 16, width: 256 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 8 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton-block" style={{ aspectRatio: "4/3" }} />
        ))}
      </div>
    </div>
  );
}

export function PageError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh", gap: 24, padding: "0 16px", textAlign: "center" }}>
      <div style={{ width: 48, height: 48, border: "1px solid rgba(168,97,91,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#A8615B", fontSize: 18, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>!</span>
      </div>
      <div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 300, fontStyle: "italic", color: "var(--ink)", margin: "0 0 8px" }}>
          Something went wrong
        </h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 300, color: "var(--ink-muted)", maxWidth: 280, margin: 0 }}>
          {message || "We couldn't load this page. Please try again."}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            border: "1px solid rgba(17,17,17,0.2)",
            background: "transparent",
            color: "#111111",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 300,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "8px 20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  heading = "Nothing here yet",
  subtext = "Get started by creating something new.",
  ctaLabel,
  onAction,
}: {
  heading?: string;
  subtext?: string;
  ctaLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 16, padding: "0 16px", textAlign: "center" }}>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, fontStyle: "italic", color: "var(--ink)", margin: 0 }}>
        {heading}
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 300, color: "var(--ink-muted)", maxWidth: 280, margin: 0 }}>
        {subtext}
      </p>
      {ctaLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            border: "1px solid #B8953F",
            background: "transparent",
            color: "#111111",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 300,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "10px 32px",
            cursor: "pointer",
            marginTop: 16,
          }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
