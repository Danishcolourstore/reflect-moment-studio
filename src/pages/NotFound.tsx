import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center max-w-sm">
        <h1 className="font-serif text-foreground mb-3" style={{ fontSize: '72px', fontWeight: 300 }}>404</h1>
        <p className="font-serif text-muted-foreground mb-2" style={{ fontSize: '20px', fontStyle: 'italic', fontWeight: 400 }}>
          Page not found
        </p>
        <p className="text-muted-foreground mb-6" style={{ fontSize: '13px' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center h-11 px-8 rounded-lg bg-primary text-primary-foreground font-sans transition-colors hover:opacity-90"
          style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' as const }}
        >
          Return Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
