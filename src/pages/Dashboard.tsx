import { useEffect, useState } from "react";
import { PageError } from "@/components/PageStates";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { CreateEventModal } from "@/components/CreateEventModal";
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
  const [activeTab, setActiveTab] = useState<"all" | "events">("all");
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

  if (error) return <PageError message="Something went wrong" onRetry={() => window.location.reload()} />;

  const TABS = ["All", "Events"] as const;
  const tabMap = { All: "all", Events: "events" } as const;

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "hsl(45, 14%, 97%)", overflowX: "hidden", paddingBottom: mob ? 80 : 0 }}>
      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "hsla(45, 14%, 97%, 0.96)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid hsl(37, 10%, 90%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: mob ? 52 : 60,
          padding: mob ? "0 20px" : "0 48px",
        }}
      >
        <button
          onClick={drawer.toggle}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 4, padding: 8, minWidth: 44, minHeight: 44, justifyContent: "center" }}
        >
          <span style={{ width: 18, height: 1, background: "hsl(48, 7%, 10%)", display: "block" }} />
          <span style={{ width: 13, height: 1, background: "hsl(48, 7%, 10%)", display: "block" }} />
        </button>

        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: mob ? 14 : 16, fontWeight: 400, fontStyle: "italic", color: "hsl(35, 4%, 56%)", letterSpacing: "0.04em" }}>
          {studioName}
        </span>

        {!mob ? (
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {["Studio", "Events", "Website", "Clients"].map((l) => (
              <button
                key={l}
                onClick={() => navigate(l === "Studio" ? "/home" : l === "Events" ? "/dashboard/events" : l === "Website" ? "/dashboard/website-editor" : "/dashboard/clients")}
                style={{ background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(35, 4%, 56%)", cursor: "pointer", transition: "color 0.2s", minHeight: 44, display: "flex", alignItems: "center" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(48, 7%, 10%)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(35, 4%, 56%)")}
              >
                {l}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ width: 44 }} />
        )}
      </nav>

      {/* Header */}
      <div style={{ textAlign: "center", padding: mob ? "40px 24px 0" : "40px 48px 0" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontStyle: "italic", color: "hsl(35, 4%, 56%)", fontWeight: 400 }}>
          {studioName}
        </p>
        {studioUsername && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "hsl(37, 6%, 75%)", marginTop: 4 }}>
            {studioUsername}.mirrorai.com
          </p>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", gap: mob ? 24 : 40, padding: "16px 0 0", borderBottom: "1px solid hsl(37, 10%, 90%)", margin: mob ? "0 24px" : "0 48px" }}>
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
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: active ? "hsl(48, 7%, 10%)" : "hsl(37, 6%, 75%)",
                fontWeight: 400,
                paddingBottom: 12,
                borderBottom: active ? "2px solid hsl(40, 52%, 48%)" : "2px solid transparent",
                transition: "color 0.2s, border-color 0.2s",
                minHeight: 44,
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Gallery grid */}
      <div style={{ padding: mob ? "16px 0 0" : "16px 48px 0", maxWidth: 1200, margin: "0 auto" }}>
        {loading ? (
          <div style={{ columns: mob ? 2 : 3, columnGap: 8, padding: mob ? "0" : undefined }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-block" style={{ breakInside: "avoid", marginBottom: 8, height: 180 + (i % 3) * 60 }} />
            ))}
          </div>
        ) : allPhotos.length === 0 && recentEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: "italic", color: "hsl(37, 6%, 75%)", fontWeight: 300 }}>
              Your first gallery awaits
            </p>
          </div>
        ) : activeTab === "events" ? (
          <div>
            {recentEvents.map((evt, i) => (
              <button
                key={evt.id}
                onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                style={{ display: "block", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, borderBottom: i < recentEvents.length - 1 ? "1px solid hsl(37, 10%, 90%)" : "none" }}
              >
                <div style={{ display: "flex", gap: 16, padding: mob ? "16px 24px" : "16px 0", alignItems: "center" }}>
                  {evt.cover_url ? (
                    <img src={evt.cover_url} alt="" style={{ width: 80, height: 80, objectFit: "cover", flexShrink: 0 }} loading="lazy" />
                  ) : (
                    <div style={{ width: 80, height: 80, background: "hsl(40, 5%, 95%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "hsl(37, 10%, 90%)", flexShrink: 0 }}>
                      {evt.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "hsl(48, 7%, 10%)", fontWeight: 400 }}>{evt.name}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "hsl(35, 4%, 56%)", marginTop: 2 }}>
                      {evt.event_date ? format(new Date(evt.event_date), "MMM d, yyyy") : ""}{evt.location ? ` · ${evt.location}` : ""}
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "hsl(40, 52%, 48%)", marginTop: 2 }}>{evt.photo_count || 0} photos</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ columns: mob ? 2 : 3, columnGap: 8 }}>
            {allPhotos.map((url, i) => (
              <div key={i} className="group" style={{ breakInside: "avoid", marginBottom: 8, position: "relative", overflow: "hidden" }}>
                <img src={url} alt="" style={{ width: "100%", display: "block" }} loading="lazy" />
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
                    width: 40,
                    height: 40,
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
          right: mob ? 24 : 32,
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

      <DrawerMenu open={drawer.open} onClose={drawer.close} />
      <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => { navigate(`/dashboard/events/${id}`); }} />
    </div>
  );
};

export default Dashboard;