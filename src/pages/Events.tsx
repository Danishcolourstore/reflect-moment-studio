import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreateEventModal } from "@/components/CreateEventModal";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { LazyImage } from "@/components/LazyImage";

interface EventItem {
  id: string;
  name: string;
  slug: string | null;
  event_date: string | null;
  location: string | null;
  cover_url: string | null;
  photo_count: number;
}

export default function Events() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase
      .from("events")
      .select("id, name, event_date, location, cover_url, photo_count, slug") as any)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [user]);

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 400, color: "#1C1C1E", margin: 0 }}>
              Events
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#999999", marginTop: 4 }}>
              Your photography timeline
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            style={{
              background: "none",
              border: "1px solid #C8A97E",
              borderRadius: 8,
              padding: "8px 18px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: "#C8A97E",
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#C8A97E"; e.currentTarget.style.color = "#FFFFFF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#C8A97E"; }}
          >
            New Event
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ borderBottom: "1px solid #F0EDE8" }}>
                <div style={{ padding: "24px 0", display: "flex", gap: 16 }}>
                  <div style={{ width: "100%", height: 200, background: "#F5F3F0", animation: "pulse 1.5s ease-in-out infinite" }} />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: "italic", color: "#CCCCCC", fontWeight: 400 }}>
              No events yet
            </p>
            <div style={{ width: 40, height: 1, background: "#F0EDE8", margin: "16px auto" }} />
            <button
              onClick={() => setCreateOpen(true)}
              style={{
                background: "none",
                border: "none",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: "#C8A97E",
                cursor: "pointer",
                letterSpacing: "0.05em",
              }}
            >
              Create your first event →
            </button>
          </div>
        ) : (
          <div>
            {events.map((evt, i) => (
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
                  borderBottom: i < events.length - 1 ? "1px solid #F0EDE8" : "none",
                }}
              >
                {/* Cover image */}
                {evt.cover_url ? (
                  <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", position: "relative" }}>
                    <LazyImage
                      src={evt.cover_url}
                      alt={evt.name}
                      aspectRatio="16/9"
                      objectFit="cover"
                      imgClassName="transition-transform duration-500 hover:scale-[1.02]"
                    />
                  </div>
                ) : (
                  <div style={{ width: "100%", aspectRatio: "16/9", background: "#F8F6F3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "#E0DCD5", fontStyle: "italic" }}>
                      {evt.name.charAt(0)}
                    </span>
                  </div>
                )}
                {/* Info */}
                <div style={{ padding: "16px 0 24px" }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "#1C1C1E", margin: 0 }}>
                    {evt.name}
                  </h3>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#999999", marginTop: 4 }}>
                    {evt.event_date ? format(new Date(evt.event_date), "MMM d, yyyy") : "No date"}
                    {evt.location ? ` · ${evt.location}` : ""}
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C8A97E", marginTop: 4 }}>
                    {evt.photo_count || 0} photos
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

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
