import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
      <div className="text-center px-6 max-w-md">
        <h1
          className="mb-3 text-[var(--ink)]"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 34,
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}
        >
          Page not found.
        </h1>
        <p
          className="mb-8 text-[var(--ink-muted)]"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 400,
            lineHeight: 1.55,
          }}
        >
          The link may have moved or expired.
        </p>
        <Button variant="ghost" onClick={() => navigate("/dashboard/events")}>
          Back to events
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
