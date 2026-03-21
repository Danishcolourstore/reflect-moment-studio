import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DrawerMenu, HamburgerButton, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { EntiranButton } from "@/components/entiran/EntiranButton";
import { EntiranPanel } from "@/components/entiran/EntiranPanel";

const playfair = '"Playfair Display", serif';
const mont = '"Montserrat", sans-serif';

const POSTS = [
  { name: "COLOURS OF LIFE", date: "March 27, 2026 · Calicut, Kerala", desc: "Vibrant celebrations capturing the essence of Kerala's wedding traditions.", photos: 52, likes: 146, views: "1.2K", warm: true },
  { name: "MIRROR", date: "March 9, 2026 · Calicut, Kerala", desc: "Reflections of a beautiful beginning.", photos: 34, likes: 89, views: "840", warm: false },
  { name: "COLOUR STORE", date: "March 19, 2026 · Calicut, Kerala", desc: "When every frame tells a story of colour and emotion.", photos: 28, likes: 203, views: "2.1K", warm: true },
  { name: "GOLDEN HOUR", date: "February 14, 2026 · Munnar, Kerala", desc: "A destination celebration wrapped in golden light and mountain mist.", photos: 67, likes: 312, views: "3.4K", warm: false },
  { name: "TIMELESS", date: "January 5, 2026 · Kochi, Kerala", desc: "Classic moments that transcend time.", photos: 41, likes: 178, views: "1.8K", warm: true },
];

const warmGrad = "linear-gradient(135deg, #f5f0ea 0%, #e8e0d4 50%, #f5f0ea 100%)";
const coolGrad = "linear-gradient(135deg, #eae4dc 0%, #d4ccc0 50%, #eae4dc 100%)";

const HeartIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const EyeIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

function useOnScreen(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

function FeedPost({ post, index, mob }: { post: typeof POSTS[0]; index: number; mob: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useOnScreen(ref);
  const [hovered, setHovered] = useState(false);

  const iconSize = mob ? 16 : 18;

  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.5s ease, transform 0.5s ease", transitionDelay: `${index * 0.05}s` }}>
      {/* Image — full bleed */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: mob ? "calc(100% + 32px)" : "100%",
          marginLeft: mob ? -16 : 0,
          overflow: "hidden",
          transform: hovered ? "scale(1.01)" : "scale(1)",
          transition: "transform 0.4s ease",
          position: "relative",
        }}
      >
        <img
          src={`/images/gallery-${(index % 8) + 1}.jpg`}
          alt={post.name}
          style={{ width: "100%", height: "auto", objectFit: "cover", display: "block" }}
        />
      </div>

      {/* Name */}
      <div style={{ fontFamily: playfair, fontSize: mob ? 16 : 20, fontWeight: 700, color: "#000000", letterSpacing: 0.5, marginTop: mob ? 16 : 20, textTransform: "uppercase" as const }}>{post.name}</div>

      {/* Date */}
      <div style={{ fontFamily: mont, fontSize: mob ? 12 : 13, color: "#666666", marginTop: 6 }}>{post.date}</div>

      {/* Desc */}
      <div style={{ fontFamily: mont, fontSize: mob ? 13 : 14, color: "#666666", lineHeight: 1.6, marginTop: 10 }}>{post.desc}</div>

      {/* Photo count */}
      <div style={{ fontFamily: mont, fontSize: mob ? 10 : 11, color: "#999999", marginTop: 8 }}>{post.photos} photos</div>

      {/* Engagement */}
      <div style={{ display: "flex", gap: 16, marginTop: mob ? 12 : 14, alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: mont, fontSize: mob ? 11 : 12, color: "#666666" }}><HeartIcon size={iconSize} />{post.likes}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: mont, fontSize: mob ? 11 : 12, color: "#666666" }}><EyeIcon size={iconSize} />{post.views} views</span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#F2F2F2", marginTop: mob ? 20 : 24 }} />
    </div>
  );
}

export default function LandingGate() {
  const navigate = useNavigate();
  const drawer = useDrawerMenu();
  const [riHov, setRiHov] = useState(false);
  const [agHov, setAgHov] = useState(false);
  const [botOpen, setBotOpen] = useState(false);
  const [mob, setMob] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!document.getElementById("lg-fonts")) {
      const link = document.createElement("link");
      link.id = "lg-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&family=Montserrat:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF", overflowY: "visible" as const }}>

      {/* ── TOP BAR ── */}
      <div style={{ position: "sticky" as const, top: 0, zIndex: 100, background: "#FFFFFF", height: mob ? 48 : 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: mob ? "0 16px" : "0 20px", borderBottom: "1px solid #F2F2F2" }}>
        <button onClick={drawer.toggle} style={{ background: "none", border: "none", fontFamily: mont, fontSize: mob ? 9 : 10, fontWeight: 600, letterSpacing: "1.5px", color: "#666666", cursor: "pointer", textTransform: "uppercase" as const, minHeight: 44 }}>MENU</button>
        <span style={{ fontFamily: playfair, fontSize: mob ? 14 : 16, fontWeight: 700, color: "#000000" }}>Danish Subair</span>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFCC00" }} />
      </div>

      {/* ── PROFILE INTRO ── */}
      <div style={{ padding: mob ? "28px 16px" : "40px 24px", textAlign: "center" as const, animation: "fade-in-up 0.5s ease both" }}>
        <style>{`@keyframes fade-in-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ width: mob ? 64 : 80, height: mob ? 64 : 80, borderRadius: "50%", background: warmGrad, margin: "0 auto 12px" }} />
        <div style={{ fontFamily: playfair, fontSize: mob ? 20 : 24, fontWeight: 700, color: "#000000" }}>Danish Subair</div>
        <div style={{ fontFamily: mont, fontSize: mob ? 11 : 12, color: "#666666", marginTop: 4 }}>@colourstore</div>
        <div style={{ fontFamily: mont, fontSize: mob ? 10 : 11, color: "#666666", letterSpacing: "1px", marginTop: 6, textTransform: "uppercase" as const }}>CALICUT, KERALA</div>
        <div style={{ fontFamily: mont, fontSize: mob ? 12 : 13, color: "#666666", maxWidth: 320, margin: "10px auto 0", lineHeight: 1.6 }}>Wedding photographer capturing love stories across India.</div>
        <div style={{ width: 24, height: 2, background: "#FFCC00", margin: mob ? "12px auto" : "16px auto" }} />
      </div>

      {/* ── STATS ── */}
      <div style={{ display: "flex", justifyContent: "center", gap: mob ? 24 : 32, padding: mob ? "0 16px 20px" : "0 24px 24px" }}>
        {[["5", "Events"], ["248", "Photos"], ["1.2K", "Views"]].map(([n, l]) => (
          <div key={l} style={{ textAlign: "center" as const }}>
            <div style={{ fontFamily: playfair, fontSize: mob ? 18 : 20, fontWeight: 700, color: "#000000" }}>{n}</div>
            <div style={{ fontFamily: mont, fontSize: mob ? 9 : 10, color: "#666666", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ── QUOTE ── */}
      <div style={{ padding: mob ? "24px 16px" : "32px 24px", background: "#FAFAFA", textAlign: "center" as const }}>
        <div style={{ fontFamily: playfair, fontSize: mob ? 16 : 18, fontWeight: 400, fontStyle: "italic", color: "#000000", maxWidth: 480, margin: "0 auto", lineHeight: 1.5 }}>You feel. I focus. We frame.</div>
        <div style={{ fontFamily: mont, fontSize: 12, color: "#666666", marginTop: 8 }}>—</div>
      </div>

      {/* ── FEED ── */}
      <div style={{ maxWidth: 660, margin: "0 auto", padding: mob ? "20px 16px" : "24px 20px" }}>
        <div style={{ fontFamily: mont, fontSize: mob ? 9 : 10, letterSpacing: "1.5px", color: "#FFCC00", textTransform: "uppercase" as const }}>RECENT WORK</div>
        <div style={{ fontFamily: playfair, fontSize: mob ? 22 : 28, fontWeight: 700, color: "#000000", marginTop: 4 }}>Your Moments</div>
        <div style={{ width: 24, height: 2, background: "#FFCC00", margin: mob ? "10px 0 24px" : "12px 0 32px" }} />

        <div style={{ display: "flex", flexDirection: "column" as const, gap: mob ? 40 : 48 }}>
          {POSTS.map((p, i) => <FeedPost key={i} post={p} index={i} mob={mob} />)}
        </div>
      </div>

      {/* ── QUOTE 2 ── */}
      <div style={{ padding: mob ? "36px 16px" : "48px 24px", textAlign: "center" as const }}>
        <div style={{ fontFamily: playfair, fontSize: mob ? 14 : 16, fontStyle: "italic", color: "#666666" }}>We are creating fiction out of reality.</div>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#FFCC00", margin: "16px auto 0" }} />
      </div>

      {/* ── BUTTONS ── */}
      <div style={{ maxWidth: 400, margin: "0 auto", padding: mob ? "28px 16px" : "40px 24px" }}>
        <button
          onClick={() => navigate("/dashboard")}
          onMouseEnter={() => setRiHov(true)}
          onMouseLeave={() => setRiHov(false)}
          style={{ width: "100%", height: mob ? 44 : 48, background: riHov ? "#1a1a1a" : "#080808", color: "#F0EDE8", border: "none", fontFamily: mont, fontSize: mob ? 10 : 11, letterSpacing: "1.5px", cursor: "pointer", transition: "background 0.3s", textTransform: "uppercase" as const, marginBottom: 12 }}
        >ENTER REAL INTELLIGENCE →</button>
        <button
          onClick={() => navigate("/art-gallery")}
          onMouseEnter={() => setAgHov(true)}
          onMouseLeave={() => setAgHov(false)}
          style={{ width: "100%", height: mob ? 44 : 48, background: agHov ? "#FFCC00" : "transparent", color: "#000000", border: "1px solid #FFCC00", fontFamily: mont, fontSize: mob ? 10 : 11, letterSpacing: "1.5px", cursor: "pointer", transition: "all 0.3s", textTransform: "uppercase" as const }}
        >EXPLORE ART GALLERY →</button>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ padding: mob ? "24px 16px" : "32px 24px", textAlign: "center" as const, paddingBottom: `calc(24px + env(safe-area-inset-bottom, 0px))` }}>
        <div style={{ fontFamily: mont, fontSize: 10, color: "#CCCCCC" }}>© MirrorAI · Real Intelligence</div>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#FFCC00", margin: "12px auto 0" }} />
      </div>

      {/* Drawer */}
      <DrawerMenu open={drawer.open} onClose={drawer.close} />

      {/* Entiran AI Bot */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200 }}>
        <EntiranButton onClick={() => setBotOpen(o => !o)} unreadCount={0} />
      </div>
      <EntiranPanel open={botOpen} onClose={() => setBotOpen(false)} pendingSuggestionCount={0} />
    </div>
  );
}
