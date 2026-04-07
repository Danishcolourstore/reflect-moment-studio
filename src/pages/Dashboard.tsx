import { useEffect, useState } from "react";
import { PageError } from "@/components/PageStates";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { CreateEventModal } from "@/components/CreateEventModal";
import { Plus, Menu } from "lucide-react";
import { MobileBottomNav } from "@/components/MobileBottomNav";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const drawer = useDrawerMenu();

  const [studioName, setStudioName] = useState("Studio");
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

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
    <div style={{ width: "100%", minHeight: "100vh", background: "hsl(45, 14%, 97%)", overflowX: "hidden" }}>
      {/* Minimal floating header — only menu + studio name, fades on scroll */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 48,
          padding: "0 16px",
          background: "hsla(45, 14%, 97%, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <button
          onClick={drawer.toggle}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Menu style={{ width: 18, height: 18, color: "hsl(48, 7%, 10%)" }} strokeWidth={1.5} />
        </button>

        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontWeight: 400, fontStyle: "italic", color: "hsl(35, 4%, 56%)", letterSpacing: "0.04em" }}>
          {studioName}
        </span>

        <div style={{ width: 34 }} />
      </nav>

      {/* Full-bleed photo grid — no padding, tight gaps */}
      <div style={{ paddingTop: 48, paddingBottom: mob ? 80 : 0 }}>
        {loading ? (
          <div style={{ columns: mob ? 2 : 3, columnGap: 6, padding: 0 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ breakInside: "avoid", marginBottom: 6, height: 180 + (i % 3) * 60, background: "hsl(40, 5%, 93%)" }} />
            ))}
          </div>
        ) : allPhotos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "120px 24px" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: "italic", color: "hsl(37, 6%, 75%)", fontWeight: 300 }}>
              Your first gallery awaits
            </p>
          </div>
        ) : (
          <div style={{ columns: mob ? 2 : 3, columnGap: 6 }}>
            {allPhotos.map((url, i) => (
              <div key={i} style={{ breakInside: "avoid", marginBottom: 6, overflow: "hidden" }}>
                <img
                  src={url}
                  alt=""
                  style={{ width: "100%", display: "block" }}
                  loading="lazy"
                />
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
          bottom: mob ? 76 : 32,
          right: mob ? 20 : 32,
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

      <MobileBottomNav />
      <DrawerMenu open={drawer.open} onClose={drawer.close} />
      <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => { navigate(`/dashboard/events/${id}`); }} />
    </div>
  );
};

export default Dashboard;
