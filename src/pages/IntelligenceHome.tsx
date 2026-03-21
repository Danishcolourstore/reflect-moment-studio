import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const cormorant = '"Cormorant Garamond", serif';
const dm = '"DM Sans", sans-serif';

const HERO_IMAGES = [
  "https://i.ibb.co/kgR7M8wR/IMG-0029-2.jpg",
  "https://i.ibb.co/bgGy6rKb/MNG05817.jpg",
  "https://i.ibb.co/hFyyFHgB/DSC01925.jpg",
  "https://i.ibb.co/JWfqvhPp/DSC04963.jpg",
  "https://i.ibb.co/LdKbvBPf/MNG06553.jpg",
];

const GRID_IMAGES = [
  "https://i.ibb.co/kgR7M8wR/IMG-0029-2.jpg",
  "https://i.ibb.co/bgGy6rKb/MNG05817.jpg",
  "https://i.ibb.co/hFyyFHgB/DSC01925.jpg",
  "https://i.ibb.co/JWfqvhPp/DSC04963.jpg",
  "https://i.ibb.co/LdKbvBPf/MNG06553.jpg",
  "https://i.ibb.co/8g2pnqGN/MNG05741.jpg",
  "https://i.ibb.co/MyLZCKRc/MNG06415.jpg",
  "https://i.ibb.co/7JC3x0fT/DSC06122.jpg",
  "https://i.ibb.co/WNjfb09j/DSC02548.jpg",
  "https://i.ibb.co/PGFqCKPz/DSC03498.jpg",
  "https://i.ibb.co/1YDhJ9Dy/MNG05696.jpg",
  "https://i.ibb.co/yczHvVy3/DSC01443.jpg",
];

const NAV_ITEMS = [
  { label: "HOME", path: "/home" },
  { label: "EVENTS", path: "/dashboard/events" },
  { label: "STORYBOOK", path: "/storybook" },
  { label: "CHEETAH", path: "/cheetah" },
  { label: "RYFINE", path: "/refyn" },
  { label: "ANALYTICS", path: "/analytics" },
];

const STORIES = [
  { names: "Trisha x Nihaal", location: "Hyderabad", img: GRID_IMAGES[0] },
  { names: "Arun x Meera", location: "Kochi", img: GRID_IMAGES[2] },
  { names: "Ravi x Priya", location: "Udaipur", img: GRID_IMAGES[4] },
];

// Grid layout pattern: some items span 2 rows or 2 cols
const GRID_SPANS: Record<number, { col?: number; row?: number }> = {
  0: { row: 2 },
  3: { col: 2 },
  7: { row: 2 },
  10: { col: 2 },
};

function useOnScreen(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

function FadeSection({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useOnScreen(ref);
  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
    >
      {children}
    </div>
  );
}

export default function IntelligenceHome() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [storyHover, setStoryHover] = useState<number | null>(null);
  const [navHover, setNavHover] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // Hero auto-rotate
  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const prevHero = () => setCurrent((c) => (c - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
  const nextHero = () => setCurrent((c) => (c + 1) % HERO_IMAGES.length);

  const cols = isMobile ? 3 : 4;

  return (
    <div style={{ minHeight: "100dvh", width: "100%", background: "#080808", overflowX: "hidden" }}>
      {/* ── TOP NAV ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#080808",
          borderBottom: "1px solid rgba(240,237,232,0.06)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", paddingTop: 18, paddingBottom: 6 }}>
          <div
            style={{
              fontFamily: cormorant,
              fontSize: 13,
              fontStyle: "italic",
              color: "#E8C97A",
              lineHeight: 1,
              marginBottom: 2,
            }}
          >
            M
          </div>
          <div
            style={{
              fontFamily: cormorant,
              fontSize: 22,
              fontWeight: 500,
              color: "#F0EDE8",
              letterSpacing: "0.12em",
            }}
          >
            MirrorAI
          </div>
        </div>

        {/* Nav links */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 28,
            overflowX: "auto",
            paddingBottom: 14,
            paddingLeft: 16,
            paddingRight: 16,
            scrollbarWidth: "none",
          }}
        >
          {NAV_ITEMS.map((item, i) => {
            const isActive = i === 0;
            const isHov = navHover === i;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setNavHover(i)}
                onMouseLeave={() => setNavHover(null)}
                style={{
                  fontFamily: dm,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.2em",
                  color: isActive || isHov ? "#F0EDE8" : "rgba(240,237,232,0.5)",
                  background: "none",
                  border: "none",
                  borderBottom: isActive ? "1px solid #F0EDE8" : isHov ? "1px solid rgba(240,237,232,0.3)" : "1px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  paddingBottom: 4,
                  transition: "color 0.3s, border-color 0.3s",
                  flexShrink: 0,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── HERO SLIDESHOW ── */}
      <div style={{ position: "relative", width: "100%", height: isMobile ? "60vh" : "70vh", overflow: "hidden" }}>
        {HERO_IMAGES.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: i === current ? 1 : 0,
              transition: "opacity 1.2s ease",
              borderRadius: 0,
            }}
          />
        ))}
        {/* Arrows */}
        <button
          onClick={prevHero}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "rgba(240,237,232,0.3)",
            fontSize: 28,
            cursor: "pointer",
            zIndex: 2,
            lineHeight: 1,
          }}
        >
          ‹
        </button>
        <button
          onClick={nextHero}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "rgba(240,237,232,0.3)",
            fontSize: 28,
            cursor: "pointer",
            zIndex: 2,
            lineHeight: 1,
          }}
        >
          ›
        </button>
      </div>

      {/* ── TAGLINE ── */}
      <FadeSection style={{ textAlign: "center", padding: "60px 24px" }}>
        <h1
          style={{
            fontFamily: cormorant,
            fontSize: "clamp(20px, 5vw, 30px)",
            fontWeight: 400,
            color: "#F0EDE8",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          YOU FEEL. I FOCUS. WE FRAME
        </h1>
        <p
          style={{
            fontFamily: dm,
            fontSize: 13,
            color: "rgba(240,237,232,0.4)",
            lineHeight: 1.8,
            maxWidth: 460,
            margin: "20px auto 0",
          }}
        >
          A wedding is a validation coupled with the showcase of Love inclusive of various events with exotic venues, food, guests, dresses, jewellery and so on- What if it could never be recorded?
        </p>
        <p
          style={{
            fontFamily: dm,
            fontSize: 13,
            color: "rgba(240,237,232,0.4)",
            lineHeight: 1.8,
            maxWidth: 460,
            margin: "12px auto 0",
          }}
        >
          A chronology of a couple's journey where they vow together to be One.
        </p>
        <p
          style={{
            fontFamily: dm,
            fontSize: 10,
            color: "rgba(240,237,232,0.25)",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            marginTop: 20,
          }}
        >
          WE ARE CREATING FICTION OUT OF REALITY.
        </p>
      </FadeSection>

      {/* ── MOSAIC GRID ── */}
      <FadeSection style={{ padding: "0 0 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridAutoRows: isMobile ? 120 : 180,
            gap: 3,
            padding: "0 3px",
          }}
        >
          {GRID_IMAGES.map((src, i) => {
            const span = GRID_SPANS[i] || {};
            const isHov = hovered === i;
            return (
              <div
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  gridColumn: span.col ? `span ${span.col}` : undefined,
                  gridRow: span.row ? `span ${span.row}` : undefined,
                  overflow: "hidden",
                  background: "#0E0E0E",
                }}
              >
                <img
                  src={src}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 0,
                    transform: isHov ? "scale(1.03)" : "scale(1)",
                    transition: "transform 0.4s ease",
                    display: "block",
                  }}
                />
              </div>
            );
          })}
        </div>
      </FadeSection>

      {/* ── REAL LOVE STORIES ── */}
      <FadeSection style={{ padding: "80px 24px 40px", textAlign: "center" }}>
        <h2
          style={{
            fontFamily: cormorant,
            fontSize: "clamp(24px, 5vw, 36px)",
            fontWeight: 300,
            color: "#F0EDE8",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          REAL LOVE STORIES
        </h2>
        <p
          style={{
            fontFamily: dm,
            fontSize: 11,
            color: "rgba(240,237,232,0.3)",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            marginTop: 12,
            maxWidth: 500,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.8,
          }}
        >
          LIKE A RIVER FLOWS SURELY TO THE SEA, SO IT GOES SOME THINGS ARE MEANT TO BE.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 20,
            marginTop: 40,
          }}
        >
          {STORIES.map((s, i) => {
            const isHov = storyHover === i;
            return (
              <div
                key={i}
                onMouseEnter={() => setStoryHover(i)}
                onMouseLeave={() => setStoryHover(null)}
                style={{
                  background: "#0E0E0E",
                  borderRadius: 2,
                  overflow: "hidden",
                  transform: isHov ? "translateY(-3px)" : "translateY(0)",
                  transition: "transform 0.3s ease",
                  cursor: "pointer",
                }}
              >
                <img
                  src={s.img}
                  alt={s.names}
                  style={{ width: "100%", height: 280, objectFit: "cover", borderRadius: 0, display: "block" }}
                />
                <div style={{ padding: "16px 14px 20px" }}>
                  <div style={{ fontFamily: cormorant, fontSize: 18, fontWeight: 400, color: "#F0EDE8" }}>
                    {s.names}
                  </div>
                  <div
                    style={{
                      fontFamily: dm,
                      fontSize: 10,
                      letterSpacing: "0.2em",
                      color: "rgba(240,237,232,0.3)",
                      textTransform: "uppercase",
                      marginTop: 4,
                    }}
                  >
                    {s.location}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </FadeSection>

      {/* ── FOOTER ── */}
      <footer style={{ textAlign: "center", padding: "80px 24px 40px" }}>
        <div style={{ fontFamily: cormorant, fontSize: 16, color: "rgba(240,237,232,0.2)", letterSpacing: "0.2em" }}>
          MirrorAI
        </div>
        <div
          style={{
            fontFamily: dm,
            fontSize: 10,
            color: "rgba(240,237,232,0.15)",
            letterSpacing: "0.15em",
            marginTop: 8,
          }}
        >
          © 2026 · Reflections of Your Moments
        </div>
        <div
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "#E8C97A",
            margin: "16px auto 0",
          }}
        />
      </footer>
    </div>
  );
}
