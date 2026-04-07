import { useEffect, useState } from "react";
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

  return (
    <DashboardLayout>
      {/* Studio greeting */}
      <div style={{ marginBottom: isMobile ? 24 : 40 }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: isMobile ? 24 : 28,
          fontWeight: 300,
          color: "hsl(48, 7%, 10%)",
          margin: 0,
          letterSpacing: "0.02em",
        }}>
          {studioName}
        </h1>
      </div>

      {/* Full-bleed photo grid */}
      <div style={{ margin: isMobile ? "0 -16px" : "0 -40px" }}>
        {loading ? (
          <div style={{ columns: isMobile ? 2 : 3, columnGap: 6, padding: isMobile ? "0 16px" : "0 40px" }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ breakInside: "avoid", marginBottom: 6, height: 180 + (i % 3) * 60, background: "hsl(40, 5%, 93%)" }} />
            ))}
          </div>
        ) : allPhotos.length === 0 ? (
          <div style={{ textAlign: "center", padding: isMobile ? "60px 24px" : "80px 24px" }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: isMobile ? 20 : 22,
              fontStyle: "italic",
              color: "hsl(37, 6%, 75%)",
              fontWeight: 300,
            }}>
              Your first gallery awaits
            </p>
          </div>
        ) : (
          <div style={{ columns: isMobile ? 2 : 3, columnGap: 6 }}>
            {allPhotos.map((url, i) => (
              <div key={i} style={{ breakInside: "avoid", marginBottom: 6, overflow: "hidden" }}>
                <img src={url} alt="" style={{ width: "100%", display: "block" }} loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setCreateOpen(true)}
        style={{
          position: "fixed",
          bottom: isMobile ? 80 : 32,
          right: isMobile ? 20 : 32,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "hsl(40, 52%, 48%)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px hsla(40, 52%, 48%, 0.3)",
          zIndex: 50,
          transition: "transform 0.2s ease-out",
        }}
      >
        <Plus style={{ width: 22, height: 22, color: "hsl(45, 14%, 97%)" }} strokeWidth={2} />
      </button>

      <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => { navigate(`/dashboard/events/${id}`); }} />
    </DashboardLayout>
  );
};

export default Dashboard;
