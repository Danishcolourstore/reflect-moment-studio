import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";

const playfair = '"Playfair Display", serif';
const mont = '"Montserrat", sans-serif';

const NAV_ITEMS = [
  { label: "HOME", id: "top" },
  { label: "FEED", id: "feed", isRoute: true },
  { label: "NEWS", id: "news" },
  { label: "STORIES", id: "stories" },
  { label: "DISCOVER", id: "discover" },
];

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail: string;
  source: string;
}

const FALLBACK_NEWS: NewsItem[] = [
  {
    title: "New Sony A1 II — Full Frame Gets Major Update",
    link: "#",
    pubDate: "2026-03-18",
    description: "Sony's flagship mirrorless camera receives a significant hardware and software overhaul.",
    thumbnail: "",
    source: "PETAPIXEL",
  },
  {
    title: "The Rise of Film Photography at Indian Weddings",
    link: "#",
    pubDate: "2026-03-12",
    description: "Couples are increasingly requesting analog photography alongside digital.",
    thumbnail: "",
    source: "FSTOPPERS",
  },
  {
    title: "Best Lenses for Wedding Photography in 2026",
    link: "#",
    pubDate: "2026-02-28",
    description: "A comprehensive guide to the sharpest, fastest lenses for wedding photographers.",
    thumbnail: "",
    source: "DIY PHOTOGRAPHY",
  },
];

const STORIES = [
  {
    couple: "Meera & Arjun",
    loc: "Udaipur · Dec 2025",
    snippet: "A royal celebration at City Palace that blended tradition with modern elegance.",
  },
  {
    couple: "Priya & Karthik",
    loc: "Kerala · Jan 2026",
    snippet: "A houseboat ceremony on the backwaters that felt like a dream.",
  },
  { couple: "Zara & Imran", loc: "Lucknow · Nov 2025", snippet: "A Nawabi nikah that honored centuries of tradition." },
  {
    couple: "Simran & Raj",
    loc: "Amritsar · Feb 2026",
    snippet: "An Anand Karaj at the Golden Temple, bathed in golden light.",
  },
];

const DISCOVER_PHOTOGRAPHERS = [
  { name: "Naman Verma", loc: "Delhi" },
  { name: "Joseph Radhik", loc: "Hyderabad" },
  { name: "Recall Pictures", loc: "Mumbai" },
  { name: "The Wedding Filmer", loc: "Mumbai" },
  { name: "Plush Affairs", loc: "Delhi" },
  { name: "Beginnings For You", loc: "Kochi" },
  { name: "Infinite Memories", loc: "Pune" },
  { name: "Shades Photography", loc: "Bangalore" },
];

const warmGrad = "linear-gradient(135deg, #f5f0ea, #e8e0d4, #f5f0ea)";
const coolGrad = "linear-gradient(135deg, #eae4dc, #d4ccc0, #eae4dc)";

function useOnScreen(ref: React.RefObject<HTMLElement | null>) {
  const [v, setV] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setV(true);
      },
      { threshold: 0.12 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return v;
}

function Fade({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const v = useOnScreen(ref);
  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: v ? 1 : 0,
        transform: v ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
      }}
    >
      {children}
    </div>
  );
}

export default function IntelligenceHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [activeNav, setActiveNav] = useState(0);
  const [pillH, setPillH] = useState(false);
  const [news, setNews] = useState<NewsItem[]>(FALLBACK_NEWS);
  const [newsLoading, setNewsLoading] = useState(true);

  // Feed data removed — feed is now a separate page at /feed/:username

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!document.getElementById("ag-fonts")) {
      const link = document.createElement("link");
      link.id = "ag-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&family=Montserrat:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const feeds = [
      { url: "https://api.rss2json.com/v1/api.json?rss_url=https://petapixel.com/feed/", source: "PETAPIXEL" },
      { url: "https://api.rss2json.com/v1/api.json?rss_url=https://fstoppers.com/feed", source: "FSTOPPERS" },
      {
        url: "https://api.rss2json.com/v1/api.json?rss_url=https://www.diyphotography.net/feed/",
        source: "DIY PHOTOGRAPHY",
      },
    ];
    Promise.all(
      feeds.map((f) =>
        fetch(f.url)
          .then((r) => r.json())
          .then((d) =>
            (d.items || []).map((it: any) => ({
              title: it.title,
              link: it.link,
              pubDate: it.pubDate,
              description: (it.description || "").replace(/<[^>]+>/g, "").slice(0, 120) + "…",
              thumbnail: it.thumbnail || it.enclosure?.link || "",
              source: f.source,
            })),
          )
          .catch(() => [] as NewsItem[]),
      ),
    ).then((results) => {
      const all = results
        .flat()
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        .slice(0, 6);
      if (all.length > 0) setNews(all);
      setNewsLoading(false);
    });
  }, []);

  const goToFeed = async () => {
    if (!user) { navigate("/feed/community"); return; }
    // Get username/slug for the photographer's public feed
    const { data: sp } = await (supabase.from("studio_profiles").select("username") as any)
      .eq("user_id", user.id).maybeSingle();
    if (sp?.username) { navigate(`/feed/${sp.username}`); return; }
    const { data: dom } = await (supabase.from("domains").select("subdomain") as any)
      .eq("user_id", user.id).maybeSingle();
    if (dom?.subdomain) { navigate(`/feed/${dom.subdomain}`); return; }
    // fallback: use email prefix
    const slug = (user.email || "photographer").split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
    navigate(`/feed/${slug}`);
  };

  const scrollTo = (id: string, idx: number, isRoute?: boolean) => {
    setActiveNav(idx);
    if (isRoute && id === "feed") { goToFeed(); return; }
    if (id === "top") window.scrollTo({ top: 0, behavior: "smooth" });
    else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const px = mob ? 16 : 24;

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF", overflowY: "visible" }}>
      {/* ─── NAV ─── */}
      <nav
        style={{ position: "sticky", top: 0, zIndex: 100, background: "#FFFFFF", borderBottom: "1px solid #F2F2F2" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `8px ${px}px`,
            height: mob ? 44 : 50,
          }}
        >
          <div style={{ fontFamily: playfair, fontSize: mob ? 16 : 18, fontStyle: "italic", color: "#FFCC00" }}>M</div>
          <div
            style={{
              fontFamily: playfair,
              fontSize: mob ? 18 : 26,
              fontWeight: 700,
              color: "#000000",
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            Art Gallery
          </div>
          {!mob && (
            <button
              onClick={() => navigate("/dashboard")}
              onMouseEnter={() => setPillH(true)}
              onMouseLeave={() => setPillH(false)}
              style={{
                fontFamily: mont,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "1px",
                textTransform: "uppercase" as const,
                background: pillH ? "#FFD633" : "#FFCC00",
                color: "#000000",
                border: "none",
                borderRadius: 20,
                padding: "8px 20px",
                cursor: "pointer",
                transition: "background 0.3s",
              }}
            >
              REAL INTELLIGENCE →
            </button>
          )}
          {mob && <div style={{ width: 20 }} />}
        </div>
        <div style={{ textAlign: "center", paddingBottom: 2 }}>
          <span
            style={{
              fontFamily: mont,
              fontSize: mob ? 8 : 9,
              letterSpacing: "2px",
              textTransform: "uppercase" as const,
              color: "#666666",
            }}
          >
            by MirrorAI
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: mob ? 12 : 20,
            overflowX: "auto",
            paddingBottom: 8,
            padding: `0 ${px}px 8px`,
            scrollbarWidth: "none" as const,
          }}
        >
          {NAV_ITEMS.map((n, i) => (
            <button
              key={n.label}
              onClick={() => scrollTo(n.id, i, (n as any).isRoute)}
              style={{
                fontFamily: mont,
                fontSize: mob ? 10 : 12,
                fontWeight: 500,
                letterSpacing: "1px",
                textTransform: "uppercase" as const,
                color: activeNav === i ? "#000000" : "#666666",
                background: "none",
                border: "none",
                borderBottom: activeNav === i ? "2px solid #FFCC00" : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                padding: mob ? "6px 0" : "8px 0",
                minHeight: 44,
                transition: "color 0.3s",
                flexShrink: 0,
              }}
            >
              {n.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ─── MOBILE CTA ─── */}
      {mob && (
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            fontFamily: mont,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase" as const,
            background: "#FFCC00",
            color: "#000000",
            border: "none",
            borderRadius: 24,
            padding: "12px 24px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
            cursor: "pointer",
          }}
        >
          Enter Real Intelligence →
        </button>
      )}

      {/* ─── HERO ─── */}
      <div id="feed">
        <div style={{ width: "100%", height: mob ? "50vw" : "40vw", maxHeight: 500, background: warmGrad }} />
      </div>

      <Fade style={{ textAlign: "center", padding: `${mob ? 32 : 60}px ${px}px ${mob ? 24 : 40}px` }}>
        <p
          style={{
            fontFamily: mont,
            fontSize: mob ? 9 : 11,
            letterSpacing: "1.5px",
            textTransform: "uppercase" as const,
            color: "#FFCC00",
            margin: 0,
          }}
        >
          THE REAL INTELLIGENCE
        </p>
        <h1
          style={{
            fontFamily: playfair,
            fontSize: mob ? 24 : 42,
            fontWeight: 700,
            color: "#000000",
            marginTop: 12,
            lineHeight: 1.15,
          }}
        >
          India Celebrates Love Like No Other Nation On Earth
        </h1>
        <div style={{ width: 36, height: 2, background: "#FFCC00", margin: `${mob ? 12 : 20}px auto` }} />
        <p
          style={{
            fontFamily: mont,
            fontSize: mob ? 13 : 15,
            color: "#666666",
            lineHeight: 1.7,
            maxWidth: 560,
            margin: "0 auto",
          }}
        >
          Hindu, Muslim, Sikh, Christian, Jain, Buddhist, Parsi — every faith, every region, every ritual. No country on
          earth has this many ways of saying forever.
        </p>
      </Fade>

      {/* Feed section removed — tapping FEED navigates to /feed/:username */}

      {/* ─── NEWS ─── */}
      <Fade style={{ padding: `${mob ? 32 : 60}px ${px}px 0`, maxWidth: 900, margin: "0 auto" }}>
        <div id="news">
          <div style={{ textAlign: "center", marginBottom: mob ? 24 : 40 }}>
            <p
              style={{
                fontFamily: mont,
                fontSize: mob ? 9 : 11,
                letterSpacing: "1.5px",
                textTransform: "uppercase" as const,
                color: "#FFCC00",
                margin: 0,
              }}
            >
              INDUSTRY NEWS
            </p>
            <h2
              style={{
                fontFamily: playfair,
                fontSize: mob ? 22 : 32,
                fontWeight: 700,
                color: "#000000",
                margin: "12px 0 0",
              }}
            >
              From The Photography World
            </h2>
            <div style={{ width: 36, height: 2, background: "#FFCC00", margin: `${mob ? 12 : 20}px auto` }} />
          </div>
          {newsLoading ? (
            <p style={{ fontFamily: mont, fontSize: 13, color: "#666666", textAlign: "center" }}>
              Loading latest news...
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 20 : 24 }}>
              {news.map((n, i) => (
                <a
                  key={i}
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    border: mob ? "none" : "1px solid #F2F2F2",
                    borderBottom: mob ? "1px solid #F2F2F2" : undefined,
                    overflow: "hidden",
                    display: "block",
                    transition: "transform 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    if (!mob) e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {n.thumbnail ? (
                    <img src={n.thumbnail} alt={n.title} style={{ width: "100%", height: "auto", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", paddingTop: "50%", background: i % 2 === 0 ? warmGrad : coolGrad }} />
                  )}
                  <div style={{ padding: mob ? "12px 0" : 16 }}>
                    <div
                      style={{
                        fontFamily: mont,
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: "1px",
                        textTransform: "uppercase" as const,
                        color: "#FFCC00",
                      }}
                    >
                      {n.source}
                    </div>
                    <div
                      style={{
                        fontFamily: playfair,
                        fontSize: mob ? 16 : 18,
                        fontWeight: 700,
                        color: "#000000",
                        marginTop: 6,
                        lineHeight: 1.3,
                      }}
                    >
                      {n.title}
                    </div>
                    <div style={{ fontFamily: mont, fontSize: 10, color: "#666666", marginTop: 4 }}>
                      {new Date(n.pubDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <p style={{ fontFamily: mont, fontSize: 12, color: "#666666", lineHeight: 1.5, margin: "6px 0 0" }}>
                      {n.description}
                    </p>
                    <div style={{ fontFamily: mont, fontSize: 11, fontWeight: 600, color: "#000000", marginTop: 8 }}>
                      Read Article →
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </Fade>

      {/* ─── STORIES ─── */}
      <Fade style={{ padding: `${mob ? 32 : 60}px ${px}px 0`, maxWidth: 900, margin: "0 auto" }}>
        <div id="stories">
          <div style={{ textAlign: "center", marginBottom: mob ? 24 : 40 }}>
            <p
              style={{
                fontFamily: mont,
                fontSize: mob ? 9 : 11,
                letterSpacing: "1.5px",
                textTransform: "uppercase" as const,
                color: "#FFCC00",
                margin: 0,
              }}
            >
              INSPIRING STORIES
            </p>
            <h2
              style={{
                fontFamily: playfair,
                fontSize: mob ? 22 : 32,
                fontWeight: 700,
                color: "#000000",
                margin: "12px 0 0",
              }}
            >
              Stories That Inspire
            </h2>
            <div style={{ width: 36, height: 2, background: "#FFCC00", margin: `${mob ? 12 : 20}px auto` }} />
            <p style={{ fontFamily: mont, fontSize: mob ? 13 : 14, color: "#666666", margin: 0 }}>
              Real love, real moments, real photographers.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 24 : 20 }}>
            {STORIES.map((s, i) => (
              <div
                key={i}
                style={{
                  border: mob ? "none" : "1px solid #F2F2F2",
                  borderBottom: mob ? "1px solid #F2F2F2" : undefined,
                  overflow: "hidden",
                  transition: "transform 0.3s",
                }}
                onMouseEnter={(e) => {
                  if (!mob) e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ width: "100%", paddingTop: "60%", background: i % 2 === 0 ? warmGrad : coolGrad }} />
                <div style={{ padding: mob ? "12px 0" : 16 }}>
                  <div style={{ fontFamily: playfair, fontSize: mob ? 16 : 18, fontWeight: 700, color: "#000000" }}>
                    {s.couple}
                  </div>
                  <div style={{ fontFamily: mont, fontSize: 11, color: "#666666", marginTop: 4 }}>{s.loc}</div>
                  <p style={{ fontFamily: mont, fontSize: 13, color: "#666666", lineHeight: 1.6, margin: "8px 0 0" }}>
                    {s.snippet}
                  </p>
                  <div
                    style={{
                      fontFamily: mont,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#000000",
                      marginTop: 8,
                      cursor: "pointer",
                    }}
                  >
                    Read Story →
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Fade>

      {/* ─── DISCOVER ─── */}
      <Fade style={{ padding: `${mob ? 32 : 60}px ${px}px 0`, maxWidth: 900, margin: "0 auto" }}>
        <div id="discover">
          <div style={{ textAlign: "center", marginBottom: mob ? 20 : 32 }}>
            <p
              style={{
                fontFamily: mont,
                fontSize: mob ? 9 : 11,
                letterSpacing: "1.5px",
                textTransform: "uppercase" as const,
                color: "#FFCC00",
                margin: 0,
              }}
            >
              DISCOVER
            </p>
            <h2
              style={{
                fontFamily: playfair,
                fontSize: mob ? 22 : 32,
                fontWeight: 700,
                color: "#000000",
                margin: "12px 0 0",
              }}
            >
              Explore The Community
            </h2>
            <div style={{ width: 36, height: 2, background: "#FFCC00", margin: `${mob ? 12 : 20}px auto` }} />
          </div>
          <div
            style={{
              display: "flex",
              gap: mob ? 16 : 24,
              overflowX: "auto",
              paddingBottom: 8,
              scrollbarWidth: "none" as const,
            }}
          >
            {DISCOVER_PHOTOGRAPHERS.map((p, i) => (
              <div key={i} style={{ flexShrink: 0, textAlign: "center", cursor: "pointer" }}>
                <div
                  style={{
                    width: mob ? 60 : 80,
                    height: mob ? 60 : 80,
                    borderRadius: "50%",
                    background: i % 2 === 0 ? warmGrad : coolGrad,
                    margin: "0 auto",
                  }}
                />
                <div style={{ fontFamily: mont, fontSize: mob ? 10 : 12, color: "#000000", marginTop: 8 }}>
                  {p.name}
                </div>
                <div style={{ fontFamily: mont, fontSize: mob ? 9 : 10, color: "#666666" }}>{p.loc}</div>
              </div>
            ))}
          </div>
          <p
            style={{
              fontFamily: mont,
              fontSize: 12,
              color: "#666666",
              textAlign: "center",
              fontStyle: "italic",
              marginTop: 20,
            }}
          >
            Full discover experience coming soon
          </p>
        </div>
      </Fade>

      {/* ─── FOOTER ─── */}
      <footer
        style={{
          textAlign: "center",
          padding: `${mob ? 40 : 60}px ${px}px`,
          borderTop: "1px solid #F2F2F2",
          marginTop: mob ? 32 : 48,
          paddingBottom: `calc(${mob ? 80 : 40}px + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <div style={{ fontFamily: mont, fontSize: mob ? 10 : 12, color: "#666666" }}>
          © ART GALLERY by MIRRORAI · THE REAL INTELLIGENCE
        </div>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#FFCC00", margin: "16px auto 0" }} />
      </footer>

      <style>{`*::-webkit-scrollbar{display:none}*{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}
