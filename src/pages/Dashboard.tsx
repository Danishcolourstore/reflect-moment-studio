import { useEffect, useMemo, useState } from "react";
import { PageError } from "@/components/PageStates";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CreateEventModal } from "@/components/CreateEventModal";
import { useViewMode } from "@/lib/ViewModeContext";
import { DashboardLayout } from "@/components/DashboardLayout";

type Event = {
  id: string;
  name: string;
  event_date: string;
  photo_count: number;
  status: string;
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useViewMode();

  const [studioName, setStudioName] = useState("Studio");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [events, setEvents] = useState<Event[]>([]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const today = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      setError(false);

      try {
        const [profileRes, eventsRes] = await Promise.all([
          (supabase.from("profiles").select("studio_name") as any).eq("user_id", user.id).maybeSingle(),

          (supabase.from("events").select("id, name, event_date, photo_count, status") as any)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (profileRes.data?.studio_name) {
          setStudioName(profileRes.data.studio_name);
        }

        setEvents(eventsRes.data || []);
      } catch {
        setError(true);
      }

      setLoading(false);
    };

    load();
  }, [user]);

  const stats = useMemo(() => {
    const now = new Date();

    const upcoming = events.filter((e) => new Date(e.event_date) > now).length;
    const live = events.filter((e) => e.status === "live").length;
    const pending = events.filter((e) => e.status === "pending").length;
    const photos = events.reduce((sum, e) => sum + (e.photo_count || 0), 0);

    return [
      { label: "Upcoming", value: upcoming },
      { label: "Live", value: live },
      { label: "Pending", value: pending },
      { label: "Photos", value: photos },
    ];
  }, [events]);

  const recentEvents = useMemo(() => events.slice(0, 3), [events]);

  if (error) {
    return <PageError message="Something went wrong" onRetry={() => window.location.reload()} />;
  }

  return (
    <DashboardLayout>
      <div
        style={{
          background: "#FDFCFB",
          minHeight: "100vh",
          padding: isMobile ? "20px 16px 88px" : "40px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: isMobile ? 28 : 38,
              fontWeight: 600,
              color: "#1C1917",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {greeting}, {studioName}
          </h1>
          <p style={{ fontSize: 12, color: "#A8A29E", marginTop: 6 }}>{today}</p>
        </div>

        {/* STATS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {stats.map((card) => (
            <div
              key={card.label}
              style={{
                background: "#fff",
                padding: 16,
                borderRadius: 12,
              }}
            >
              <p style={{ fontSize: 11, color: "#A8A29E", marginBottom: 6 }}>{card.label}</p>
              <p style={{ fontSize: 24, fontWeight: 600 }}>{loading ? "—" : card.value}</p>
            </div>
          ))}
        </div>

        {/* PRIMARY ACTION */}
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 12,
            background: "#1C1917",
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 16,
          }}
        >
          New Event
        </button>

        {/* SECONDARY ACTIONS */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          <button
            onClick={() => navigate("/dashboard/gallery")}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 10,
              background: "#fff",
            }}
          >
            Upload
          </button>

          <button
            onClick={() => navigate("/dashboard/cull")}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 10,
              background: "#fff",
            }}
          >
            Cheetah
          </button>
        </div>

        {/* RECENT EVENTS */}
        <div>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Recent Events</h2>

          {!loading && recentEvents.length === 0 && <div style={{ fontSize: 13, color: "#A8A29E" }}>No events yet</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                style={{
                  background: "#fff",
                  padding: 14,
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 500 }}>{evt.name}</div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#A8A29E",
                    marginTop: 4,
                  }}
                >
                  {new Date(evt.event_date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
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
