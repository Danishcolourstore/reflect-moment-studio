import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const playfair = '"Playfair Display", serif';
const mont = '"Montserrat", sans-serif';

const warmGrad = "linear-gradient(135deg, #f5f0ea 0%, #e8e0d4 50%, #f5f0ea 100%)";
const coolGrad = "linear-gradient(135deg, #eae4dc 0%, #d4ccc0 50%, #eae4dc 100%)";

const NAV_ITEMS = [
  { label: "HOME", path: "/home" },
  { label: "FEATURED", path: "#featured" },
  { label: "STORIES", path: "#stories" },
  { label: "TRENDING", path: "#trending" },
  { label: "UPDATES", path: "#updates" },
];

const PHOTOGRAPHERS = [
  { name: "Naman Verma", location: "DELHI", bio: "Fine art and editorial wedding photographer capturing love across India." },
  { name: "Joseph Radhik", location: "HYDERABAD", bio: "Storyteller of emotions, creating timeless wedding narratives." },
  { name: "Recall Pictures", location: "MUMBAI", bio: "Cinematic wedding films and photography for the modern couple." },
];

const STORIES = [
  { couple: "Meera & Arjun", loc: "Udaipur · Dec 2025", snippet: "A royal celebration at the City Palace that blended tradition with modern elegance." },
  { couple: "Priya & Karthik", loc: "Kerala · Jan 2026", snippet: "A houseboat ceremony on the backwaters that felt like a dream." },
  { couple: "Zara & Imran", loc: "Lucknow · Nov 2025", snippet: "A Nawabi nikah that honored centuries of tradition." },
  { couple: "Simran & Raj", loc: "Amritsar · Feb 2026", snippet: "An Anand Karaj at the Golden Temple, bathed in golden light." },
];

const TRENDS = [
  { name: "INTIMATE CEREMONIES", desc: "Small, meaningful gatherings replacing grand affairs" },
  { name: "PASTEL PALETTES", desc: "Soft pinks, lavenders, and sage greens dominating decor" },
  { name: "FILM PHOTOGRAPHY", desc: "The analog renaissance in wedding documentation" },
  { name: "DESTINATION SOUTH", desc: "Kerala, Goa, and Tamil Nadu as top wedding destinations" },
  { name: "SUSTAINABLE WEDDINGS", desc: "Eco-conscious celebrations gaining momentum" },
];

const UPDATES = [
  { date: "MARCH 2026", title: "Cheetah AI Culling — Now Live", desc: "Cull 20,000 photos in minutes. AI-powered smart selection that understands Indian wedding moments." },
  { date: "FEBRUARY 2026", title: "Ryfine Editor — Indian Skin Tone Presets", desc: "Color grading profiles built specifically for Indian weddings." },
  { date: "JANUARY 2026", title: "MirrorLive 2.0 — Real-Time Delivery", desc: "Share photos with guests instantly during the event. Now 3x faster." },
];

const ALL_FEATURES = [
  { name: "Face Recognition Delivery", desc: "Upload 20,000 photos. Every guest finds their own face. Delivered in minutes, not days." },
  { name: "MirrorLive — Real-Time Gallery", desc: "The baraat is happening. The photos are already in the family's hands." },
  { name: "Storybook — Instagram Carousel Builder", desc: "Shoot. Upload. Storybook turns your best frames into scroll-stopping carousels." },
  { name: "Cheetah — Fast Culling", desc: "20,000 photos. Culled in minutes. AI that knows which frames matter." },
  { name: "Ryfine — RI Editor", desc: "Color grading built for Indian skin tones, Indian light, Indian weddings." },
  { name: "Album Auto-Builder", desc: "Select your photos. Pick a style. The album builds itself." },
  { name: "Custom Photographer Websites", desc: "Your brand. Your domain. Premium websites that load fast on Indian networks." },
];

const STATS = [
  { num: "10M+", label: "WEDDINGS PER YEAR" },
  { num: "₹10L Cr", label: "INDUSTRY SIZE" },
  { num: "800+", label: "WEDDING TRADITIONS" },
];

/* ── helpers ── */

function useOnScreen(ref: React.RefObject<HTMLElement | null>) {
  const [v, setV] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.12 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return v;
}

function Fade({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const v = useOnScreen(ref);
  return <div ref={ref} style={{ ...style, opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease-out, transform 0.6s ease-out" }}>{children}</div>;
}

function GoldRule({ width = 48, margin = "28px auto" }: { width?: number; margin?: string }) {
  return <div style={{ width, height: 2, background: "#FFCC00", margin }} />;
}

function Lbl({ children, color = "#666666" }: { children: React.ReactNode; color?: string }) {
  return <p style={{ fontFamily: mont, fontSize: 11, fontWeight: 400, letterSpacing: "1.5px", textTransform: "uppercase", color, margin: 0 }}>{children}</p>;
}

function SHead({ label, labelColor = "#FFCC00", title, sub }: { label: string; labelColor?: string; title: string; sub?: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 40 }}>
      <Lbl color={labelColor}>{label}</Lbl>
      <h2 style={{ fontFamily: playfair, fontSize: "clamp(28px,6vw,44px)", fontWeight: 700, color: "#000000", letterSpacing: "0.5px", textAlign: "center", margin: "12px 0 0" }}>{title}</h2>
      <GoldRule width={36} margin="20px auto" />
      {sub && <p style={{ fontFamily: mont, fontSize: 15, color: "#666666", textAlign: "center", margin: 0 }}>{sub}</p>}
    </div>
  );
}

/* ── page ── */

export default function IntelligenceHome() {
  const navigate = useNavigate();
  const [navHov, setNavHov] = useState<number | null>(null);
  const [mob, setMob] = useState(window.innerWidth < 768);
  const [pillH, setPillH] = useState(false);
  const [footH, setFootH] = useState(false);

  useEffect(() => { const h = () => setMob(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, []);

  const go = (p: string) => { if (p.startsWith("#")) { document.getElementById(p.slice(1))?.scrollIntoView({ behavior: "smooth" }); } else { navigate(p); } };

  const pill = (hover: boolean, big = false): React.CSSProperties => ({
    fontFamily: mont, fontSize: big ? 12 : 10, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase",
    background: hover ? "#FFD633" : "#FFCC00", color: "#000000", border: "none", borderRadius: big ? 24 : 20,
    padding: big ? "16px 40px" : "8px 20px", cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.3s, transform 0.3s, box-shadow 0.3s",
    transform: hover && big ? "translateY(-2px)" : "translateY(0)", boxShadow: hover && big ? "0 6px 20px rgba(0,0,0,0.12)" : "none",
  });

  const body = (c = "#666666", w = 400): React.CSSProperties => ({ fontFamily: mont, fontSize: 15, fontWeight: w, color: c, lineHeight: 1.7, textAlign: "center", margin: 0 });
  const h1s = (s = "clamp(28px,6vw,48px)", it = false): React.CSSProperties => ({ fontFamily: playfair, fontSize: s, fontWeight: 700, color: "#000000", letterSpacing: "0.5px", textAlign: "center", margin: 0, fontStyle: it ? "italic" : "normal" });

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF", overflowY: "visible", height: "auto" }}>

      {/* pulse animation */}
      <style>{`@keyframes pp{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.02)}}`}</style>

      {/* ─── NAV ─── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "#FFFFFF", borderBottom: "1px solid #F2F2F2" }}>
        {/* top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 24px", height: 50 }}>
          <div style={{ fontFamily: playfair, fontSize: 18, fontStyle: "italic", color: "#FFCC00", lineHeight: 1 }}>M</div>
          <div style={{ fontFamily: playfair, fontSize: 26, fontWeight: 700, color: "#000000", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>Art Gallery</div>
          {!mob && <button onClick={() => navigate("/dashboard")} onMouseEnter={() => setPillH(true)} onMouseLeave={() => setPillH(false)} style={pill(pillH)}>REAL INTELLIGENCE →</button>}
          {mob && <div style={{ width: 20 }} />}
        </div>
        {/* by line */}
        <div style={{ textAlign: "center", paddingBottom: 4 }}>
          <span style={{ fontFamily: mont, fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#666666" }}>by MirrorAI</span>
        </div>
        {/* nav links */}
        <div style={{ display: "flex", justifyContent: "center", gap: 20, overflowX: "auto", paddingBottom: 10, paddingLeft: 16, paddingRight: 16, scrollbarWidth: "none" }}>
          {NAV_ITEMS.map((n, i) => {
            const active = i === 0;
            return (
              <button key={n.label} onClick={() => go(n.path)} onMouseEnter={() => setNavHov(i)} onMouseLeave={() => setNavHov(null)}
                style={{ fontFamily: mont, fontSize: 12, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase", color: active || navHov === i ? "#000000" : "#666666", background: "none", border: "none", borderBottom: active ? "2px solid #FFCC00" : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap", padding: "8px 0", minHeight: 44, transition: "color 0.3s", flexShrink: 0 }}>
                {n.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ─── FLOATING MOBILE CTA ─── */}
      {mob && (
        <button onClick={() => navigate("/dashboard")} style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 200, fontFamily: mont, fontSize: 11, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", background: "#FFCC00", color: "#000000", border: "none", borderRadius: 24, padding: "14px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.15)", cursor: "pointer", animation: "pp 2s ease-in-out infinite" }}>
          Enter Real Intelligence →
        </button>
      )}

      {/* ─── 3. HERO ─── */}
      <div style={{ position: "relative", minHeight: "70vh" }}>
        {/* TODO: Replace with real image URL */}
        <div style={{ width: "100%", height: "70vh", background: warmGrad }} />
      </div>

      <Fade style={{ textAlign: "center", padding: mob ? "60px 20px 40px" : "80px 24px 60px" }}>
        <Lbl color="#FFCC00">THE REAL INTELLIGENCE</Lbl>
        <h1 style={{ ...h1s("clamp(36px,8vw,64px)"), marginTop: 16, lineHeight: 1.15 }}>India Celebrates Love Like No Other Nation On Earth</h1>
        <GoldRule />
        <p style={{ ...body(), maxWidth: 620, margin: "0 auto" }}>Hindu, Muslim, Sikh, Christian, Jain, Buddhist, Parsi — every faith, every region, every ritual. From the saat pheras of a North Indian mandap to the thali tying of a Tamil ceremony. From a Kashmiri lavender garden to a Kerala houseboat. From a Nikah in Lucknow to an Anand Karaj in Amritsar.</p>
        <p style={{ ...body("#000000", 500), maxWidth: 620, margin: "16px auto 0" }}>No country on earth has this many ways of saying forever.</p>
        <p style={{ fontFamily: mont, fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: "#666666", marginTop: 12, textAlign: "center" }}>AND NO PLATFORM WAS EVER BUILT TO SERVE THE PHOTOGRAPHERS WHO CAPTURE IT ALL — UNTIL NOW.</p>
      </Fade>

      {/* 4. FULL WIDTH PLACEHOLDER */}
      {/* TODO: Replace with real image URL */}
      <div style={{ width: "100%", height: mob ? "35vh" : "50vh", background: warmGrad, margin: "30px 0" }} />

      {/* 5. THE TRUTH */}
      <Fade style={{ textAlign: "center", padding: mob ? "60px 20px 30px" : "80px 24px 40px", maxWidth: 660, margin: "0 auto" }}>
        <Lbl>THE TRUTH</Lbl>
        <h2 style={{ ...h1s(), marginTop: 12 }}>You Deserved Better. So We Built It.</h2>
        <GoldRule width={36} margin="20px auto" />
        <p style={{ ...body(), margin: "0 auto" }}>For years, Indian wedding photographers used platforms designed for 200-photo portrait sessions in Portland. You shoot 20,000 images across five days. You deliver to families of 500. You work on Indian internet, price in rupees, and create art that rivals cinema.</p>
        <p style={{ ...body("#000000", 500), margin: "20px auto 0" }}>The tools you were given were never made for you. MirrorAI is.</p>
      </Fade>

      {/* 6. FULL WIDTH PLACEHOLDER */}
      {/* TODO: Replace with real image URL */}
      <div style={{ width: "100%", height: mob ? "30vh" : "45vh", background: coolGrad, margin: "30px 0" }} />

      {/* 7. FEATURED PHOTOGRAPHERS */}
      <Fade style={{ padding: mob ? "60px 20px 0" : "80px 24px 0", maxWidth: 900, margin: "0 auto" }}>
        <div id="featured">
          <SHead label="SPOTLIGHT" title="Featured Photographers" sub="Celebrating the artists who define Indian wedding photography." />
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr 1fr", gap: 24 }}>
            {PHOTOGRAPHERS.map((p, i) => (
              <div key={i} style={{ border: "1px solid #F2F2F2", overflow: "hidden", transition: "transform 0.3s" }} onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-3px)")} onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                {/* TODO: Replace with real image URL */}
                <div style={{ height: 280, background: warmGrad }} />
                <div style={{ padding: 24 }}>
                  <div style={{ fontFamily: playfair, fontSize: 20, fontWeight: 700, color: "#000000" }}>{p.name}</div>
                  <div style={{ fontFamily: mont, fontSize: 12, color: "#666666", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 4 }}>{p.location}</div>
                  <p style={{ fontFamily: mont, fontSize: 14, color: "#666666", lineHeight: 1.6, marginTop: 12, margin: "12px 0 0" }}>{p.bio}</p>
                  <div style={{ fontFamily: mont, fontSize: 12, fontWeight: 600, color: "#000000", marginTop: 12, cursor: "pointer" }}>View Work →</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Fade>

      {/* 8. COMMUNITY STORIES */}
      <Fade style={{ padding: mob ? "60px 20px 0" : "80px 24px 0", maxWidth: 900, margin: "0 auto" }}>
        <div id="stories">
          <SHead label="COMMUNITY" title="Love Stories From Our Community" />
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 20 }}>
            {STORIES.map((s, i) => (
              <div key={i} style={{ border: "1px solid #F2F2F2", overflow: "hidden", transition: "transform 0.3s" }} onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-3px)")} onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                {/* TODO: Replace with real image URL */}
                <div style={{ height: 200, background: i % 2 === 0 ? warmGrad : coolGrad }} />
                <div style={{ padding: 20 }}>
                  <div style={{ fontFamily: playfair, fontSize: 18, fontWeight: 700, color: "#000000" }}>{s.couple}</div>
                  <div style={{ fontFamily: mont, fontSize: 12, color: "#666666", marginTop: 4 }}>{s.loc}</div>
                  <p style={{ fontFamily: mont, fontSize: 14, color: "#666666", lineHeight: 1.6, marginTop: 8, margin: "8px 0 0" }}>{s.snippet}</p>
                  <div style={{ fontFamily: mont, fontSize: 12, fontWeight: 600, color: "#000000", marginTop: 8, cursor: "pointer" }}>Read Story →</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Fade>

      {/* 9. TRENDING STYLES */}
      <Fade style={{ padding: mob ? "60px 0 0" : "80px 0 0" }}>
        <div id="trending" style={{ maxWidth: 900, margin: "0 auto", paddingLeft: mob ? 20 : 24, paddingRight: mob ? 20 : 24 }}>
          <SHead label="TRENDING NOW" title="Wedding Styles That Define 2026" />
        </div>
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingLeft: mob ? 20 : "calc((100% - 900px) / 2 + 24px)", paddingRight: 20, paddingBottom: 8, scrollbarWidth: "none" }}>
          {TRENDS.map((t, i) => (
            <div key={i} style={{ flexShrink: 0, width: 260 }}>
              {/* TODO: Replace with real image URL */}
              <div style={{ height: 320, background: i % 2 === 0 ? warmGrad : coolGrad, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 16px 16px", background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}>
                  <div style={{ fontFamily: mont, fontSize: 12, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#FFFFFF" }}>{t.name}</div>
                </div>
              </div>
              <p style={{ fontFamily: mont, fontSize: 13, color: "#666666", padding: "16px 0 0", margin: 0 }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </Fade>

      {/* 10. UPDATES */}
      <Fade style={{ padding: mob ? "60px 20px 0" : "80px 24px 0", maxWidth: 660, margin: "0 auto" }}>
        <div id="updates">
          <SHead label="PRODUCT UPDATES" title="What's New In MirrorAI" />
          {UPDATES.map((u, i) => (
            <div key={i} style={{ padding: "24px 0", borderBottom: "1px solid #F2F2F2" }}>
              <div style={{ fontFamily: mont, fontSize: 10, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#FFCC00" }}>{u.date}</div>
              <div style={{ fontFamily: playfair, fontSize: 20, fontWeight: 700, color: "#000000", marginTop: 8 }}>{u.title}</div>
              <p style={{ fontFamily: mont, fontSize: 14, color: "#666666", lineHeight: 1.6, margin: "8px 0 0" }}>{u.desc}</p>
            </div>
          ))}
        </div>
      </Fade>

      {/* 11. FULL WIDTH PLACEHOLDER */}
      {/* TODO: Replace with real image URL */}
      <div style={{ width: "100%", height: mob ? "35vh" : "50vh", background: warmGrad, margin: "60px 0 30px" }} />

      {/* 12. FEATURES EDITORIAL */}
      <Fade style={{ maxWidth: 660, margin: "0 auto", padding: mob ? "60px 20px 0" : "80px 24px 0" }}>
        <Lbl color="#FFCC00">WHAT REAL INTELLIGENCE LOOKS LIKE</Lbl>
        <div style={{ marginTop: 50 }}>
          {ALL_FEATURES.map((f, i) => (
            <div key={i} style={{ marginBottom: 40 }}>
              <h3 style={{ fontFamily: playfair, fontSize: 24, fontWeight: 700, color: "#000000", margin: 0 }}>{f.name}</h3>
              <div style={{ width: 24, height: 2, background: "#FFCC00", margin: "10px 0 16px 0" }} />
              <p style={{ ...body(), textAlign: "left" }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ width: "50%", height: 1, background: "#FFCC00", margin: "50px auto" }} />
      </Fade>

      {/* 13. WHY INDIA */}
      <Fade style={{ textAlign: "center", padding: mob ? "60px 20px 20px" : "80px 24px 20px", maxWidth: 660, margin: "0 auto" }}>
        <Lbl>WHY NOW</Lbl>
        <h2 style={{ ...h1s(), marginTop: 12 }}>Built For The ₹10 Lakh Crore Industry</h2>
        <GoldRule width={36} margin="20px auto" />
        <p style={{ ...body(), margin: "0 auto" }}>India hosts over 10 million weddings every year. A ₹10 lakh crore industry — the largest wedding market on earth. Yet every tool photographers use was built in America, priced in dollars, designed for a different world.</p>
        <p style={{ ...body("#000000", 500), margin: "20px auto 0" }}>MirrorAI is the first platform engineered from the ground up for Indian wedding photographers. Indian internet speeds. Indian pricing. Indian workflows. Indian intelligence.</p>
      </Fade>

      {/* 14. STATS */}
      <Fade style={{ display: "flex", flexDirection: mob ? "column" : "row", justifyContent: "center", alignItems: "center", gap: mob ? 30 : 40, padding: mob ? "40px 20px" : "60px 24px" }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: playfair, fontSize: 52, fontWeight: 700, color: "#FFCC00", lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontFamily: mont, fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "#666666", marginTop: 8 }}>{s.label}</div>
          </div>
        ))}
      </Fade>

      {/* 15. ENTER RI BANNER */}
      <Fade style={{ textAlign: "center", padding: mob ? "60px 20px" : "80px 24px", background: "#FAFAFA" }}>
        <h2 style={{ fontFamily: playfair, fontSize: 32, fontWeight: 700, color: "#000000", margin: 0 }}>Ready To Create?</h2>
        <p style={{ ...body(), margin: "12px auto 0" }}>Enter Real Intelligence and start building.</p>
        <button onClick={() => navigate("/dashboard")} onMouseEnter={() => setFootH(true)} onMouseLeave={() => setFootH(false)} style={{ ...pill(footH, true), marginTop: 28 }}>ENTER REAL INTELLIGENCE →</button>
      </Fade>

      {/* 16. CLOSING MANIFESTO */}
      <Fade style={{ textAlign: "center", padding: mob ? "60px 20px 40px" : "80px 24px 60px", maxWidth: 620, margin: "0 auto" }}>
        <h2 style={{ ...h1s("clamp(28px,6vw,48px)", true) }}>This Is Real Intelligence</h2>
        <GoldRule width={36} margin="20px auto" />
        <p style={{ ...body(), margin: "0 auto" }}>Not artificial. Not imported. Not borrowed. Built here, for here, by people who understand that an Indian wedding is not an event — it is an emotion that spans generations.</p>
        <p style={{ ...body("#000000", 500), margin: "20px auto 0" }}>MirrorAI exists because you deserve a platform as extraordinary as the weddings you photograph.</p>
      </Fade>

      {/* 17. FOOTER */}
      <footer style={{ textAlign: "center", padding: "40px 24px", borderTop: "1px solid #F2F2F2" }}>
        <div style={{ fontFamily: mont, fontSize: 12, color: "#666666" }}>© ART GALLERY by MIRRORAI · THE REAL INTELLIGENCE</div>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#FFCC00", margin: "16px auto 0" }} />
      </footer>
    </div>
  );
}
