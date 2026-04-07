import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreateEventModal } from "@/components/CreateEventModal";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useViewMode } from "@/lib/ViewModeContext";

interface EventItem {
  id: string;
  name: string;
  slug: string | null;
  event_date: string | null;
  location: string | null;
  cover_url: string | null;
  photo_count: number;
  is_published: boolean;
}

type EventFilter = "all" | "upcoming" | "delivered" | "archived";

export default function Events() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useViewMode();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<EventFilter>("all");

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase
      .from("events")
      .select("id, name, event_date, location, cover_url, photo_count, slug, is_published") as any)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [user]);

  const filteredEvents = events; // TODO: filter logic based on status

  const FILTERS: { key: EventFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "delivered", label: "Live" },
    { key: "archived", label: "Archived" },
  ];

  const getStatus = (evt: EventItem) => {
    if (evt.is_published) return "LIVE";
    if (evt.photo_count === 0) return "DRAFT";
    return "IN PROGRESS";
  };

  const getStatusColor = (status: string) => {
    if (status === "DELIVERED") return "#B8953F";
    if (status === "DRAFT") return "#94918B";
    return "#1A1917";
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 300, color: "hsl(48, 7%, 10%)", margin: 0, letterSpacing: "0.02em" }}>
            Events
          </h1>
        </div>

        {/* Desktop: New Event button */}
        {!isMobile && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button
              onClick={() => setCreateOpen(true)}
              style={{
                background: "hsl(48, 7%, 10%)",
                color: "hsl(45, 14%, 97%)",
                border: "none",
                padding: "12px 24px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              New Event
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: isMobile ? 16 : 24, borderBottom: "1px solid #E8E6E1", marginBottom: isMobile ? 24 : 32 }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: filter === f.key ? "#1A1917" : "#94918B",
                fontWeight: 400,
                paddingBottom: 12,
                borderBottom: filter === f.key ? "2px solid #B8953F" : "2px solid transparent",
                transition: "color 0.2s, border-color 0.2s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 20 : 32 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="skeleton-block" style={{ width: "100%", aspectRatio: "16/9" }} />
                <div className="skeleton-block" style={{ height: 18, width: "60%", marginTop: 12 }} />
                <div className="skeleton-block" style={{ height: 12, width: "40%", marginTop: 8 }} />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 300, color: "#1A1917", margin: 0 }}>
              Your first gallery awaits
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(35, 4%, 56%)", marginTop: 8 }}>
              Add your work to begin
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              style={{
                marginTop: 24,
                background: "#1A1917",
                color: "#FAFAF8",
                border: "none",
                padding: "14px 32px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Create Event
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 20 : 32 }}>
            {filteredEvents.map((evt) => {
              const status = getStatus(evt);
              return (
                <button
                  key={evt.id}
                  onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                  style={{
                    display: "block",
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: 0,
                  }}
                >
                  {/* Cover */}
                  {evt.cover_url ? (
                    <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden" }}>
                      <img
                        src={evt.cover_url}
                        alt={evt.name}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 0.3s ease" }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.92")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                      />
                    </div>
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "16/9", background: "#F4F3F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 36, color: "#E8E6E1", fontWeight: 300 }}>
                        {evt.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  {/* Info */}
                  <div style={{ paddingTop: 12 }}>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 400, color: "#1A1917", margin: 0, letterSpacing: "0.02em" }}>
                      {evt.name}
                    </h3>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#94918B", marginTop: 4 }}>
                      {evt.event_date ? format(new Date(evt.event_date), "MMM d, yyyy") : "No date"}
                      {evt.location ? ` · ${evt.location}` : ""}
                    </p>
                    <div style={{ display: "flex", gap: 12, marginTop: 6, alignItems: "center" }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94918B" }}>
                        {evt.photo_count || 0} photos
                      </span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: getStatusColor(status) }}>
                        {status}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      {isMobile && (
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            position: "fixed",
            bottom: 88,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#1A1917",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Plus size={22} strokeWidth={2} style={{ color: "#FAFAF8" }} />
        </button>
      )}

      <CreateEventModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(eventId) => {
          fetchEvents();
          navigate(`/dashboard/events/${eventId}`);
        }}
      />
    </DashboardLayout>
  );
}
