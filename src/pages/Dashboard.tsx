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
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const drawer = useDrawerMenu();

  const [studioName, setStudioName] = useState("Studio");
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalAlbums, setTotalAlbums] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [createOpen, setCreateOpen] = useState(false);

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

        const { data: events } = await (
          supabase.from("events").select("id, name, slug, event_date, cover_url, photo_count") as any
        )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(8);
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
      } catch (err) {
        console.error("Dashboard load failed:", err);
        setError(true);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const collagePhotos = recentEvents.filter((e) => e.cover_url).slice(0, 3);

  if (error) return <PageError message="Failed to load" onRetry={() => window.location.reload()} />;

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF", overflowY: "visible" as const }}>
      <div
        style={{
          position: "sticky" as const,
          top: 0,
          zIndex: 100,
          background: "#FFFFFF",
          height: mob ? 48 : 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: mob ? "0 16px" : "0 24px",
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
          Workspace
        </span>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFCC00" }} />
      </div>

      <div style={{ padding: mob ? "32px 16px" : "48px 24px", maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            fontFamily: mont,
            fontSize: mob ? 9 : 10,
            letterSpacing: "1.5px",
            color: "#FFCC00",
            textTransform: "uppercase" as const,
          }}
        >
          REAL INTELLIGENCE
        </div>
        <h1
          style={{
            fontFamily: playfair,
            fontSize: mob ? 36 : 48,
            fontWeight: 700,
            color: "#000000",
            marginTop: 4,
            lineHeight: 1.1,
          }}
        >
          Workspace
        </h1>
        <div style={{ width: 32, height: 2, background: "#FFCC00", margin: "12px 0" }} />
        <p style={{ fontFamily: mont, fontSize: mob ? 12 : 13, color: "#666666", letterSpacing: "0.5px" }}>
          {loading ? "—" : `${totalPhotos} moments · ${totalEvents} events · ${totalAlbums} albums`}
        </p>
      </div>

      {collagePhotos.length > 0 && (
        <div style={{ padding: mob ? "0 16px 24px" : "0 24px 32px", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 12, overflowX: "auto" as const }}>
            {collagePhotos.map((evt) => (
              <img
                key={evt.id}
                src={evt.cover_url!}
                alt=""
                style={{ width: 160, height: 200, objectFit: "cover" as const, flexShrink: 0, borderRadius: 0 }}
              />
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          padding: mob ? "24px 16px" : "32px 24px",
          maxWidth: 900,
          margin: "0 auto",
          borderTop: "1px solid #F2F2F2",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: mob ? 12 : 16 }}>
          <button
            onClick={() => navigate("/dashboard/events")}
            style={{
              textAlign: "left" as const,
              padding: mob ? 20 : 24,
              background: "#FFFFFF",
              border: "1px solid #F2F2F2",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#FFCC00")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#F2F2F2")}
          >
            <div
              style={{
                fontFamily: mont,
                fontSize: 9,
                color: "#666666",
                letterSpacing: "0.35em",
                textTransform: "uppercase" as const,
              }}
            >
              Events
            </div>
            <div
              style={{
                fontFamily: playfair,
                fontSize: mob ? 36 : 48,
                fontWeight: 700,
                color: "#000000",
                lineHeight: 1,
                marginTop: 8,
              }}
            >
              {loading ? "—" : totalEvents}
            </div>
            <div style={{ fontFamily: mont, fontSize: 10, color: "#999999", marginTop: 8 }}>View all →</div>
          </button>

          <button
            onClick={() => navigate("/colour-store")}
            style={{
              textAlign: "left" as const,
              padding: mob ? 20 : 24,
              background: "#FAFAF5",
              border: "1px solid #E8E0C8",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#FFCC00")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E8E0C8")}
          >
            <div
              style={{
                fontFamily: mont,
                fontSize: 9,
                color: "#B8960C",
                letterSpacing: "0.35em",
                textTransform: "uppercase" as const,
              }}
            >
              RI
            </div>
            <div
              style={{
                fontFamily: playfair,
                fontSize: mob ? 18 : 22,
                fontWeight: 700,
                color: "#000000",
                lineHeight: 1.2,
                marginTop: 8,
              }}
            >
              Retouch with
              <br />
              Real Intelligence
            </div>
            <div
              style={{
                fontFamily: mont,
                fontSize: 10,
                color: "#B8960C",
                marginTop: 12,
                letterSpacing: "0.15em",
                textTransform: "uppercase" as const,
              }}
            >
              Open Colour Store →
            </div>
          </button>

          <button
            onClick={() => navigate("/dashboard/album-designer")}
            style={{
              textAlign: "left" as const,
              padding: mob ? 20 : 24,
              background: "#FFFFFF",
              border: "1px solid #F2F2F2",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#FFCC00")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#F2F2F2")}
          >
            <div
              style={{
                fontFamily: mont,
                fontSize: 9,
                color: "#666666",
                letterSpacing: "0.35em",
                textTransform: "uppercase" as const,
              }}
            >
              Albums
            </div>
            <div
              style={{
                fontFamily: playfair,
                fontSize: mob ? 36 : 48,
                fontWeight: 700,
                color: "#000000",
                lineHeight: 1,
                marginTop: 8,
              }}
            >
              {loading ? "—" : totalAlbums}
            </div>
            <div style={{ fontFamily: mont, fontSize: 10, color: "#999999", marginTop: 8 }}>View all →</div>
          </button>

          <button
            onClick={() => navigate("/dashboard/storybook")}
            style={{
              textAlign: "left" as const,
              padding: mob ? 20 : 24,
              background: "#FFFFFF",
              border: "1px solid #F2F2F2",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#FFCC00")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#F2F2F2")}
          >
            <div
              style={{
                fontFamily: mont,
                fontSize: 9,
                color: "#666666",
                letterSpacing: "0.35em",
                textTransform: "uppercase" as const,
              }}
            >
              Grid Builder
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 3,
                width: "fit-content",
                marginTop: 12,
              }}
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{ width: 20, height: 20, background: i < 4 ? "#E0E0E0" : "#F2F2F2" }} />
              ))}
            </div>
            <div style={{ fontFamily: mont, fontSize: 10, color: "#999999", marginTop: 12 }}>Build your grid →</div>
          </button>
        </div>

        <div
          style={{
            marginTop: mob ? 12 : 16,
            padding: mob ? 20 : 28,
            background: "#FAFAF5",
            border: "1px solid #F2F2F2",
          }}
        >
          <div
            style={{
              fontFamily: mont,
              fontSize: 9,
              color: "#B8960C",
              letterSpacing: "0.35em",
              textTransform: "uppercase" as const,
            }}
          >
            YOUR SIGNATURE
          </div>
          <div
            style={{ fontFamily: playfair, fontSize: mob ? 22 : 28, fontWeight: 700, color: "#000000", marginTop: 8 }}
          >
            Warm · Natural · Textured
          </div>
          <div style={{ fontFamily: mont, fontSize: 11, color: "#666666", marginTop: 6 }}>
            Depth 65 · Skin 48 · Glow 38
          </div>
          <div style={{ width: 32, height: 2, background: "#B8960C", margin: "12px 0" }} />
          <div
            style={{
              fontFamily: mont,
              fontSize: 10,
              color: "#B8960C",
              letterSpacing: "0.15em",
              textTransform: "uppercase" as const,
              cursor: "pointer",
            }}
          >
            Share your signature →
          </div>
        </div>
      </div>

      <div
        style={{
          padding: mob ? "24px 16px" : "32px 24px",
          maxWidth: 900,
          margin: "0 auto",
          borderTop: "1px solid #F2F2F2",
        }}
      >
        <div
          style={{
            fontFamily: mont,
            fontSize: 9,
            color: "#666666",
            letterSpacing: "0.35em",
            textTransform: "uppercase" as const,
            marginBottom: 16,
          }}
        >
          RECENT
        </div>

        {recentEvents.length > 0 ? (
          <div style={{ display: "flex", gap: 12, overflowX: "auto" as const, paddingBottom: 8 }}>
            {recentEvents.map((evt) => (
              <button
                key={evt.id}
                onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                style={{
                  flexShrink: 0,
                  width: mob ? 160 : 200,
                  textAlign: "left" as const,
                  background: "#FFFFFF",
                  border: "1px solid #F2F2F2",
                  cursor: "pointer",
                  overflow: "hidden",
                  transition: "border-color 0.3s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#FFCC00")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#F2F2F2")}
              >
                <div style={{ width: "100%", height: mob ? 140 : 180, background: "#F5F5F5", overflow: "hidden" }}>
                  {evt.cover_url ? (
                    <img
                      src={evt.cover_url}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" as const }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="1">
                        <rect x="2" y="2" width="20" height="20" rx="2" />
                      </svg>
                    </div>
                  )}
                </div>
                <div style={{ padding: 12 }}>
                  <div
                    style={{
                      fontFamily: mont,
                      fontSize: 12,
                      color: "#000000",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap" as const,
                    }}
                  >
                    {evt.name}
                  </div>
                  <div style={{ fontFamily: mont, fontSize: 10, color: "#999999", marginTop: 2 }}>
                    {evt.event_date ? format(new Date(evt.event_date), "MMM d, yyyy") : "No date"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : !loading ? (
          <p style={{ fontFamily: mont, fontSize: 12, color: "#999999" }}>
            No events yet. Create your first event to get started.
          </p>
        ) : null}
      </div>

      <div style={{ padding: mob ? "32px 16px" : "48px 24px", textAlign: "center" as const }}>
        <div style={{ fontFamily: mont, fontSize: 10, color: "#CCCCCC" }}>© MirrorAI · Real Intelligence</div>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#FFCC00", margin: "12px auto 0" }} />
      </div>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />

      <style>{`
        *::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Dashboard;
