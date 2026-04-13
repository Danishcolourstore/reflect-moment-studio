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
    { label: "New Event", action: () => setCreateOpen(true) },
    { label: "Upload Photos", action: () => navigate("/dashboard/gallery") },
    { label: "Cull with Cheetah", action: () => navigate("/dashboard/cull") },
  ];

  const statusColor = (status: string) => {
    if (status === "live") return "#C8A97E";
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
          padding: isMobile ? "24px 20px 88px 20px" : "48px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
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
          <p style={{ fontSize: 13, color: "#A8A29E", marginTop: 8 }}>{today}</p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {statCards.map((card) => (
            <div key={card.label} style={{ background: "#fff", padding: 20 }}>
              <p style={{ fontSize: 10, color: "#A8A29E" }}>{card.label}</p>
              <p style={{ fontSize: 32 }}>{loading ? "—" : card.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 48 }}>
          {quickActions.map((btn) => (
            <button key={btn.label} onClick={btn.action}>
              {btn.label}
            </button>
          ))}
        </div>

        <div>
          <h2>Recent Events</h2>

          {!loading && recentEvents.length === 0 && <div>No events yet</div>}

          {!loading && recentEvents.length > 0 && (
            <div>
              {recentEvents.map((evt: any) => (
                <div key={evt.id}>
                  <p>{evt.name}</p>
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
