import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

const CUBIC = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

const NAV_ITEMS = [
  { label: "Home", path: "/home" },
  { label: "Events", path: "/dashboard/events" },
  { divider: true },
  { label: "Website", path: "/dashboard/website-builder" },
  { label: "Storybook", path: "/dashboard/storybook" },
  { label: "More", path: "/more" },
] as const;

export function useDrawerMenu() {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);
  return { open, toggle, close, setOpen };
}

export function HamburgerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer z-50"
      style={{
        background: "none",
        border: "none",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11,
        fontWeight: 500,
        color: "#1A1A1A",
        letterSpacing: "0.2em",
      }}
      aria-label="Menu"
    >
      MENU
    </button>
  );
}

export function DrawerMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Mount/unmount with animation
  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setAnimating(true));
    } else if (mounted) {
      setAnimating(false);
      const timer = setTimeout(() => setMounted(false), 280);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop — white 40% opacity with blur */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 190,
          background: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          opacity: animating ? 1 : 0,
          transition: `opacity 280ms ${CUBIC}`,
        }}
      />

      {/* Panel — slides from left */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 200,
          height: "100dvh",
          width: "80vw",
          maxWidth: 360,
          background: "#FDFCFB",
          borderRight: "1px solid #F0EDE8",
          boxShadow: "none",
          display: "flex",
          flexDirection: "column",
          transform: animating ? "translateX(0)" : "translateX(-100%)",
          transition: `transform 280ms ${CUBIC}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px",
            borderBottom: "1px solid #F0EDE8",
          }}
        >
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 12,
              letterSpacing: "0.18em",
              color: "#AAAAAA",
              fontWeight: 400,
            }}
          >
            MirrorAI
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              color: "#AAAAAA",
              lineHeight: 1,
              padding: 0,
            }}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            paddingLeft: 28,
            paddingRight: 28,
            paddingTop: 24,
          }}
        >
          {NAV_ITEMS.map((item, i) => {
            if ("divider" in item) {
              return (
                <div
                  key={`div-${i}`}
                  style={{
                    height: 1,
                    background: "#F0EDE8",
                    marginTop: 14,
                    marginBottom: 14,
                  }}
                />
              );
            }

            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 28,
                  lineHeight: 1.55,
                  fontWeight: 400,
                  fontStyle: active ? "italic" : "normal",
                  color: active ? "#C8A97E" : "#1C1C1E",
                  padding: 0,
                  transition: `color 180ms ease, font-style 180ms ease`,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "#C8A97E";
                    e.currentTarget.style.fontStyle = "italic";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "#1C1C1E";
                    e.currentTarget.style.fontStyle = "normal";
                  }
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div
          style={{
            borderTop: "1px solid #F0EDE8",
            paddingTop: 20,
            paddingBottom: 32,
            paddingLeft: 28,
            paddingRight: 28,
          }}
        >
          <button
            onClick={() => handleNav("/dashboard/website-editor")}
            style={{
              display: "block",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              letterSpacing: "0.14em",
              color: "#C8A97E",
              textTransform: "uppercase",
              fontWeight: 400,
              padding: 0,
              marginBottom: 8,
            }}
          >
            Colour Store
          </button>
          <button
            onClick={handleSignOut}
            style={{
              display: "block",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: "#C0C0C0",
              fontWeight: 400,
              padding: 0,
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
