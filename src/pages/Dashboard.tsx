import { useEffect, useState, useRef } from "react";
import { PageError } from "@/components/PageStates";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CreateEventModal } from "@/components/CreateEventModal";
import { Plus } from "lucide-react";
import { useViewMode } from "@/lib/ViewModeContext";
import { DashboardLayout } from "@/components/DashboardLayout";

const CHAPTERS = ["All", "Baraat", "Mehndi", "Pheras", "Vidaai", "Reception"];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useViewMode();

  const [studioName, setStudioName] = useState("Studio");
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const { data: profile } = await (supabase.from("profiles").select("studio_name") as any)
          .eq("user_id", user.id).maybeSingle();
        if (profile?.studio_name) setStudioName(profile.studio_name);

        const { data: events } = await (
          supabase.from("events").select("id, name, slug, event_date, cover_url, photo_count, location") as any
        ).eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);

        const evtIds = (events || []).map((e: any) => e.id);
        if (evtIds.length > 0) {
          const { data: photos } = await supabase
            .from("photos").select("thumbnail_url, url").in("event_id", evtIds).limit(60);
          const urls = (photos || []).map((p: any) => p.thumbnail_url || p.url).filter(Boolean);
          setAllPhotos(urls);
        }
      } catch {
        setError(true);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (error) return <PageError message="Something went wrong" onRetry={() => window.location.reload()} />;

  /* ── Mobile: Light editorial gallery app ── */
  if (isMobile) {
    return (
      <DashboardLayout>
        <style>{`
          @keyframes galleryFadeIn {
            from { opacity: 0; transform: scale(0.97); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

        {/* Header title area — generous breathing room */}
        <div style={{ textAlign: "center", padding: "12px 0 24px" }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.4rem",
            fontWeight: 300,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "hsl(48, 7%, 10%)",
            margin: 0,
          }}>
            {studioName}
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.65rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "hsl(35, 4%, 56%)",
            marginTop: 6,
          }}>
            Wedding Photography
          </p>
        </div>

        {loading ? (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
            gap: 8, padding: "0 16px",
          }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                aspectRatio: "3/4", background: "hsl(40, 5%, 93%)",
                borderRadius: 12,
              }} />
            ))}
          </div>
        ) : allPhotos.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "80px 24px",
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22, fontStyle: "italic", fontWeight: 300,
              color: "hsl(35, 4%, 56%)",
              textAlign: "center",
            }}>
              Your first gallery awaits
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              style={{
                marginTop: 24, height: 44, padding: "0 28px",
                background: "#1A1A1A", border: "none",
                fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: "#fff", cursor: "pointer", borderRadius: 8,
              }}
            >
              Create Event
            </button>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 8,
            padding: "0 16px",
            paddingBottom: 24,
          }}>
            {allPhotos.map((url, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: "3/4",
                  overflow: "hidden",
                  borderRadius: 12,
                  background: "hsl(40, 5%, 93%)",
                }}
              >
                <img
                  src={url}
                  alt=""
                  loading={i < 6 ? "eager" : "lazy"}
                  decoding="async"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    animation: "galleryFadeIn 0.5s ease both",
                    animationDelay: `${Math.min(i * 0.04, 0.3)}s`,
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => navigate(`/dashboard/events/${id}`)} />
      </DashboardLayout>
    );
  }

  /* ── Desktop: Standard layout ── */
  return (
    <DashboardLayout>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 28, fontWeight: 300,
          color: "hsl(48, 7%, 10%)",
          margin: 0, letterSpacing: "0.02em",
        }}>
          {studioName}
        </h1>
      </div>

      <div style={{ margin: "0 -40px" }}>
        {loading ? (
          <div style={{ columns: 3, columnGap: 6, padding: "0 40px" }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ breakInside: "avoid", marginBottom: 6, height: 180 + (i % 3) * 60, background: "hsl(40, 5%, 93%)" }} />
            ))}
          </div>
        ) : allPhotos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22, fontStyle: "italic",
              color: "hsl(37, 6%, 75%)", fontWeight: 300,
            }}>
              Your first gallery awaits
            </p>
          </div>
        ) : (
          <div style={{ columns: 3, columnGap: 6 }}>
            {allPhotos.map((url, i) => (
              <div key={i} style={{ breakInside: "avoid", marginBottom: 6, overflow: "hidden" }}>
                <img src={url} alt="" style={{ width: "100%", display: "block" }} loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setCreateOpen(true)}
        style={{
          position: "fixed", bottom: 32, right: 32,
          width: 56, height: 56, borderRadius: "50%",
          background: "#1A1A1A", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(200,169,126,0.3)", zIndex: 50,
        }}
      >
        <Plus style={{ width: 22, height: 22, color: "#0a0a0b" }} strokeWidth={2} />
      </button>

      <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => navigate(`/dashboard/events/${id}`)} />
    </DashboardLayout>
  );
};

export default Dashboard;
