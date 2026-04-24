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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-6 max-w-md">
        <h1
          className="mb-3 text-foreground"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 34,
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}
        >
          This page has moved.
        </h1>
        <p
          className="mb-8 text-muted-foreground"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 400,
            lineHeight: 1.55,
          }}
        >
          Return to your studio and continue from the latest route.
        </p>
        <Button variant="ghost" onClick={() => navigate("/home")}>
          Back to studio
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
