import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreateEventModal } from "@/components/CreateEventModal";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Plus, Camera } from "lucide-react";
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
    const { data } = await (
      supabase
        .from("events")
        .select("id, name, event_date, location, cover_url, photo_count, slug, is_published") as any
    )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const FILTERS: { key: EventFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "delivered", label: "Live" },
    { key: "archived", label: "Archived" },
  ];

  const filteredEvents = events.filter((evt) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return !evt.is_published && new Date(evt.event_date || "") > new Date();
    if (filter === "delivered") return evt.is_published;
    return true;
  });

  const getStatus = (evt: EventItem) => {
    if (evt.is_published) return "Live";
    if (evt.photo_count === 0) return "Draft";
    return "In Progress";
  };

  const getStatusStyle = (status: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: "inline-block",
      fontSize: 10,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 500,
      padding: "3px 10px",
      borderRadius: 20,
    };
    if (status === "Live") return { ...base, background: "#f0ebe3", color: "#C8A97E" };
    if (status === "Draft") return { ...base, background: "#f5f5f5", color: "#999" };
    return { ...base, background: "#f0f0f0", color: "#666" };
  };

  return (
    <DashboardLayout>
      <div
        style={{
          background: "#FDFCFB",
          minHeight: "100vh",
          padding: isMobile ? "32px 20px 120px 20px" : "48px 48px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 40,
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: isMobile ? 30 : 34,
                  fontWeight: 400,
                  color: "#1c1917",
                  margin: 0,
                  letterSpacing: "0.01em",
                  lineHeight: 1.2,
                }}
              >
                Events
              </h1>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: "#a8a29e",
                  margin: "4px 0 0 0",
                }}
              >
                {events.length} {events.length === 1 ? "event" : "events"}
              </p>
            </div>
            {!isMobile && (
              <button
                onClick={() => setCreateOpen(true)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#b8956a")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#C8A97E")}
                style={{
                  background: "#C8A97E",
                  color: "#fff",
                  border: "none",
                  padding: "13px 28px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderRadius: 6,
                  fontWeight: 500,
                  transition: "background 0.2s",
                }}
              >
                + New Event
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div
            style={{
              display: "flex",
              gap: 0,
              borderBottom: "1px solid #e8e3de",
              marginBottom: 40,
              overflowX: "auto",
            }}
          >
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
                  color: filter === f.key ? "#1c1917" : "#a8a29e",
                  fontWeight: filter === f.key ? 500 : 400,
                  padding: "0 20px 14px 0",
                  marginRight: 8,
                  borderBottom: filter === f.key ? "2px solid #C8A97E" : "2px solid transparent",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Loading skeletons */}
          {loading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: isMobile ? 24 : 32,
              }}
            >
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ opacity: 0.5 }}>
                  <div
                    style={{
                      width: "100%",
                      paddingBottom: "66%",
                      background: "#f0ebe3",
                      borderRadius: 8,
                    }}
                  />
                  <div style={{ height: 16, width: "55%", marginTop: 14, background: "#f0ebe3", borderRadius: 4 }} />
                  <div style={{ height: 12, width: "35%", marginTop: 8, background: "#f0ebe3", borderRadius: 4 }} />
                </div>
              ))}
            </div>
          ) : /* Empty state */
          filteredEvents.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "100px 0",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#f5f0ea",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <Camera style={{ width: 28, height: 28, color: "#C8A97E" }} strokeWidth={1.5} />
              </div>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: isMobile ? 24 : 28,
                  fontWeight: 400,
                  color: "#1c1917",
                  margin: 0,
                }}
              >
                No events yet
              </h2>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: "#a8a29e",
                  marginTop: 8,
                  marginBottom: 28,
                }}
              >
                Create your first event to get started
              </p>
              <button
                onClick={() => setCreateOpen(true)}
                style={{
                  background: "#C8A97E",
                  color: "#fff",
                  border: "none",
                  padding: "14px 36px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderRadius: 6,
                  fontWeight: 500,
                }}
              >
                + Create Event
              </button>
            </div>
          ) : (
            /* Events grid */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: isMobile ? 28 : 32,
                alignItems: "start",
              }}
            >
              {filteredEvents.map((evt) => {
                const status = getStatus(evt);
                return (
                  <div
                    key={evt.id}
                    onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                    onMouseEnter={(e) => {
                      (e.currentTarget.querySelector(".evt-img") as HTMLElement)?.style &&
                        ((e.currentTarget.querySelector(".evt-img") as HTMLElement).style.transform = "scale(1.03)");
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget.querySelector(".evt-img") as HTMLElement)?.style &&
                        ((e.currentTarget.querySelector(".evt-img") as HTMLElement).style.transform = "scale(1)");
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Cover */}
                    <div
                      style={{
                        width: "100%",
                        paddingBottom: "66%",
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: 8,
                        background: "#f5f0ea",
                      }}
                    >
                      {evt.cover_url ? (
                        <img
                          className="evt-img"
                          src={evt.cover_url}
                          alt={evt.name}
                          loading="lazy"
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            transition: "transform 0.4s ease",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, serif",
                              fontSize: 48,
                              color: "#d4c4a8",
                              fontWeight: 300,
                            }}
                          >
                            {evt.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ paddingTop: 14 }}>
                      <div
                        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}
                      >
                        <h3
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontSize: isMobile ? 19 : 20,
                            fontWeight: 400,
                            color: "#1c1917",
                            margin: 0,
                            letterSpacing: "0.01em",
                            lineHeight: 1.3,
                          }}
                        >
                          {evt.name}
                        </h3>
                        <span style={getStatusStyle(status)}>{status}</span>
                      </div>
                      <p
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 12,
                          color: "#a8a29e",
                          margin: "6px 0 0 0",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {evt.event_date ? format(new Date(evt.event_date), "MMM d, yyyy") : "No date set"}
                        {evt.location ? ` · ${evt.location}` : ""}
                      </p>
                      <p
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 12,
                          color: "#c4bdb5",
                          margin: "4px 0 0 0",
                        }}
                      >
                        {evt.photo_count || 0} photos
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      {isMobile && (
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            position: "fixed",
            bottom: 88,
            right: 20,
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "#C8A97E",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            boxShadow: "0 4px 20px rgba(200,169,126,0.45)",
          }}
        >
          <Plus size={20} strokeWidth={2} style={{ color: "#fff" }} />
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
