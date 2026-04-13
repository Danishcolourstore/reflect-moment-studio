import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Menu, Plus, Upload, Scissors, CalendarDays, Radio, Clock, Image } from "lucide-react";
import { format } from "date-fns";

interface EventRow {
  id: string;
  name: string;
  date: string | null;
  status: string;
  created_at: string;
  photo_count?: number;
}

export default function LandingGate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const drawer = useDrawerMenu();

  const [profileName, setProfileName] = useState("Studio");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data: prof } = await (supabase.from("profiles").select("studio_name") as any)
      .eq("user_id", user.id).maybeSingle();
    if (prof?.studio_name) setProfileName(prof.studio_name);

    const { data: eventsData } = await supabase
      .from("events")
      .select("id, name, date, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const evts: EventRow[] = (eventsData || []).map((e: any) => ({
      id: e.id, name: e.name, date: e.date, status: e.status || "draft", created_at: e.created_at,
    }));

    // Get photo counts per event
    const evtIds = evts.map(e => e.id);
    if (evtIds.length > 0) {
      const { count } = await supabase
        .from("photos")
        .select("id", { count: "exact", head: true })
        .in("event_id", evtIds);
      setTotalPhotos(count || 0);
    }

    setEvents(evts);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const todayStr = format(now, "EEEE, MMMM d, yyyy");

  const upcomingCount = events.filter(e => e.date && new Date(e.date) > now).length;
  const liveCount = events.filter(e => e.status === "published" || e.status === "live").length;
  const pendingCount = events.filter(e => e.status === "draft" || e.status === "pending").length;
  const recentEvents = events.slice(0, 3);

  const stats = [
    { label: "Upcoming Events", value: upcomingCount, icon: <CalendarDays size={18} strokeWidth={1.5} /> },
    { label: "Live Events", value: liveCount, icon: <Radio size={18} strokeWidth={1.5} /> },
    { label: "Pending Delivery", value: pendingCount, icon: <Clock size={18} strokeWidth={1.5} /> },
    { label: "Total Photos", value: totalPhotos, icon: <Image size={18} strokeWidth={1.5} /> },
  ];

  const quickActions = [
    { label: "New Event", icon: <Plus size={16} strokeWidth={2} />, url: "/dashboard/events" },
    { label: "Upload Photos", icon: <Upload size={16} strokeWidth={2} />, url: "/dashboard/gallery" },
    { label: "Cull with Cheetah", icon: <Scissors size={16} strokeWidth={2} />, url: "/dashboard/cheetah-live" },
  ];

  const getStatusColor = (status: string) => {
    if (status === "published" || status === "live") return "#C8A97E";
    return "#94918B";
  };

  const getStatusLabel = (status: string) => {
    if (status === "published" || status === "live") return "LIVE";
    return "ARCHIVED";
  };

  const content = (
    <>
      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: mob ? 28 : 36,
          fontWeight: 400,
          color: "#1a1a1a",
          margin: 0,
          lineHeight: 1.2,
        }}>
          {greeting}, {profileName}
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: "rgba(26,26,26,0.5)",
          marginTop: 6,
        }}>
          {todayStr}
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: mob ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        gap: 12,
        marginBottom: 32,
      }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            background: "#ffffff",
            border: "1px solid #e8e0d8",
            borderRadius: 8,
            padding: "20px 24px",
          }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              color: "rgba(26,26,26,0.5)",
              marginBottom: 12,
            }}>
              {s.label}
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 40,
              fontWeight: 400,
              color: "#1a1a1a",
              lineHeight: 1,
            }}>
              {loading ? "—" : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{
        display: "flex",
        gap: 12,
        marginBottom: 40,
        flexWrap: "wrap" as const,
      }}>
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.url)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              border: "1px solid #C8A97E",
              borderRadius: 4,
              background: "transparent",
              color: "#C8A97E",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(200,169,126,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>

      {/* Recent Events */}
      <div>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 22,
          fontWeight: 400,
          color: "#1a1a1a",
          margin: "0 0 16px 0",
        }}>
          Recent Events
        </h2>

        {loading ? (
          <div style={{ display: "flex", gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ flex: 1, height: 100, background: "#f0ede8", borderRadius: 8 }} />
            ))}
          </div>
        ) : recentEvents.length === 0 ? (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: "rgba(26,26,26,0.4)",
          }}>
            No events yet. Create your first event to get started.
          </p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: mob ? "1fr" : "repeat(3, 1fr)",
            gap: 12,
          }}>
            {recentEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e8e0d8",
                  borderRadius: 8,
                  padding: "20px 24px",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#C8A97E")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")}
              >
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 18,
                  fontWeight: 400,
                  color: "#1a1a1a",
                  marginBottom: 8,
                }}>
                  {evt.name}
                </div>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  color: "rgba(26,26,26,0.45)",
                  letterSpacing: "0.05em",
                  marginBottom: 10,
                }}>
                  {evt.date ? format(new Date(evt.date), "MMM d, yyyy") : "No date set"}
                </div>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: getStatusColor(evt.status),
                }}>
                  {getStatusLabel(evt.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  /* ── Mobile ── */
  if (mob) {
    return (
      <div style={{ width: "100%", minHeight: "100dvh", background: "#FDFCFB", margin: 0, padding: 0, overflowX: "hidden" }}>
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 60, padding: "0 20px",
          paddingTop: "env(safe-area-inset-top)",
          background: "#FDFCFB",
          borderBottom: "1px solid #E8E6E1",
        }}>
          <button onClick={drawer.toggle} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center", minWidth: 44, minHeight: 44 }}>
            <Menu style={{ width: 24, height: 24, color: "#1A1917" }} strokeWidth={2} />
          </button>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600,
            color: "#1A1917", letterSpacing: "0.18em", textTransform: "uppercase",
          }}>
            Mirror AI
          </span>
          <div style={{ width: 44, minHeight: 44 }} />
        </nav>

        <div style={{ padding: "84px 20px 88px" }}>
          {content}
        </div>

        <DrawerMenu open={drawer.open} onClose={drawer.close} />
        <MobileBottomNav />
      </div>
    );
  }

  /* ── Desktop: uses DashboardLayout sidebar ── */
  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FDFCFB" }}>
      <div style={{ padding: 32, maxWidth: 1100 }}>
        {content}
      </div>
      <DrawerMenu open={drawer.open} onClose={drawer.close} />
    </div>
  );
}
