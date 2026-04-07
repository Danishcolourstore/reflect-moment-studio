import { useEffect, useState, useRef } from "react";
import { PageError } from "@/components/PageStates";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CreateEventModal } from "@/components/CreateEventModal";
import { Plus } from "lucide-react";
import { useViewMode } from "@/lib/ViewModeContext";
import { DashboardLayout } from "@/components/DashboardLayout";

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

  /* ── Mobile: Fullscreen native gallery ── */
  if (isMobile) {
    const heroUrl = allPhotos[0];
    const gridPhotos = allPhotos.slice(1);

    return (
      <DashboardLayout immersive>
        <style>{`
          @keyframes galleryFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>

        {loading ? (
          <div style={{ minHeight: "100dvh", background: "#0a0a0b" }}>
            {/* Hero skeleton */}
            <div style={{ width: "100%", height: "100svh", background: "#141414" }} />
            {/* Grid skeleton */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: "3/4", background: "#141414" }} />
              ))}
            </div>
          </div>
        ) : allPhotos.length === 0 ? (
          <div style={{
            minHeight: "100dvh", background: "#0a0a0b",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "0 24px",
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22, fontStyle: "italic", fontWeight: 300,
              color: "rgba(255,255,255,0.3)",
              textAlign: "center",
            }}>
              Your first gallery awaits
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              style={{
                marginTop: 24, height: 44, padding: "0 28px",
                background: "#C8A97E", border: "none",
                fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: "#0a0a0b", cursor: "pointer",
              }}
            >
              Create Event
            </button>
          </div>
        ) : (
          <div style={{ background: "#0a0a0b", paddingBottom: 72 }}>
            {/* Hero — fullscreen, flush to top */}
            {heroUrl && (
              <div style={{ position: "relative", width: "100vw", height: "100svh", overflow: "hidden" }}>
                <img
                  src={heroUrl}
                  alt=""
                  loading="eager"
                  onLoad={() => setHeroLoaded(true)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    opacity: heroLoaded ? 1 : 0,
                    transition: "opacity 0.4s ease",
                  }}
                />
                {/* Gradient overlay at bottom for chapter tabs or title */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: 120,
                  background: "linear-gradient(to top, rgba(10,10,11,0.8), transparent)",
                  pointerEvents: "none",
                }} />
                {/* Studio name at bottom of hero */}
                <div style={{
                  position: "absolute", bottom: 24, left: 0, right: 0,
                  textAlign: "center", pointerEvents: "none",
                }}>
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 20, fontWeight: 300, letterSpacing: "0.06em",
                    color: "rgba(255,255,255,0.7)",
                  }}>
                    {studioName}
                  </span>
                </div>
              </div>
            )}

            {/* Grid — edge-to-edge, 2-col, 2px gap */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 2,
              margin: 0,
              padding: 0,
            }}>
              {gridPhotos.map((url, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "3/4",
                    overflow: "hidden",
                    position: "relative",
                    background: "#141414",
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
                      animation: "galleryFadeIn 0.4s ease both",
                      animationDelay: `${Math.min(i * 0.05, 0.3)}s`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => navigate(`/dashboard/events/${id}`)} />
      </DashboardLayout>
    );
  }

  /* ── Desktop: Standard layout ── */
  return (
    <DashboardLayout>
      {/* Studio greeting */}
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

      {/* Photo grid */}
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

      {/* FAB — desktop only */}
      <button
        onClick={() => setCreateOpen(true)}
        style={{
          position: "fixed", bottom: 32, right: 32,
          width: 56, height: 56, borderRadius: "50%",
          background: "#C8A97E", border: "none", cursor: "pointer",
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
