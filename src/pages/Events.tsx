import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";

const playfair = '"Playfair Display", serif';
const montserrat = '"Montserrat", sans-serif';

const NAV_ITEMS = [
  { label: "HOME", path: "/home" },
  { label: "EVENTS", path: "/dashboard/events" },
  { label: "STORYBOOK", path: "/dashboard/storybook" },
  { label: "CHEETAH", path: "/dashboard/cheetah" },
  { label: "RYFINE", path: "/refyn" },
  { label: "ANALYTICS", path: "/dashboard/analytics" },
  { label: "WEBSITE", path: "/dashboard/website-editor" },
  { label: "MORE", path: "__drawer__" },
];

const STORIES = [
  {
    names: "TRISHA & NIHAAL",
    date: "October 13, 2022",
    snippet: "It unfolded like a scene straight out of a movie as Nihaal & Trisha took their last phera.",
    tags: "Tags: destination weddings, Luxury wedding, Hyderabad",
    comments: 33,
    likes: 146,
  },
  {
    names: "ALISHA & RAHUL",
    date: "May 20, 2021",
    snippet: "A celebration that painted the town in hues of love and tradition.",
    tags: "Tags: traditional wedding, Grand celebration, Udaipur",
    comments: 21,
    likes: 98,
  },
  {
    names: "KAVYA & KARAN",
    date: "June 4, 2021",
    snippet: "Two souls, one journey — from the ghats of Varanasi to forever.",
    tags: "Tags: intimate wedding, Heritage venue, Varanasi",
    comments: 18,
    likes: 112,
  },
  {
    names: "SHRAVYA & SHARAN",
    date: "May 10, 2020",
    snippet: "When the monsoon rains blessed their union, every frame became poetry.",
    tags: "Tags: monsoon wedding, South Indian, Kochi",
    comments: 27,
    likes: 134,
  },
  {
    names: "TANYA & NEEV",
    date: "March 15, 2023",
    snippet: "A pastel dream woven with laughter, music, and endless celebrations.",
    tags: "Tags: pastel theme, Modern wedding, Jaipur",
    comments: 42,
    likes: 201,
  },
];

function FadeCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      {children}
    </div>
  );
}

export default function Events() {
  const navigate = useNavigate();
  const drawer = useDrawerMenu();
  const [navHover, setNavHover] = useState<number | null>(null);
  const [imgHover, setImgHover] = useState<number | null>(null);
  const [readHover, setReadHover] = useState<number | null>(null);
  const [mob, setMob] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#FFFFFF", overflow: "visible" }}>
      {/* NAV */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#FFFFFF",
          borderBottom: "1px solid #F2F2F2",
          padding: mob ? "8px 16px" : "12px 20px",
          paddingTop: mob ? "calc(8px + env(safe-area-inset-top, 0px))" : "calc(12px + env(safe-area-inset-top, 0px))",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: mob ? 6 : 8 }}>
          <span
            style={{ fontFamily: playfair, fontSize: mob ? 18 : 24, fontWeight: 700, color: "#000000", cursor: "pointer" }}
            onClick={() => navigate("/home")}
          >
            MirrorAI
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: mob ? 12 : 20,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {NAV_ITEMS.map((item, i) => {
            const isActive = item.label === "EVENTS";
            const isHov = navHover === i;
            return (
              <button
                key={item.label}
                onClick={() => item.path === "__drawer__" ? drawer.toggle() : navigate(item.path)}
                onMouseEnter={() => setNavHover(i)}
                onMouseLeave={() => setNavHover(null)}
                style={{
                  fontFamily: montserrat,
                  fontSize: mob ? 10 : 14,
                  fontWeight: 400,
                  textTransform: "uppercase" as const,
                  letterSpacing: "1px",
                  color: isActive || isHov ? "#000000" : "#666666",
                  background: "none",
                  border: "none",
                  borderBottom: isActive ? "2px solid #000000" : "2px solid transparent",
                  textDecoration: isHov && !isActive ? "underline" : "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap" as const,
                  padding: mob ? "8px 0" : "12px 0",
                  minHeight: 44,
                  transition: "color 0.3s",
                  flexShrink: 0,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* STORY CARDS */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: mob ? "24px 0" : "40px 0" }}>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: mob ? 40 : 48 }}>
          {STORIES.map((s, i) => (
            <FadeCard key={i}>
              {/* Cover Image — full bleed */}
              <div
                style={{
                  overflow: "hidden",
                  lineHeight: 0,
                  transform: imgHover === i ? "scale(1.02)" : "scale(1)",
                  transition: "transform 0.4s ease",
                }}
                onMouseEnter={() => setImgHover(i)}
                onMouseLeave={() => setImgHover(null)}
              >
                <img src={`/images/gallery-${(i % 8) + 1}.jpg`} alt={s.names} style={{ width: "100%", height: "auto", objectFit: "cover", display: "block" }} />
              </div>

              {/* Text content with padding */}
              <div style={{ padding: mob ? "0 16px" : "0 20px" }}>
              {/* Couple Names */}
              <div
                style={{
                  fontFamily: playfair,
                  fontSize: mob ? 16 : 18,
                  fontWeight: 700,
                  color: "#000000",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.5px",
                  marginTop: mob ? 16 : 20,
                }}
              >
                {s.names}
              </div>

              {/* Date */}
              <div style={{ fontFamily: montserrat, fontSize: mob ? 12 : 14, fontWeight: 400, color: "#666666", marginTop: 6 }}>
                {s.date}
              </div>

              {/* Snippet */}
              <div
                style={{
                  fontFamily: montserrat,
                  fontSize: mob ? 13 : 15,
                  fontWeight: 400,
                  color: "#000000",
                  lineHeight: 1.6,
                  marginTop: 10,
                }}
              >
                {s.snippet}
              </div>

              {/* Read More */}
              <div
                style={{ marginTop: 8 }}
                onMouseEnter={() => setReadHover(i)}
                onMouseLeave={() => setReadHover(null)}
              >
                <span
                  style={{
                    fontFamily: montserrat,
                    fontSize: mob ? 12 : 14,
                    fontWeight: 500,
                    color: "#000000",
                    textDecoration: readHover === i ? "underline" : "none",
                    cursor: "pointer",
                  }}
                >
                  Read More
                </span>
              </div>

              {/* Tags */}
              <div
                style={{
                  fontFamily: montserrat,
                  fontSize: mob ? 11 : 13,
                  fontWeight: 400,
                  color: "#666666",
                  marginTop: 12,
                }}
              >
                {s.tags}
              </div>

              {/* Engagement Row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontFamily: montserrat,
                  fontSize: mob ? 11 : 13,
                  color: "#666666",
                  marginTop: 14,
                  paddingBottom: 12,
                }}
              >
                <span>{s.comments} Comments · Share</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {s.likes} Likes
                </span>
              </div>
              </div>{/* close text padding wrapper */}
            </FadeCard>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ textAlign: "center", padding: mob ? "40px 16px 28px" : "60px 20px 40px", paddingBottom: `calc(${mob ? 28 : 40}px + env(safe-area-inset-bottom, 0px))` }}>
        <div style={{ fontFamily: montserrat, fontSize: mob ? 10 : 12, color: "#666666" }}>© MIRRORAI</div>
      </footer>
      <DrawerMenu open={drawer.open} onClose={drawer.close} />
    </div>
  );
}
