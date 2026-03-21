import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const playfair = '"Playfair Display", serif';
const mont = '"Montserrat", sans-serif';

const IMAGES = [
  "/images/home-1.webp",
  "/images/home-2.webp",
  "/images/home-3.webp",
  "/images/home-4.webp",
  "/images/home-5.webp",
  "/images/home-6.webp",
  "/images/home-7.webp",
  "/images/home-8.webp",
  "/images/home-9.webp",
  "/images/home-10.webp",
];

const NAV_ITEMS = [
  { label: "HOME", path: "/home" },
  { label: "EVENTS", path: "/dashboard/events" },
  { label: "STORYBOOK", path: "/storybook" },
  { label: "CHEETAH", path: "/cheetah" },
  { label: "RYFINE", path: "/refyn" },
  { label: "ANALYTICS", path: "/analytics" },
];

const FEATURES = [
  { name: "Face Recognition Delivery", desc: "Upload 20,000 photos. Every guest finds their own face. Delivered in minutes, not days. AI that understands Indian weddings — large crowds, similar outfits, changing light." },
  { name: "MirrorLive — Real-Time Gallery", desc: "The baraat is happening. The photos are already in the family's hands. Live delivery that turns every wedding into an event your clients will never forget." },
  { name: "Storybook — Instagram Carousel Builder", desc: "Shoot. Upload. Storybook turns your best frames into scroll-stopping carousels. Your next client is watching your stories right now." },
];

const FEATURES2 = [
  { name: "Cheetah — Fast Culling", desc: "20,000 photos. Culled in minutes. AI that knows which frames are sharp, which expressions matter, which moments count. You review. Cheetah does the rest." },
  { name: "Ryfine — RI Editor", desc: "Color grading built for Indian skin tones, Indian light, Indian weddings. Not a Western tool with Indian presets — a ground-up editor for the work you actually do." },
  { name: "Album Auto-Builder", desc: "Select your photos. Pick a style. The album builds itself. Spreads, layouts, sequencing — all handled. You approve. You deliver." },
  { name: "Custom Photographer Websites", desc: "Your brand. Your domain. Your portfolio. Premium websites that load fast on Indian networks and look like they cost lakhs to build." },
];

const STATS = [
  { num: "10M+", label: "WEDDINGS PER YEAR" },
  { num: "₹10L Cr", label: "INDUSTRY SIZE" },
  { num: "800+", label: "WEDDING TRADITIONS" },
];

function useOnScreen(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.12 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

function Fade({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const v = useOnScreen(ref);
  return (
    <div ref={ref} style={{ ...style, opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease-out, transform 0.6s ease-out" }}>
      {children}
    </div>
  );
}

function FullImg({ src, height = "55vh", mobileHeight = "40vh", style }: { src: string; height?: string; mobileHeight?: string; style?: React.CSSProperties }) {
  const [mob, setMob] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setMob(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return (
    <img src={src} alt="" style={{ width: "100%", height: mob ? mobileHeight : height, objectFit: "cover", display: "block", ...style }} />
  );
}

function GoldRule({ width = 48, margin = "28px auto" }: { width?: number; margin?: string }) {
  return <div style={{ width, height: 2, background: "#FFCC00", margin }} />;
}

function Label({ children, color = "#666666" }: { children: React.ReactNode; color?: string }) {
  return <p style={{ fontFamily: mont, fontSize: 11, fontWeight: 400, letterSpacing: "1.5px", textTransform: "uppercase", color, margin: 0 }}>{children}</p>;
}

export default function IntelligenceHome() {
  const navigate = useNavigate();
  const [navHover, setNavHover] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (!document.getElementById("gf-playfair-mont")) {
      const link = document.createElement("link");
      link.id = "gf-playfair-mont";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Montserrat:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const heading = (text: string, size = "clamp(28px,6vw,48px)", italic = false): React.CSSProperties => ({
    fontFamily: playfair, fontSize: size, fontWeight: 700, color: "#000000", letterSpacing: "0.5px", textAlign: "center", margin: 0, fontStyle: italic ? "italic" : "normal",
  });

  const body = (color = "#666666", weight = 400): React.CSSProperties => ({
    fontFamily: mont, fontSize: 16, fontWeight: weight, color, lineHeight: 1.7, textAlign: "center", margin: 0,
  });

  return (
    <div style={{ minHeight: "100dvh", width: "100%", background: "#FFFFFF", overflowX: "hidden" }}>
      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "#FFFFFF", borderBottom: "1px solid #F2F2F2" }}>
        <div style={{ textAlign: "center", paddingTop: 12 }}>
          <div style={{ fontFamily: playfair, fontSize: 18, fontStyle: "italic", color: "#FFCC00", lineHeight: 1 }}>M</div>
          <div style={{ fontFamily: playfair, fontSize: 28, fontWeight: 700, color: "#000000" }}>MirrorAI</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, overflowX: "auto", paddingBottom: 12, paddingLeft: 16, paddingRight: 16, scrollbarWidth: "none" }}>
          {NAV_ITEMS.map((item, i) => {
            const isActive = i === 0;
            const isHov = navHover === i;
            return (
              <button key={item.label} onClick={() => navigate(item.path)} onMouseEnter={() => setNavHover(i)} onMouseLeave={() => setNavHover(null)}
                style={{ fontFamily: mont, fontSize: 14, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase", color: isActive || isHov ? "#000000" : "#666666", background: "none", border: "none", borderBottom: isActive ? "2px solid #FFCC00" : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap", paddingBottom: 4, transition: "color 0.3s", flexShrink: 0 }}>
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* IMAGE 1 — HERO */}
      <FullImg src={IMAGES[0]} height="65vh" mobileHeight="45vh" />

      {/* HERO TEXT */}
      <Fade style={{ textAlign: "center", padding: isMobile ? "60px 20px 40px" : "80px 24px 60px" }}>
        <Label color="#FFCC00">THE REAL INTELLIGENCE</Label>
        <h1 style={{ ...heading("India Celebrates Love Like No Other Nation On Earth", "clamp(36px,8vw,64px)"), marginTop: 16 }}>
          India Celebrates Love Like No Other Nation On Earth
        </h1>
        <GoldRule />
        <p style={{ ...body(), maxWidth: 620, margin: "0 auto" }}>
          Hindu, Muslim, Sikh, Christian, Jain, Buddhist, Parsi — every faith, every region, every ritual. From the saat pheras of a North Indian mandap to the thali tying of a Tamil ceremony. From a Kashmiri lavender garden to a Kerala houseboat. From a Nikah in Lucknow to an Anand Karaj in Amritsar.
        </p>
        <p style={{ ...body("#000000", 500), maxWidth: 620, margin: "16px auto 0" }}>
          No country on earth has this many ways of saying forever.
        </p>
        <p style={{ fontFamily: mont, fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: "#666666", marginTop: 12, textAlign: "center" }}>
          AND NO PLATFORM WAS EVER BUILT TO SERVE THE PHOTOGRAPHERS WHO CAPTURE IT ALL — UNTIL NOW.
        </p>
      </Fade>

      {/* IMAGE 2 — CULTURE */}
      <FullImg src={IMAGES[1]} style={{ margin: "30px 0" }} />

      {/* THE PROBLEM */}
      <Fade style={{ textAlign: "center", padding: isMobile ? "40px 20px 30px" : "60px 24px 40px" }}>
        <Label>THE TRUTH</Label>
        <h2 style={{ ...heading("You Deserved Better. So We Built It."), marginTop: 12 }}>You Deserved Better. So We Built It.</h2>
        <GoldRule width={36} margin="20px auto" />
        <p style={{ ...body(), maxWidth: 660, margin: "0 auto" }}>
          For years, Indian wedding photographers used platforms designed for 200-photo portrait sessions in Portland. You shoot 20,000 images across five days. You deliver to families of 500. You work on Indian internet, price in rupees, and create art that rivals cinema.
        </p>
        <p style={{ ...body("#000000", 500), maxWidth: 660, margin: "20px auto 0" }}>
          The tools you were given were never made for you. MirrorAI is.
        </p>
      </Fade>

      {/* IMAGE 3 — COUPLE PORTRAIT */}
      <FullImg src={IMAGES[2]} style={{ margin: "30px 0" }} />

      {/* FEATURES PART 1 */}
      <Fade style={{ maxWidth: 660, margin: "0 auto", padding: isMobile ? "40px 20px 0" : "60px 24px 0" }}>
        <Label color="#FFCC00">WHAT REAL INTELLIGENCE LOOKS LIKE</Label>
        <div style={{ marginTop: 50 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ marginBottom: 40 }}>
              <h3 style={{ fontFamily: playfair, fontSize: 24, fontWeight: 700, color: "#000000", margin: 0 }}>{f.name}</h3>
              <div style={{ width: 24, height: 2, background: "#FFCC00", margin: "10px 0 16px 0" }} />
              <p style={{ ...body(), textAlign: "left" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </Fade>

      {/* IMAGE 4 — CEREMONY */}
      <FullImg src={IMAGES[3]} height="50vh" mobileHeight="35vh" style={{ margin: "30px 0" }} />

      {/* FEATURES PART 2 */}
      <Fade style={{ maxWidth: 660, margin: "0 auto", padding: isMobile ? "0 20px" : "0 24px" }}>
        {FEATURES2.map((f, i) => (
          <div key={i} style={{ marginBottom: 40 }}>
            <h3 style={{ fontFamily: playfair, fontSize: 24, fontWeight: 700, color: "#000000", margin: 0 }}>{f.name}</h3>
            <div style={{ width: 24, height: 2, background: "#FFCC00", margin: "10px 0 16px 0" }} />
            <p style={{ ...body(), textAlign: "left" }}>{f.desc}</p>
          </div>
        ))}
        <div style={{ width: "50%", height: 1, background: "#FFCC00", margin: "50px auto" }} />
      </Fade>

      {/* IMAGE 5 — CELEBRATION */}
      <FullImg src={IMAGES[4]} style={{ margin: "30px 0" }} />

      {/* WHY INDIA */}
      <Fade style={{ textAlign: "center", padding: isMobile ? "60px 20px 20px" : "80px 24px 20px", maxWidth: 660, margin: "0 auto" }}>
        <Label>WHY NOW</Label>
        <h2 style={{ ...heading("Built For The ₹10 Lakh Crore Industry"), marginTop: 12 }}>Built For The ₹10 Lakh Crore Industry</h2>
        <GoldRule width={36} margin="20px auto" />
        <p style={{ ...body(), margin: "0 auto" }}>
          India hosts over 10 million weddings every year. A ₹10 lakh crore industry — the largest wedding market on earth. Yet every tool photographers use was built in America, priced in dollars, designed for a different world.
        </p>
        <p style={{ ...body("#000000", 500), margin: "20px auto 0" }}>
          MirrorAI is the first platform engineered from the ground up for Indian wedding photographers. Indian internet speeds. Indian pricing. Indian workflows. Indian intelligence.
        </p>
      </Fade>

      {/* IMAGE 6 — PHOTOGRAPHER */}
      <div style={{ maxWidth: 660, margin: "30px auto", padding: isMobile ? "0 20px" : "0 24px" }}>
        <img src={IMAGES[5]} alt="" style={{ width: "100%", height: 400, objectFit: "cover", borderRadius: 4, display: "block" }} />
      </div>

      {/* STATS */}
      <Fade style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "center", alignItems: "center", gap: isMobile ? 30 : 40, padding: isMobile ? "40px 20px" : "60px 24px" }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: playfair, fontSize: 52, fontWeight: 700, color: "#FFCC00", lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontFamily: mont, fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "#666666", marginTop: 8 }}>{s.label}</div>
          </div>
        ))}
      </Fade>

      {/* IMAGE 7 — MEHENDI */}
      <FullImg src={IMAGES[6]} style={{ margin: "30px 0" }} />

      {/* IMAGE 8 — GRAND VENUE */}
      <FullImg src={IMAGES[7]} />

      {/* CLOSING MANIFESTO */}
      <Fade style={{ textAlign: "center", padding: isMobile ? "60px 20px 40px" : "80px 24px 60px", maxWidth: 620, margin: "0 auto" }}>
        <h2 style={{ ...heading("This Is Real Intelligence", "clamp(28px,6vw,48px)", true) }}>This Is Real Intelligence</h2>
        <GoldRule width={36} margin="20px auto" />
        <p style={{ ...body(), margin: "0 auto" }}>
          Not artificial. Not imported. Not borrowed. Built here, for here, by people who understand that an Indian wedding is not an event — it is an emotion that spans generations.
        </p>
        <p style={{ ...body("#000000", 500), margin: "20px auto 0" }}>
          MirrorAI exists because you deserve a platform as extraordinary as the weddings you photograph.
        </p>
      </Fade>

      {/* IMAGE 9 — COUPLE CANDID */}
      <div style={{ maxWidth: 620, margin: "30px auto", padding: isMobile ? "0 20px" : "0 24px" }}>
        <img src={IMAGES[8]} alt="" style={{ width: "100%", height: 400, objectFit: "cover", borderRadius: 4, display: "block" }} />
      </div>

      {/* IMAGE 10 — EMOTIONAL */}
      <FullImg src={IMAGES[9]} height="50vh" mobileHeight="35vh" style={{ marginTop: 30 }} />

      {/* FOOTER */}
      <footer style={{ textAlign: "center", padding: "40px 24px", borderTop: "1px solid #F2F2F2" }}>
        <div style={{ fontFamily: mont, fontSize: 12, color: "#666666" }}>© MIRRORAI · THE REAL INTELLIGENCE</div>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#FFCC00", margin: "16px auto 0" }} />
      </footer>
    </div>
  );
}
