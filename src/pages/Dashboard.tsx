import { useEffect, useState } from "react";
import { PageError } from "@/components/PageStates";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { CreateEventModal } from "@/components/CreateEventModal";

const playfair = '"Playfair Display", serif';
const mont = '"Montserrat", sans-serif';

interface RecentEvent {
  id: string;
  name: string;
  slug: string | null;
  event_date: string | null;
  cover_url: string | null;
  photo_count: number;
  location: string | null;
}

const NAV_LINKS = [
  { label: "Home", path: "/home" },
  { label: "Events", path: "/dashboard/events" },
  { label: "Albums", path: "/dashboard/album-designer" },
  { label: "Storybook", path: "/dashboard/storybook" },
  { label: "Website", path: "/dashboard/website-editor" },
  { label: "Clients", path: "/dashboard/clients" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const drawer = useDrawerMenu();

  const [studioName, setStudioName] = useState("Studio");
  const [studioTag, setStudioTag] = useState("Capturing moments that last forever");
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalAlbums, setTotalAlbums] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [createOpen, setCreateOpen] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (!document.getElementById("dash-fonts")) {
      const link = document.createElement("link");
      link.id = "dash-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&family=Montserrat:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const { data: profile } = await (supabase.from("profiles").select("studio_name") as any)
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile?.studio_name) setStudioName(profile.studio_name);

        const { data: sp } = await (supabase.from("studio_profiles").select("tagline") as any)
          .eq("user_id", user.id)
          .maybeSingle();
        if (sp?.tagline) setStudioTag(sp.tagline);

        const { data: events } = await (
          supabase.from("events").select("id, name, slug, event_date, cover_url, photo_count, location") as any
        )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(12);
        setRecentEvents(events || []);

        const { count: evtCount } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        setTotalEvents(evtCount || 0);

        const photoSum = (events || []).reduce((s: number, e: any) => s + (e.photo_count || 0), 0);
        setTotalPhotos(photoSum);

        const { count: albCount } = await supabase
          .from("albums")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        setTotalAlbums(albCount || 0);

        // Fetch gallery photos for mosaic
        const evtIds = (events || []).map((e: any) => e.id);
        if (evtIds.length > 0) {
          const { data: photos } = await supabase
            .from("photos")
            .select("thumbnail_url, url, storage_path")
            .in("event_id", evtIds)
            .limit(24);
          const urls = (photos || [])
            .map((p: any) => p.thumbnail_url || p.url || p.storage_path)
            .filter(Boolean);
          setAllPhotos(urls);
        }
      } catch (err) {
        console.error("Dashboard load failed:", err);
        setError(true);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  // Hero slider auto-rotate
  const heroImages = recentEvents.filter((e) => e.cover_url).slice(0, 5);
  useEffect(() => {
    if (heroImages.length < 2) return;
    const t = setInterval(() => setHeroIdx((p) => (p + 1) % heroImages.length), 5000);
    return () => clearInterval(t);
  }, [heroImages.length]);

  if (error) return <PageError message="Failed to load" onRetry={() => window.location.reload()} />;

  const cream = "#F5F0EA";
  const ink = "#1A1A1A";
  const gold = "#C8A97E";
  const lightBorder = "rgba(0,0,0,0.06)";

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: cream, overflowY: "auto", overflowX: "hidden" }}>
      {/* ── Minimal Nav ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(245,240,234,0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${lightBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: mob ? 52 : 60,
          padding: mob ? "0 16px" : "0 40px",
        }}
      >
        <button
          onClick={drawer.toggle}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: 8,
          }}
        >
          <span style={{ width: 18, height: 1.5, background: ink, display: "block" }} />
          <span style={{ width: 14, height: 1.5, background: ink, display: "block" }} />
        </button>

        <span
          style={{
            fontFamily: playfair,
            fontSize: mob ? 16 : 18,
            fontWeight: 600,
            color: ink,
            letterSpacing: "0.04em",
          }}
        >
          {studioName}
        </span>

        {!mob ? (
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {NAV_LINKS.map((l) => (
              <button
                key={l.path}
                onClick={() => navigate(l.path)}
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: mont,
                  fontSize: 11,
                  fontWeight: 400,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(26,26,26,0.55)",
                  cursor: "pointer",
                  transition: "color 0.3s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = ink)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(26,26,26,0.55)")}
              >
                {l.label}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setCreateOpen(true)}
            style={{
              background: "none",
              border: "none",
              fontFamily: mont,
              fontSize: 20,
              color: ink,
              cursor: "pointer",
            }}
          >
            +
          </button>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section style={{ position: "relative", width: "100%", height: mob ? "55vh" : "80vh", overflow: "hidden" }}>
        {heroImages.length > 0 ? (
          <>
            {heroImages.map((evt, i) => (
              <img
                key={evt.id}
                src={evt.cover_url!}
                alt={evt.name}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: i === heroIdx ? 1 : 0,
                  transition: "opacity 1.2s ease",
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)",
              }}
            />
          </>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, ${ink} 0%, #2c2c2c 100%)`,
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            bottom: mob ? 32 : 60,
            left: mob ? 20 : 60,
            right: mob ? 20 : 60,
          }}
        >
          <h1
            style={{
              fontFamily: playfair,
              fontSize: mob ? 32 : 56,
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1.1,
              textShadow: "0 2px 20px rgba(0,0,0,0.3)",
            }}
          >
            {studioName}
          </h1>
          <p
            style={{
              fontFamily: mont,
              fontSize: mob ? 12 : 14,
              fontWeight: 300,
              color: "rgba(255,255,255,0.8)",
              marginTop: 8,
              letterSpacing: "0.05em",
            }}
          >
            {studioTag}
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            style={{
              marginTop: mob ? 16 : 24,
              fontFamily: mont,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#FFFFFF",
              padding: "12px 32px",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.15)";
            }}
          >
            + Create Event
          </button>
        </div>
        {/* Hero dots */}
        {heroImages.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: mob ? 12 : 24,
              right: mob ? 20 : 60,
              display: "flex",
              gap: 6,
            }}
          >
            {heroImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIdx(i)}
                style={{
                  width: i === heroIdx ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === heroIdx ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Stats Strip ── */}
      <section
        style={{
          display: "flex",
          justifyContent: "center",
          gap: mob ? 32 : 64,
          padding: mob ? "28px 16px" : "40px 24px",
          borderBottom: `1px solid ${lightBorder}`,
        }}
      >
        {[
          { n: loading ? "—" : totalEvents, l: "Events" },
          { n: loading ? "—" : totalPhotos, l: "Photos" },
          { n: loading ? "—" : totalAlbums, l: "Albums" },
        ].map((s) => (
          <div key={s.l} style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: playfair,
                fontSize: mob ? 28 : 40,
                fontWeight: 600,
                color: ink,
                lineHeight: 1,
              }}
            >
              {s.n}
            </div>
            <div
              style={{
                fontFamily: mont,
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: gold,
                marginTop: 6,
              }}
            >
              {s.l}
            </div>
          </div>
        ))}
      </section>

      {/* ── Recent Galleries ── */}
      {recentEvents.length > 0 && (
        <section style={{ padding: mob ? "40px 16px" : "60px 40px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: mob ? 24 : 36 }}>
            <div>
              <h2
                style={{
                  fontFamily: playfair,
                  fontSize: mob ? 24 : 32,
                  fontWeight: 600,
                  color: ink,
                }}
              >
                Recent Work
              </h2>
              <div style={{ width: 40, height: 2, background: gold, marginTop: 8 }} />
            </div>
            <button
              onClick={() => navigate("/dashboard/events")}
              style={{
                background: "none",
                border: "none",
                fontFamily: mont,
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: gold,
                cursor: "pointer",
              }}
            >
              View All →
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: mob ? "1fr" : "repeat(3, 1fr)",
              gap: mob ? 24 : 20,
            }}
          >
            {recentEvents.slice(0, mob ? 4 : 6).map((evt) => (
              <button
                key={evt.id}
                onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: 0,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "4/5",
                    overflow: "hidden",
                    background: "#E8E4DE",
                    position: "relative",
                  }}
                >
                  {evt.cover_url ? (
                    <img
                      src={evt.cover_url}
                      alt={evt.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.6s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: playfair,
                        fontSize: 24,
                        color: "rgba(26,26,26,0.15)",
                      }}
                    >
                      {evt.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 12 }}>
                  <h3
                    style={{
                      fontFamily: playfair,
                      fontSize: mob ? 16 : 18,
                      fontWeight: 600,
                      color: ink,
                      margin: 0,
                    }}
                  >
                    {evt.name}
                  </h3>
                  <p
                    style={{
                      fontFamily: mont,
                      fontSize: 11,
                      color: "rgba(26,26,26,0.45)",
                      marginTop: 4,
                      letterSpacing: "0.03em",
                    }}
                  >
                    {evt.event_date ? format(new Date(evt.event_date), "MMMM d, yyyy") : ""}
                    {evt.location ? ` · ${evt.location}` : ""}
                  </p>
                  {evt.photo_count > 0 && (
                    <p
                      style={{
                        fontFamily: mont,
                        fontSize: 10,
                        color: gold,
                        marginTop: 2,
                        letterSpacing: "0.08em",
                      }}
                    >
                      {evt.photo_count} photos
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Photo Mosaic ── */}
      {allPhotos.length > 0 && (
        <section style={{ padding: mob ? "0 0 40px" : "0 40px 60px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ padding: mob ? "0 16px" : "0", marginBottom: mob ? 20 : 28 }}>
            <h2
              style={{
                fontFamily: playfair,
                fontSize: mob ? 22 : 28,
                fontWeight: 600,
                color: ink,
              }}
            >
              Gallery
            </h2>
            <div style={{ width: 32, height: 2, background: gold, marginTop: 6 }} />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: mob ? "repeat(3, 1fr)" : "repeat(6, 1fr)",
              gap: mob ? 2 : 3,
            }}
          >
            {allPhotos.slice(0, mob ? 12 : 24).map((url, i) => (
              <div key={i} style={{ aspectRatio: "1", overflow: "hidden" }}>
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.4s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Quick Actions ── */}
      <section
        style={{
          padding: mob ? "32px 16px" : "48px 40px",
          maxWidth: 1200,
          margin: "0 auto",
          borderTop: `1px solid ${lightBorder}`,
        }}
      >
        <h2
          style={{
            fontFamily: playfair,
            fontSize: mob ? 22 : 28,
            fontWeight: 600,
            color: ink,
            marginBottom: mob ? 20 : 28,
          }}
        >
          Quick Actions
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: mob ? 12 : 16,
          }}
        >
          {[
            { label: "Events", sub: `${totalEvents} total`, path: "/dashboard/events", accent: false },
            { label: "Colour Store", sub: "RI Retouching", path: "/colour-store", accent: true },
            { label: "Albums", sub: `${totalAlbums} total`, path: "/dashboard/album-designer", accent: false },
            { label: "Grid Builder", sub: "Social media", path: "/dashboard/storybook", accent: false },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                textAlign: "left",
                padding: mob ? 20 : 28,
                background: item.accent ? "rgba(200,169,126,0.08)" : "rgba(255,255,255,0.7)",
                border: `1px solid ${item.accent ? "rgba(200,169,126,0.2)" : lightBorder}`,
                cursor: "pointer",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = gold)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = item.accent ? "rgba(200,169,126,0.2)" : lightBorder)
              }
            >
              <div
                style={{
                  fontFamily: mont,
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: item.accent ? gold : "rgba(26,26,26,0.4)",
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontFamily: playfair,
                  fontSize: mob ? 18 : 22,
                  fontWeight: 600,
                  color: ink,
                  marginTop: 8,
                  lineHeight: 1.2,
                }}
              >
                {item.sub}
              </div>
              <div
                style={{
                  fontFamily: mont,
                  fontSize: 10,
                  color: item.accent ? gold : "rgba(26,26,26,0.35)",
                  marginTop: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Open →
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── No events empty state ── */}
      {!loading && recentEvents.length === 0 && (
        <section style={{ padding: mob ? "60px 16px" : "100px 40px", textAlign: "center" }}>
          <h2
            style={{
              fontFamily: playfair,
              fontSize: mob ? 28 : 40,
              fontWeight: 600,
              color: ink,
            }}
          >
            Your Story Begins Here
          </h2>
          <p
            style={{
              fontFamily: mont,
              fontSize: 13,
              color: "rgba(26,26,26,0.45)",
              marginTop: 12,
              maxWidth: 400,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Create your first event to start building your portfolio
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            style={{
              marginTop: 24,
              fontFamily: mont,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              background: ink,
              color: cream,
              border: "none",
              padding: "14px 40px",
              cursor: "pointer",
              transition: "opacity 0.3s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            + Create Event
          </button>
        </section>
      )}

      {/* ── Footer ── */}
      <footer
        style={{
          padding: mob ? "40px 16px" : "60px 40px",
          textAlign: "center",
          borderTop: `1px solid ${lightBorder}`,
        }}
      >
        <div
          style={{
            fontFamily: playfair,
            fontSize: mob ? 14 : 16,
            color: "rgba(26,26,26,0.25)",
            fontStyle: "italic",
          }}
        >
          {studioName}
        </div>
        <div
          style={{
            fontFamily: mont,
            fontSize: 9,
            color: "rgba(26,26,26,0.2)",
            marginTop: 8,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Powered by MirrorAI
        </div>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: gold, margin: "12px auto 0" }} />
      </footer>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />
      <CreateEventModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(eventId) => navigate(`/dashboard/events/${eventId}`)}
      />

      <style>{`
        *::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Dashboard;
