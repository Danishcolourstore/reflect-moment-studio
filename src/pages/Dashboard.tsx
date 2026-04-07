import { useEffect, useState } from "react";
import { PageError } from "@/components/PageStates";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { CreateEventModal } from "@/components/CreateEventModal";
import { LazyImage } from "@/components/LazyImage";
import { Heart, Plus } from "lucide-react";

interface RecentEvent {
  id: string;
  name: string;
  slug: string | null;
  event_date: string | null;
  cover_url: string | null;
  photo_count: number;
  location: string | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const drawer = useDrawerMenu();

  const [studioName, setStudioName] = useState("Studio");
  const [studioUsername, setStudioUsername] = useState("");
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "events" | "highlights">("all");
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

        const { data: sp } = await (supabase.from("studio_profiles").select("username") as any)
          .eq("user_id", user.id).maybeSingle();
        if (sp?.username) setStudioUsername(sp.username);

        const { data: events } = await (
          supabase.from("events").select("id, name, slug, event_date, cover_url, photo_count, location") as any
        ).eq("user_id", user.id).order("created_at", { ascending: false }).limit(12);
        setRecentEvents(events || []);

        const photoSum = (events || []).reduce((s: number, e: any) => s + (e.photo_count || 0), 0);
        setTotalPhotos(photoSum);

        const evtIds = (events || []).map((e: any) => e.id);
        if (evtIds.length > 0) {
          const { data: photos } = await supabase
            .from("photos").select("thumbnail_url, url").in("event_id", evtIds).limit(24);
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

  if (error) return <PageError message="Failed to load" onRetry={() => window.location.reload()} />;

  const TABS = ["All", "Events", "Highlights"] as const;
  const tabMap = { All: "all", Events: "events", Highlights: "highlights" } as const;

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FDFCFB", overflowX: "hidden", paddingBottom: mob ? 80 : 0 }}>
      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(253,252,251,0.96)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #F0EDE8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: mob ? 52 : 60,
          padding: mob ? "0 20px" : "0 48px",
        }}
      >
        {/* Hamburger */}
        <button
          onClick={drawer.toggle}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 4, padding: 8 }}
        >
          <span style={{ width: 18, height: 1, background: "#1A1A1A", display: "block" }} />
          <span style={{ width: 13, height: 1, background: "#1A1A1A", display: "block" }} />
        </button>

        {/* Studio name */}
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: mob ? 14 : 16, fontWeight: 400, fontStyle: "italic", color: "#999999", letterSpacing: "0.04em" }}>
          {studioName}
        </span>

        {/* Desktop nav */}
        {!mob ? (
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {["Home", "Events", "Portfolio", "Clients"].map((l) => (
              <button
                key={l}
                onClick={() => navigate(l === "Home" ? "/home" : l === "Events" ? "/dashboard/events" : l === "Portfolio" ? "/dashboard/website-editor" : "/dashboard/clients")}
                style={{ background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#999999", cursor: "pointer", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1A1A1A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#999999")}
              >
                {l}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ width: 36 }} /> /* spacer to center studio name */
        )}
      </nav>

      {/* Header section */}
      <div style={{ textAlign: "center", padding: mob ? "28px 20px 0" : "40px 48px 0" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontStyle: "italic", color: "#999999", fontWeight: 400 }}>
          {studioName}
        </p>
        {studioUsername && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#BBBBBB", marginTop: 4 }}>
            {studioUsername}.mirrorai.com
          </p>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", gap: mob ? 20 : 32, padding: "20px 0 0", borderBottom: "1px solid #F0EDE8", margin: mob ? "0 20px" : "0 48px" }}>
        {TABS.map((tab) => {
          const key = tabMap[tab];
          const active = activeTab === key;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(key)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: active ? "#1C1C1E" : "#BBBBBB",
                fontWeight: active ? 500 : 400,
                paddingBottom: 12,
                borderBottom: active ? "2px solid #C8A97E" : "2px solid transparent",
                transition: "all 0.2s",
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Gallery grid */}
      <div style={{ padding: mob ? "12px 0 0" : "20px 48px 0", maxWidth: 1200, margin: "0 auto" }}>
        {loading ? (
          <div style={{ columns: mob ? 2 : 3, columnGap: 8, padding: mob ? "0 0" : undefined }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ breakInside: "avoid", marginBottom: 8, height: 180 + (i % 3) * 60, background: "#F5F3F0", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : allPhotos.length === 0 && recentEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: "italic", color: "#CCCCCC", fontWeight: 400 }}>
              No stories yet
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#BBBBBB", marginTop: 8 }}>
              Create your first event to begin
            </p>
          </div>
        ) : activeTab === "events" ? (
          /* Events list */
          <div style={{ padding: mob ? "0" : undefined }}>
            {recentEvents.map((evt, i) => (
              <button
                key={evt.id}
                onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                style={{ display: "block", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, borderBottom: i < recentEvents.length - 1 ? "1px solid #F0EDE8" : "none" }}
              >
                <div style={{ display: "flex", gap: 16, padding: mob ? "16px 20px" : "20px 0", alignItems: "center" }}>
                  {evt.cover_url ? (
                    <img src={evt.cover_url} alt="" style={{ width: 80, height: 80, objectFit: "cover", flexShrink: 0 }} loading="lazy" />
                  ) : (
                    <div style={{ width: 80, height: 80, background: "#F5F3F0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#DDDDDD", flexShrink: 0 }}>
                      {evt.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#1C1C1E", fontWeight: 400 }}>{evt.name}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#999999", marginTop: 2 }}>
                      {evt.event_date ? format(new Date(evt.event_date), "MMM d, yyyy") : ""}{evt.location ? ` · ${evt.location}` : ""}
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C8A97E", marginTop: 2 }}>{evt.photo_count || 0} photos</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Masonry photo grid */
          <div style={{ columns: mob ? 2 : 3, columnGap: 8, padding: mob ? "0" : undefined }}>
            {allPhotos.map((url, i) => (
              <div key={i} className="group" style={{ breakInside: "avoid", marginBottom: 8, position: "relative", overflow: "hidden" }}>
                <img src={url} alt="" style={{ width: "100%", display: "block" }} loading="lazy" />
                {/* Heart on hover */}
                <button
                  className="opacity-0 group-hover:opacity-100"
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: "rgba(0,0,0,0.15)",
                    backdropFilter: "blur(6px)",
                    border: "none",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                >
                  <Heart style={{ width: 16, height: 16, color: "rgba(255,255,255,0.9)" }} strokeWidth={1.5} />
                </button>
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
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "#C8A97E",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(200,169,126,0.3)",
          zIndex: 50,
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(200,169,126,0.4)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(200,169,126,0.3)"; }}
      >
        <Plus style={{ width: 22, height: 22, color: "#FFFFFF" }} strokeWidth={2} />
      </button>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />
      <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => { navigate(`/dashboard/events/${id}`); }} />
    </div>
  );
};

export default Dashboard;
