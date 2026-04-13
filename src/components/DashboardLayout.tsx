```tsx
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
        const { data: profile } = await (
          supabase.from("profiles").select("studio_name") as any
        )
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile?.studio_name) setStudioName(profile.studio_name);

        const { data: events } = await (
          supabase
            .from("events")
            .select("id, name, event_date, photo_count, status") as any
        )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const evts = events || [];
        const now = new Date();

        setUpcomingCount(
          evts.filter((e: any) => new Date(e.event_date) > now).length
        );
        setLiveCount(evts.filter((e: any) => e.status === "live").length);
        setPendingCount(
          evts.filter((e: any) => e.status === "pending").length
        );
        setTotalPhotos(
          evts.reduce((sum: number, e: any) => sum + (e.photo_count || 0), 0)
        );
        setRecentEvents(evts.slice(0, 3));
      } catch {
        setError(true);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (error)
    return (
      <PageError
        message="Something went wrong"
        onRetry={() => window.location.reload()}
      />
    );

  const statCards = [
    { label: "Upcoming Events", value: upcomingCount },
    { label: "Live Events", value: liveCount },
    { label: "Pending Delivery", value: pendingCount },
    { label: "Total Photos", value: totalPhotos },
  ];

  const quickActions = [
    { label: "New Event", action: () => setCreateOpen(true) },
    { label: "Upload Photos", action: () => navigate("/dashboard/gallery") },
    { label: "Cull with Cheetah", action: () => navigate("/dashboard/cull") },
  ];

  const statusColor = (status: string) => {
    if (status === "live") return "#C8A97E";
    if (status === "archived") return "#A8A29E";
    return "#A8A29E";
  };

  const statusBg = (status: string) => {
    if (status === "live") return "rgba(200,169,126,0.10)";
    return "rgba(168,162,158,0.10)";
  };

  return (
    <DashboardLayout>
      <div
        style={{
          background: "#FDFCFB",
          minHeight: "100vh",
          padding: isMobile ? "24px 20px 88px 20px" : "48px 48px 48px 48px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── Header ── */}
        <div style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: isMobile ? 30 : 40,
              fontWeight: 600,
              color: "#1C1917",
              margin: 0,
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
            }}
          >
            {greeting()}, {studioName}
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: "#A8A29E",
              marginTop: 8,
              marginBottom: 0,
            }}
          >
            {today}
          </p>
        </div>

        {/* ── Stat Cards ── */}
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
                background: "#FFFFFF",
                border: "1px solid #E7E5E4",
                borderRadius: 4,
                padding: isMobile ? "16px" : "20px 24px",
                boxShadow:
                  "0 1px 3px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)",
              }}
            >
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#A8A29E",
                  margin: "0 0 10px 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {card.label}
              </p>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: isMobile ? 36 : 44,
                  fontWeight: 600,
                  color: "#1C1917",
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {loading ? "—" : card.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 48,
          }}
        >
          {quickActions.map((btn, i) => (
            <button
              key={btn.label}
              onClick={btn.action}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: i === 0 ? "#FFFFFF" : "#C8A97E",
                background: i === 0 ? "#C8A97E" : "transparent",
                border: "1px solid #C8A97E",
                borderRadius: 4,
                padding: isMobile ? "12px 20px" : "12px 24px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                minHeight: 44,
                flex: isMobile ? "1 1 auto" : "0 0 auto",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#B8976A";
                e.currentTarget.style.borderColor = "#B8976A";
                e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  i === 0 ? "#C8A97E" : "transparent";
                e.currentTarget.style.borderColor = "#C8A97E";
                e.currentTarget.style.color =
                  i === 0 ? "#FFFFFF" : "#C8A97E";
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* ── Recent Events ── */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: isMobile ? 22 : 26,
                fontWeight: 600,
                color: "#1C1917",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Recent Events
            </h2>
            <button
              onClick={() => navigate("/dashboard/events")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: "#C8A97E",
                letterSpacing: "0.04em",
                padding: 0,
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "#B8976A")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "#C8A97E")
              }
            >
              View all →
            </button>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: 16,
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    background: "#F5F4F2",
                    borderRadius: 4,
                    height: 120,
                    animation: "pulse 1.8s ease-in-out infinite",
                  }}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && recentEvents.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "64px 20px",
                background: "#FFFFFF",
                border: "1px solid #E7E5E4",
                borderRadius: 4,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>📷</div>
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: isMobile ? 20 : 24,
                  fontWeight: 600,
                  color: "#1C1917",
                  margin: "0 0 8px 0",
                }}
              >
                No events yet
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "#A8A29E",
                  marginBottom: 24,
                  margin: "0 0 24px 0",
                }}
              >
                Create your first event to get started
              </p>
              <button
                onClick={() => setCreateOpen(true)}
                style={{
                  background: "#C8A97E",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "12px 28px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#B8976A")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#C8A97E")
                }
              >
                Create First Event
              </button>
            </div>
          )}

          {/* Event cards */}
          {!loading && recentEvents.length > 0 && (
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
                    background: "#FFFFFF",
                    border: "1px solid #E7E5E4",
                    borderRadius: 4,
                    padding: "20px 24px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow:
                      "0 1px 3px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(28,25,23,0.10), 0 2px 4px rgba(28,25,23,0.06)";
                    e.currentTarget.style.borderColor = "#C8A97E";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 1px 3px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)";
                    e.currentTarget.style.borderColor = "#E7E5E4";
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 20,
                      fontWeight: 600,
                      color: "#1C1917",
                      margin: "0 0 6px 0",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {evt.name}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#A8A29E",
                      margin: "0 0 14px 0",
                      fontFamily: "'DM Sans', sans-serif",
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
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "#A8A29E",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {evt.photo_count || 0} photos
                    </span>
                    {evt.status && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: statusColor(evt.status),
                          background: statusBg(evt.status),
                          padding: "3px 8px",
                          borderRadius: 2,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {evt.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* pulse keyframe */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
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
```