import { useState, useEffect, useRef } from "react";
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
  { label: "FEATURED", path: "#featured" },
  { label: "STORIES", path: "#stories" },
  { label: "TRENDING", path: "#trending" },
  { label: "UPDATES", path: "#updates" },
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

const PHOTOGRAPHERS = [
  { name: "Naman Verma", location: "DELHI", bio: "Fine art and editorial wedding photographer capturing love across India." },
  { name: "Joseph Radhik", location: "HYDERABAD", bio: "Storyteller of emotions, creating timeless wedding narratives." },
  { name: "Recall Pictures", location: "MUMBAI", bio: "Cinematic wedding films and photography for the modern couple." },
];

const COMMUNITY_STORIES = [
  { couple: "Meera & Arjun", loc: "Udaipur · Dec 2025", snippet: "A royal celebration at the City Palace that blended tradition with modern elegance." },
  { couple: "Priya & Karthik", loc: "Kerala · Jan 2026", snippet: "A houseboat ceremony on the backwaters that felt like a dream." },
  { couple: "Zara & Imran", loc: "Lucknow · Nov 2025", snippet: "A Nawabi nikah that honored centuries of tradition." },
  { couple: "Simran & Raj", loc: "Amritsar · Feb 2026", snippet: "An Anand Karaj at the Golden Temple, bathed in golden light." },
];

const TRENDS = [
  { name: "INTIMATE CEREMONIES", desc: "Small, meaningful gatherings replacing grand affairs" },
  { name: "PASTEL PALETTES", desc: "Soft pinks, lavenders, and sage greens dominating decor" },
  { name: "FILM PHOTOGRAPHY", desc: "The analog renaissance in wedding documentation" },
  { name: "DESTINATION SOUTH", desc: "Kerala, Goa, and Tamil Nadu emerging as top wedding destinations" },
  { name: "SUSTAINABLE WEDDINGS", desc: "Eco-conscious celebrations gaining momentum" },
];

const UPDATES = [
  { date: "MARCH 2026", title: "Cheetah AI Culling — Now Live", desc: "Cull 20,000 photos in minutes. AI-powered smart selection that understands Indian wedding moments." },
  { date: "FEBRUARY 2026", title: "Ryfine Editor — Indian Skin Tone Presets", desc: "Color grading profiles built specifically for Indian weddings. Warm tones, golden hour, indoor ceremony presets." },
  { date: "JANUARY 2026", title: "MirrorLive 2.0 — Real-Time Delivery", desc: "Share photos with guests instantly during the event. Now 3x faster with optimized Indian network support." },
];

const gradient = "linear-gradient(135deg, #f5f0ea 0%, #e8e0d4 50%, #f5f0ea 100%)";

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
    <img src={src} alt="" style={{ width: "100%", maxWidth: "100%", height: mob ? mobileHeight : height, objectFit: "cover", background: "#f5f0ea", display: "block", ...style }} />
  );
}

function GoldRule({ width = 48, margin = "28px auto" }: { width?: number; margin?: string }) {
  return <div style={{ width, height: 2, background: "#FFCC00", margin }} />;
}

function Label({ children, color = "#666666" }: { children: React.ReactNode; color?: string }) {
  return <p style={{ fontFamily: mont, fontSize: 11, fontWeight: 400, letterSpacing: "1.5px", textTransform: "uppercase", color, margin: 0 }}>{children}</p>;
}

function SectionHead({ label, labelColor = "#FFCC00", title }: { label: string; labelColor?: string; title: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 40 }}>
      <Label color={labelColor}>{label}</Label>
      <h2 style={{ fontFamily: playfair, fontSize: "clamp(28px,6vw,44px)", fontWeight: 700, color: "#000000", letterSpacing: "0.5px", textAlign: "center", margin: "12px 0 0" }}>{title}</h2>
      <GoldRule width={36} margin="20px auto" />
    </div>
  );
}

export default function IntelligenceHome() {
  const navigate = useNavigate();
  const [navHover, setNavHover] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [pillHover, setPillHover] = useState(false);
  const [footerPillHover, setFooterPillHover] = useState(false);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, []);

  const heading = (size = "clamp(28px,6vw,48px)", italic = false): React.CSSProperties => ({
    fontFamily: playfair, fontSize: size, fontWeight: 700, color: "#000000", letterSpacing: "0.5px", textAlign: "center", margin: 0, fontStyle: italic ? "italic" : "normal",
  });

  const body = (color = "#666666", weight = 400): React.CSSProperties => ({
    fontFamily: mont, fontSize: 16, fontWeight: weight, color, lineHeight: 1.7, textAlign: "center", margin: 0,
  });

  const handleNav = (path: string) => {
    if (path.startsWith("#")) {
      const el = document.getElementById(path.slice(1));
      el?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(path);
    }
  };

  const pillStyle = (hover: boolean, big = false): React.CSSProperties => ({
    fontFamily: mont, fontSize: big ? 12 : 10, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" as const,
    background: hover ? "#FFD633" : "#FFCC00", color: "#000000",
    border: "none", borderRadius: 20, padding: big ? "14px 32px" : "8px 20px",
    cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.3s",
  });

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#FFFFFF", overflow: "visible" }}>

      {/* ─── NAV ─── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "#FFFFFF", borderBottom: "1px solid #F2F2F2" }}>
        <div style={{ textAlign: "center", paddingTop: 12 }}>
          <div style={{ fontFamily: playfair, fontSize: 18, fontStyle: "italic", color: "#FFCC00", lineHeight: 1 }}>M</div>
          <div style={{ fontFamily: playfair, fontSize: 28, fontWeight: 700, color: "#000000" }}>MirrorAI</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, overflowX: "auto", paddingBottom: 12, paddingLeft: 16, paddingRight: 16, scrollbarWidth: "none" }}>
          {NAV_ITEMS.map((item, i) => {
            const isActive = i === 0;
            const isHov = navHover === i;
            return (
              <button key={item.label} onClick={() => handleNav(item.path)} onMouseEnter={() => setNavHover(i)} onMouseLeave={() => setNavHover(null)}
                style={{ fontFamily: mont, fontSize: 12, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase", color: isActive || isHov ? "#000000" : "#666666", background: "none", border: "none", borderBottom: isActive ? "2px solid #FFCC00" : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap", padding: "12px 0", minHeight: 44, transition: "color 0.3s", flexShrink: 0 }}>
                {item.label}
              </button>
            );
          })}
          <button onClick={() => navigate("/dashboard")} onMouseEnter={() => setPillHover(true)} onMouseLeave={() => setPillHover(false)} style={pillStyle(pillHover)}>
            REAL INTELLIGENCE →
          </button>
        </div>
      </nav>

      {/* ─── FLOATING MOBILE CTA ─── */}
      {isMobile && (
        <button onClick={() => navigate("/dashboard")}
          style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 200, fontFamily: mont, fontSize: 11, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", background: "#FFCC00", color: "#000000", border: "none", borderRadius: 24, padding: "12px 28px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", cursor: "pointer", animation: "pulse-pill 3s ease-in-out infinite" }}>
          Enter Real Intelligence →
        </button>
      )}

      {/* pulse keyframes */}
      <style>{`@keyframes pulse-pill { 0%,100% { transform: translateX(-50%) scale(1); } 50% { transform: translateX(-50%) scale(1.03); } }`}</style>

      {/* ─── HERO IMAGE ─── */}
      <FullImg src={IMAGES[0]} height="65vh" mobileHeight="45vh" />

      {/* ─── HERO TEXT ─── */}
      <Fade style={{ textAlign: "center", padding: isMobile ? "60px 20px 40px" : "80px 24px 60px" }}>
        <Label color="#FFCC00">THE REAL INTELLIGENCE</Label>
        <h1 style={{ ...heading("clamp(36px,8vw,64px)"), marginTop: 16 }}>
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

      {/* IMAGE 2 */}
      <FullImg src={IMAGES[1]} style={{ margin: "30px 0" }} />

      {/* THE PROBLEM */}
      <Fade style={{ textAlign: "center", padding: isMobile ? "40px 20px 30px" : "60px 24px 40px" }}>
        <Label>THE TRUTH</Label>
        <h2 style={{ ...heading(), marginTop: 12 }}>You Deserved Better. So We Built It.</h2>
        <GoldRule width={36} margin="20px auto" />
        <p style={{ ...body(), maxWidth: 660, margin: "0 auto" }}>
          For years, Indian wedding photographers used platforms designed for 200-photo portrait sessions in Portland. You shoot 20,000 images across five days. You deliver to families of 500. You work on Indian internet, price in rupees, and create art that rivals cinema.
        </p>
        <p style={{ ...body("#000000", 500), maxWidth: 660, margin: "20px auto 0" }}>
          The tools you were given were never made for you. MirrorAI is.
        </p>
      </Fade>

      {/* IMAGE 3 */}
      <FullImg src={IMAGES[2]} style={{ margin: "30px 0" }} />

      {/* ─── FEATURED PHOTOGRAPHERS ─── */}
      <Fade style={{ padding: isMobile ? "60px 20px 0" : "80px 24px 0", maxWidth: 900, margin: "0 auto" }} >
        <div id="featured">
          <SectionHead label="SPOTLIGHT" title="Featured Photographers" />
          <p style={{ ...body(), textAlign: "center", maxWidth: 560, margin: "-20px auto 40px" }}>Celebrating the artists who define Indian wedding photography.</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 24 }}>
            {PHOTOGRAPHERS.map((p, i) => (
              <div key={i} style={{ border: "1px solid #F2F2F2", overflow: "hidden", transition: "transform 0.3s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-3px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                {/* TODO: Replace with real image URL */}
                <div style={{ height: 280, background: gradient }} />
                <div style={{ padding: 24 }}>
                  <div style={{ fontFamily: playfair, fontSize: 20, fontWeight: 700, color: "#000000" }}>{p.name}</div>
                  <div style={{ fontFamily: mont, fontSize: 12, color: "#666666", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 4 }}>{p.location}</div>
                  <p style={{ fontFamily: mont, fontSize: 14, color: "#666666", lineHeight: 1.6, marginTop: 12 }}>{p.bio}</p>
                  <div style={{ fontFamily: mont, fontSize: 12, fontWeight: 600, color: "#000000", marginTop: 12, cursor: "pointer" }}>View Work →</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Fade>

      {/* ─── COMMUNITY STORIES ─── */}
      <Fade style={{ padding: isMobile ? "60px 20px 0" : "80px 24px 0", maxWidth: 900, margin: "0 auto" }}>
        <div id="stories">
          <SectionHead label="COMMUNITY" title="Love Stories From Our Community" />
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
            {COMMUNITY_STORIES.map((s, i) => (
              <div key={i} style={{ border: "1px solid #F2F2F2", overflow: "hidden", transition: "transform 0.3s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-3px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                {/* TODO: Replace with real image URL */}
                <div style={{ height: 200, background: gradient }} />
                <div style={{ padding: 20 }}>
                  <div style={{ fontFamily: playfair, fontSize: 18, fontWeight: 700, color: "#000000" }}>{s.couple}</div>
                  <div style={{ fontFamily: mont, fontSize: 12, color: "#666666", marginTop: 4 }}>{s.loc}</div>
                  <p style={{ fontFamily: mont, fontSize: 14, color: "#666666", lineHeight: 1.6, marginTop: 8 }}>{s.snippet}</p>
                  <div style={{ fontFamily: mont, fontSize: 12, fontWeight: 600, color: "#000000", marginTop: 8, cursor: "pointer" }}>Read Story →</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Fade>

      {/* ─── TRENDING STYLES ─── */}
      <Fade style={{ padding: isMobile ? "60px 0 0" : "80px 0 0" }}>
        <div id="trending" style={{ maxWidth: 900, margin: "0 auto", paddingLeft: isMobile ? 20 : 24, paddingRight: isMobile ? 20 : 24 }}>
          <SectionHead label="TRENDING NOW" title="Wedding Styles That Define 2026" />
        </div>
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingLeft: isMobile ? 20 : "calc((100% - 900px) / 2 + 24px)", paddingRight: 20, paddingBottom: 8, scrollbarWidth: "none" }}>
          {TRENDS.map((t, i) => (
            <div key={i} style={{ flexShrink: 0, width: 260 }}>
              {/* TODO: Replace with real image URL */}
              <div style={{ height: 320, background: gradient, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 16px 16px", background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}>
                  <div style={{ fontFamily: mont, fontSize: 13, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#FFFFFF" }}>{t.name}</div>
                </div>
              </div>
              <p style={{ fontFamily: mont, fontSize: 13, color: "#666666", padding: "16px 0 0", margin: 0 }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </Fade>

      {/* ─── MIRRORAI UPDATES ─── */}
      <Fade style={{ padding: isMobile ? "60px 20px 0" : "80px 24px 0", maxWidth: 660, margin: "0 auto" }}>
        <div id="updates">
          <SectionHead label="PRODUCT UPDATES" title="What's New In MirrorAI" />
          {UPDATES.map((u, i) => (
            <div key={i} style={{ padding: "24px 0", borderBottom: "1px solid #F2F2F2" }}>
              <div style={{ fontFamily: mont, fontSize: 10, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#FFCC00" }}>{u.date}</div>
              <div style={{ fontFamily: playfair, fontSize: 20, fontWeight: 700, color: "#000000", marginTop: 8 }}>{u.title}</div>
              <p style={{ fontFamily: mont, fontSize: 14, color: "#666666", lineHeight: 1.6, marginTop: 8, margin: "8px 0 0" }}>{u.desc}</p>
            </div>
          ))}
        </div>
      </Fade>

      {/* IMAGE 4 — CEREMONY */}
      <FullImg src={IMAGES[3]} height="50vh" mobileHeight="35vh" style={{ margin: "60px 0 30px" }} />

      {/* ─── FEATURES ─── */}
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

      <FullImg src={IMAGES[4]} style={{ margin: "30px 0" }} />

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

      {/* WHY INDIA */}
      <Fade style={{ textAlign: "center", padding: isMobile ? "60px 20px 20px" : "80px 24px 20px", maxWidth: 660, margin: "0 auto" }}>
        <Label>WHY NOW</Label>
        <h2 style={{ ...heading(), marginTop: 12 }}>Built For The ₹10 Lakh Crore Industry</h2>
        <GoldRule width={36} margin="20px auto" />
        <p style={{ ...body(), margin: "0 auto" }}>
          India hosts over 10 million weddings every year. A ₹10 lakh crore industry — the largest wedding market on earth. Yet every tool photographers use was built in America, priced in dollars, designed for a different world.
        </p>
        <p style={{ ...body("#000000", 500), margin: "20px auto 0" }}>
          MirrorAI is the first platform engineered from the ground up for Indian wedding photographers. Indian internet speeds. Indian pricing. Indian workflows. Indian intelligence.
        </p>
      </Fade>

      <div style={{ maxWidth: 660, margin: "30px auto", padding: isMobile ? "0 20px" : "0 24px" }}>
        <img src={IMAGES[5]} alt="" style={{ width: "100%", maxWidth: "100%", height: 400, objectFit: "cover", background: "#f5f0ea", borderRadius: 4, display: "block" }} />
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

      <FullImg src={IMAGES[6]} style={{ margin: "30px 0" }} />
      <FullImg src={IMAGES[7]} />

      {/* CLOSING MANIFESTO */}
      <Fade style={{ textAlign: "center", padding: isMobile ? "60px 20px 40px" : "80px 24px 60px", maxWidth: 620, margin: "0 auto" }}>
        <h2 style={{ ...heading("clamp(28px,6vw,48px)", true) }}>This Is Real Intelligence</h2>
        <GoldRule width={36} margin="20px auto" />
        <p style={{ ...body(), margin: "0 auto" }}>
          Not artificial. Not imported. Not borrowed. Built here, for here, by people who understand that an Indian wedding is not an event — it is an emotion that spans generations.
        </p>
        <p style={{ ...body("#000000", 500), margin: "20px auto 0" }}>
          MirrorAI exists because you deserve a platform as extraordinary as the weddings you photograph.
        </p>
      </Fade>

      <div style={{ maxWidth: 620, margin: "30px auto", padding: isMobile ? "0 20px" : "0 24px" }}>
        <img src={IMAGES[8]} alt="" style={{ width: "100%", maxWidth: "100%", height: 400, objectFit: "cover", background: "#f5f0ea", borderRadius: 4, display: "block" }} />
      </div>

      <FullImg src={IMAGES[9]} height="50vh" mobileHeight="35vh" style={{ marginTop: 30 }} />

      {/* ─── FOOTER ─── */}
      <footer style={{ textAlign: "center", padding: "60px 24px 40px", borderTop: "1px solid #F2F2F2" }}>
        <div style={{ fontFamily: playfair, fontSize: 20, fontWeight: 700, color: "#000000", marginBottom: 20 }}>Ready To Enter Real Intelligence?</div>
        <button onClick={() => navigate("/dashboard")} onMouseEnter={() => setFooterPillHover(true)} onMouseLeave={() => setFooterPillHover(false)} style={pillStyle(footerPillHover, true)}>
          ENTER REAL INTELLIGENCE →
        </button>
        <div style={{ fontFamily: mont, fontSize: 12, color: "#666666", marginTop: 32 }}>© MIRRORAI · THE REAL INTELLIGENCE</div>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#FFCC00", margin: "16px auto 0" }} />
      </footer>
    </div>
  );
}
