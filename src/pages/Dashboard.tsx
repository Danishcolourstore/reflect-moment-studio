import { useEffect, useState } from "react";
import { PageError } from "@/components/PageStates";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CreateEventModal } from "@/components/CreateEventModal";
import { useViewMode } from "@/lib/ViewModeContext";
import { DashboardLayout } from "@/components/DashboardLayout";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useViewMode();

  const [studioName, setStudioName] = useState("Studio");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [upcomingCount, setUpcomingCount] = useState(0);
  const [liveCount, setLiveCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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
          supabase.from("events").select("id, name, event_date, photo_count, status") as any
        )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const evts = events || [];
        const now = new Date();

        setUpcomingCount(evts.filter((e: any) => new Date(e.event_date) > now).length);
        setLiveCount(evts.filter((e: any) => e.status === "live").length);
        setPendingCount(evts.filter((e: any) => e.status === "pending").length);
        setTotalPhotos(evts.reduce((sum: number, e: any) => sum + (e.photo_count || 0), 0));
        setRecentEvents(evts.slice(0, 3));
      } catch {
        setError(true);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (error) return <PageError message="Something went wrong" onRetry={() => window.location.reload()} />;

  const statCards = [
    { label: "Upcoming Events", value: upcomingCount },
    { label: "Live Events", value: liveCount },
    { label: "Pending Delivery", value: pendingCount },
    { label: "Total Photos", value: totalPhotos },
  ];

  const quickActions = [
    { label: "+ New Event", action: () => setCreateOpen(true) },
    { label: "↑ Upload Photos", action: () => navigate("/dashboard/gallery") },
    { label: "◎ Cull with Cheetah", action: () => navigate("/dashboard/cull") },
  ];

  const statusColor = (status: string) => {
    if (status === "live") return "#C8A97E";
    if (status === "archived") return "#aaa";
    return "#888";
  };

  return (
    <DashboardLayout>
      <div
        style={{
          background: "#FDFCFB",
          minHeight: "100vh",
          padding: isMobile ? "24px 20px" : "40px 40px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── GREETING ── */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: isMobile ? 28 : 36,
              fontWeight: 400,
              color: "#1a1a1a",
              margin: 0,
              letterSpacing: "0.01em",
            }}
          >
            {greeting()}, {studioName}
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: "#1a1a1a",
              opacity: 0.45,
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            {today}
          </p>
        </div>

        {/* ── STAT CARDS ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {statCards.map((card) => (
            <div
              key={card.label}
              style={{
                background: "#fff",
                border: "1px solid #e8e0d8",
                borderRadius: 8,
                padding: "20px 24px",
              }}
            >
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#1a1a1a",
                  opacity: 0.45,
                  margin: "0 0 8px 0",
                }}
              >
                {card.label}
              </p>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 40,
                  fontWeight: 400,
                  color: "#1a1a1a",
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {loading ? "—" : card.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 48,
          }}
        >
          {quickActions.map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#C8A97E",
                background: "transparent",
                border: "1px solid #C8A97E",
                borderRadius: 4,
                padding: "10px 20px",
                cursor: "pointer",
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* ── RECENT EVENTS ── */}
        <div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              fontWeight: 400,
              color: "#1a1a1a",
              margin: "0 0 20px 0",
            }}
          >
            Recent Events
          </h2>

          {loading ? (
            <p style={{ opacity: 0.4, fontSize: 14 }}>Loading...</p>
          ) : recentEvents.length === 0 ? (
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 18,
                fontStyle: "italic",
                color: "#aaa",
                fontWeight: 300,
              }}
            >
              No events yet. Create your first event to get started.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: 16,
              }}
            >
              {recentEvents.map((evt: any) => (
                <div
                  key={evt.id}
                  onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                  style={{
                    background: "#fff",
                    border: "1px solid #e8e0d8",
                    borderRadius: 8,
                    padding: "20px 24px",
                    cursor: "pointer",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 20,
                      fontWeight: 400,
                      color: "#1a1a1a",
                      margin: "0 0 6px 0",
                    }}
                  >
                    {evt.name}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#888",
                      margin: "0 0 10px 0",
                    }}
                  >
                    {evt.event_date
                      ? new Date(evt.event_date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#888" }}>{evt.photo_count || 0} photos</span>
                    <span
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: statusColor(evt.status),
                        fontWeight: 500,
                      }}
                    >
                      {evt.status || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateEventModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => navigate(`/dashboard/events/${id}`)}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
