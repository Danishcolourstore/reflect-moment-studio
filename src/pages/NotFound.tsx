import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
      <div className="text-center px-6">
        <h1
          className="mb-4 text-[var(--ink)]"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 40,
            fontWeight: 300,
            lineHeight: 1.2,
          }}
        >
          Page not found.
        </h1>
        <p
          className="mb-6 text-[var(--ink-muted)]"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            fontWeight: 400,
          }}
        >
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="text-[var(--gold)] hover:text-[var(--gold-ink)] transition-colors"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Return home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
