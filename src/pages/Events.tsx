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
    const { data } = await (supabase
      .from("events")
      .select("id, name, event_date, location, cover_url, photo_count, slug, is_published") as any)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [user]);

  const filteredEvents = events;

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
    if (status === "LIVE") return "hsl(40, 52%, 48%)";
    if (status === "DRAFT") return "hsl(35, 4%, 56%)";
    return "hsl(48, 7%, 10%)";
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: isMobile ? 24 : 40 }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: isMobile ? 28 : 32,
            fontWeight: 300,
            color: "hsl(48, 7%, 10%)",
            margin: 0,
            letterSpacing: "0.02em",
          }}>
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
        <div style={{
          display: "flex",
          gap: isMobile ? 16 : 24,
          borderBottom: "1px solid hsl(37, 10%, 90%)",
          marginBottom: isMobile ? 24 : 40,
          overflowX: isMobile ? "auto" : undefined,
        }}>
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
                color: filter === f.key ? "hsl(48, 7%, 10%)" : "hsl(35, 4%, 56%)",
                fontWeight: 400,
                paddingBottom: 12,
                borderBottom: filter === f.key ? "2px solid hsl(40, 52%, 48%)" : "2px solid transparent",
                transition: "color 0.2s, border-color 0.2s",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? 16 : 40,
          }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="skeleton-block" style={{ width: "100%", aspectRatio: isMobile ? "16/10" : "16/9" }} />
                <div className="skeleton-block" style={{ height: 18, width: "60%", marginTop: 12 }} />
                <div className="skeleton-block" style={{ height: 12, width: "40%", marginTop: 8 }} />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: isMobile ? "60px 0" : "80px 0",
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <Camera style={{ width: 40, height: 40, color: "hsl(37, 10%, 85%)", marginBottom: 16 }} strokeWidth={1} />
            <h2 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: isMobile ? 24 : 28,
              fontWeight: 300,
              color: "hsl(48, 7%, 10%)",
              margin: 0,
            }}>
              Your first gallery awaits
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: "hsl(35, 4%, 56%)",
              marginTop: 8,
            }}>
              Add your work to begin
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              style={{
                marginTop: 24,
                background: "hsl(48, 7%, 10%)",
                color: "hsl(45, 14%, 97%)",
                border: "none",
                padding: "14px 32px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                minHeight: 44,
              }}
            >
              Create Event
            </button>
          </div>
        ) : (
        <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? 16 : 40,
            alignContent: "start",
          }}>
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
                    minHeight: 44,
                  }}
                >
                  {/* Cover */}
                  {evt.cover_url ? (
                    <div style={{ width: "100%", aspectRatio: isMobile ? "16/10" : "16/9", overflow: "hidden" }}>
                      <img
                        src={evt.cover_url}
                        alt={evt.name}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 0.3s ease" }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: "100%", aspectRatio: isMobile ? "16/10" : "16/9",
                      background: "hsl(40, 5%, 95%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: isMobile ? 32 : 36,
                        color: "hsl(37, 10%, 90%)", fontWeight: 300,
                      }}>
                        {evt.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  {/* Info */}
                  <div style={{ paddingTop: 12 }}>
                    <h3 style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: isMobile ? 18 : 20,
                      fontWeight: 400,
                      color: "hsl(48, 7%, 10%)",
                      margin: 0,
                      letterSpacing: "0.02em",
                    }}>
                      {evt.name}
                    </h3>
                    <p style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      color: "hsl(35, 4%, 56%)",
                      marginTop: 4,
                    }}>
                      {evt.event_date ? format(new Date(evt.event_date), "MMM d, yyyy") : "No date"}
                      {evt.location ? ` · ${evt.location}` : ""}
                    </p>
                    <div style={{ display: "flex", gap: 12, marginTop: 6, alignItems: "center" }}>
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 11, letterSpacing: "0.08em",
                        textTransform: "uppercase", color: "hsl(35, 4%, 56%)",
                      }}>
                        {evt.photo_count || 0} photos
                      </span>
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 11, letterSpacing: "0.08em",
                        textTransform: "uppercase", color: getStatusColor(status),
                      }}>
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
            bottom: 80,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "hsl(48, 7%, 10%)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            transition: "transform 0.2s",
          }}
        >
          <Plus size={22} strokeWidth={2} style={{ color: "hsl(45, 14%, 97%)" }} />
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
