import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { supabase } from "@/integrations/supabase/client";

const playfair = '"Playfair Display", serif';
const mont = '"Montserrat", sans-serif';

const DEFAULT_POSTS = [
  {
    name: "COLOURS OF LIFE",
    date: "March 27, 2026 · Calicut, Kerala",
    desc: "Vibrant celebrations capturing the essence of Kerala's wedding traditions.",
    photos: 52,
    likes: 146,
    views: "1.2K",
    warm: true,
    img: "",
  },
  {
    name: "MIRROR",
    date: "March 9, 2026 · Calicut, Kerala",
    desc: "Reflections of a beautiful beginning.",
    photos: 34,
    likes: 89,
    views: "840",
    warm: false,
    img: "",
  },
  {
    name: "COLOUR STORE",
    date: "March 19, 2026 · Calicut, Kerala",
    desc: "When every frame tells a story of colour and emotion.",
    photos: 28,
    likes: 203,
    views: "2.1K",
    warm: true,
    img: "",
  },
  {
    name: "GOLDEN HOUR",
    date: "February 14, 2026 · Munnar, Kerala",
    desc: "A destination celebration wrapped in golden light and mountain mist.",
    photos: 67,
    likes: 312,
    views: "3.4K",
    warm: false,
    img: "",
  },
  {
    name: "TIMELESS",
    date: "January 5, 2026 · Kochi, Kerala",
    desc: "Classic moments that transcend time.",
    photos: 41,
    likes: 178,
    views: "1.8K",
    warm: true,
    img: "",
  },
];

const HeartIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#666666"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const EyeIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#666666"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

function useOnScreen(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

function FeedPost({ post, index, mob }: { post: any; index: number; mob: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useOnScreen(ref);
  const [hovered, setHovered] = useState(false);
  const iconSize = mob ? 16 : 18;

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        transitionDelay: `${index * 0.05}s`,
      }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: mob ? "calc(100% + 32px)" : "100%",
          marginLeft: mob ? -16 : 0,
          overflow: "hidden",
          transform: hovered ? "scale(1.01)" : "scale(1)",
          transition: "transform 0.4s ease",
        }}
      >
        {post.img ? (
          <img src={post.img} alt={post.name} style={{ width: "100%", height: "auto", display: "block" }} />
        ) : (
          <div
            style={{
              width: "100%",
              height: mob ? "65vw" : "45vw",
              maxHeight: 500,
              background: post.warm
                ? "linear-gradient(135deg, #f5f0ea, #e8e0d4, #f5f0ea)"
                : "linear-gradient(135deg, #eae4dc, #d4ccc0, #eae4dc)",
            }}
          />
        )}
      </div>
      <div
        style={{
          fontFamily: playfair,
          fontSize: mob ? 16 : 20,
          fontWeight: 700,
          color: "#000000",
          letterSpacing: 0.5,
          marginTop: mob ? 16 : 20,
          textTransform: "uppercase" as const,
        }}
      >
        {post.name}
      </div>
      <div style={{ fontFamily: mont, fontSize: mob ? 12 : 13, color: "#666666", marginTop: 6 }}>{post.date}</div>
      {post.desc && (
        <div style={{ fontFamily: mont, fontSize: mob ? 13 : 14, color: "#666666", lineHeight: 1.6, marginTop: 10 }}>
          {post.desc}
        </div>
      )}
      <div style={{ fontFamily: mont, fontSize: mob ? 10 : 11, color: "#999999", marginTop: 8 }}>
        {post.photos} photos
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: mob ? 12 : 14, alignItems: "center" }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontFamily: mont,
            fontSize: mob ? 11 : 12,
            color: "#666666",
          }}
        >
          <HeartIcon size={iconSize} />
          {post.likes}
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontFamily: mont,
            fontSize: mob ? 11 : 12,
            color: "#666666",
          }}
        >
          <EyeIcon size={iconSize} />
          {post.views} views
        </span>
      </div>
      <div style={{ height: 1, background: "#F2F2F2", marginTop: mob ? 20 : 24 }} />
    </div>
  );
}

export default function LandingGate() {
  const navigate = useNavigate();
  const drawer = useDrawerMenu();
  const [riHov, setRiHov] = useState(false);
  const [agHov, setAgHov] = useState(false);
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [posts, setPosts] = useState(DEFAULT_POSTS);
  const [loading, setLoading] = useState(true);

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
      link.href =
        "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&family=Montserrat:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // Fetch real events from Supabase
  useEffect(() => {
    async function fetchEvents() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: events } = await supabase
          .from("events")
          .select("id, name, date, location, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!events || events.length === 0) {
          setLoading(false);
          return;
        }

        const feedPosts = await Promise.all(
          events.map(async (event: any, i: number) => {
            const { data: photos } = await supabase
              .from("photos")
              .select("storage_path, thumbnail_url, url")
              .eq("event_id", event.id)
              .limit(1);

            const { count } = await supabase
              .from("photos")
              .select("id", { count: "exact", head: true })
              .eq("event_id", event.id);

            const coverUrl = photos?.[0]?.thumbnail_url || photos?.[0]?.url || photos?.[0]?.storage_path || "";

            const eventDate = event.date
              ? new Date(event.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
              : "";

            return {
              name: event.name || "Untitled Event",
              date: `${eventDate}${event.location ? " · " + event.location : ""}`,
              desc: "",
              photos: count || 0,
              likes: Math.floor(Math.random() * 200) + 50,
              views: `${(Math.random() * 3 + 0.5).toFixed(1)}K`,
              warm: i % 2 === 0,
              img: coverUrl,
            };
          }),
        );

        if (feedPosts.length > 0) setPosts(feedPosts);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      }
      setLoading(false);
    }
    fetchEvents();
  }, []);

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF", overflowY: "visible" as const }}>
      {/* ── TOP BAR ── */}
      <div
        style={{
          position: "sticky" as const,
          top: 0,
          zIndex: 100,
          background: "#FFFFFF",
          height: mob ? 48 : 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: mob ? "0 16px" : "0 20px",
          borderBottom: "1px solid #F2F2F2",
        }}
      >
        <button
          onClick={drawer.toggle}
          style={{
            background: "none",
            border: "none",
            fontFamily: mont,
            fontSize: mob ? 9 : 10,
            fontWeight: 600,
            letterSpacing: "1.5px",
            color: "#666666",
            cursor: "pointer",
            textTransform: "uppercase" as const,
            minHeight: 44,
          }}
        >
          MENU
        </button>
        <span style={{ fontFamily: playfair, fontSize: mob ? 14 : 16, fontWeight: 700, color: "#000000" }}>
          Danish Subair
        </span>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFCC00" }} />
      </div>

      {/* ── FEED ── */}
      <div style={{ maxWidth: 660, margin: "0 auto", padding: mob ? "20px 16px" : "24px 20px" }}>
        <div
          style={{
            fontFamily: mont,
            fontSize: mob ? 9 : 10,
            letterSpacing: "1.5px",
            color: "#FFCC00",
            textTransform: "uppercase" as const,
          }}
        >
          RECENT WORK
        </div>
        <div style={{ fontFamily: playfair, fontSize: mob ? 22 : 28, fontWeight: 700, color: "#000000", marginTop: 4 }}>
          Your Moments
        </div>
        <div style={{ width: 24, height: 2, background: "#FFCC00", margin: mob ? "10px 0 24px" : "12px 0 32px" }} />

        <div style={{ display: "flex", flexDirection: "column" as const, gap: mob ? 40 : 48 }}>
          {loading ? (
            <div
              style={{ fontFamily: mont, fontSize: 13, color: "#666666", textAlign: "center" as const, padding: 40 }}
            >
              Loading your moments...
            </div>
          ) : (
            posts.map((p, i) => <FeedPost key={i} post={p} index={i} mob={mob} />)
          )}
        </div>
      </div>

      {/* ── BUTTONS ── */}
      <div style={{ maxWidth: 400, margin: "0 auto", padding: mob ? "28px 16px" : "40px 24px" }}>
        <button
          onClick={() => navigate("/dashboard")}
          onMouseEnter={() => setRiHov(true)}
          onMouseLeave={() => setRiHov(false)}
          style={{
            width: "100%",
            height: mob ? 44 : 48,
            background: riHov ? "#1a1a1a" : "#080808",
            color: "#F0EDE8",
            border: "none",
            fontFamily: mont,
            fontSize: mob ? 10 : 11,
            letterSpacing: "1.5px",
            cursor: "pointer",
            transition: "background 0.3s",
            textTransform: "uppercase" as const,
            marginBottom: 12,
          }}
        >
          ENTER REAL INTELLIGENCE →
        </button>
        <button
          onClick={() => navigate("/art-gallery")}
          onMouseEnter={() => setAgHov(true)}
          onMouseLeave={() => setAgHov(false)}
          style={{
            width: "100%",
            height: mob ? 44 : 48,
            background: agHov ? "#FFCC00" : "transparent",
            color: "#000000",
            border: "1px solid #FFCC00",
            fontFamily: mont,
            fontSize: mob ? 10 : 11,
            letterSpacing: "1.5px",
            cursor: "pointer",
            transition: "all 0.3s",
            textTransform: "uppercase" as const,
          }}
        >
          EXPLORE ART GALLERY →
        </button>
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          padding: mob ? "24px 16px" : "32px 24px",
          textAlign: "center" as const,
          paddingBottom: `calc(24px + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <div style={{ fontFamily: mont, fontSize: 10, color: "#CCCCCC" }}>© MirrorAI · Real Intelligence</div>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#FFCC00", margin: "12px auto 0" }} />
      </div>

      {/* Drawer */}
      <DrawerMenu open={drawer.open} onClose={drawer.close} />
    </div>
  );
}
