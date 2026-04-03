import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreateEventModal } from "@/components/CreateEventModal";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { LazyImage } from "@/components/LazyImage";
import { EventCardSkeleton } from "@/components/Skeletons";

interface EventItem {
  id: string;
  name: string;
  slug: string | null;
  event_date: string | null;
  location: string | null;
  cover_url: string | null;
  photo_count: number;
}

const cormorant = '"Cormorant Garamond", serif';
const dm = '"DM Sans", sans-serif';

function FadeCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      {children}
    </div>
  );
}

export default function Events() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase
      .from('events')
      .select('id, name, event_date, location, cover_url, photo_count, slug') as any)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: cormorant, fontSize: 28, fontWeight: 300, color: "#1A1A1A", letterSpacing: "0.04em" }}>
              Events
            </h1>
            <p style={{ fontFamily: dm, fontSize: 13, color: "#999999", marginTop: 4, letterSpacing: "0.02em" }}>
              Manage your photography events
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            style={{
              fontFamily: dm,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              background: "#C9A96E",
              color: "#FFFFFF",
              borderRadius: 10,
              padding: "10px 22px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "opacity 0.2s",
            }}
          >
            <Plus className="h-4 w-4" />
            Create Event
          </button>
        </div>

        {/* Event Cards */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <p style={{ fontFamily: cormorant, fontSize: 24, fontWeight: 300, color: "#1A1A1A" }}>No events yet</p>
            <p style={{ fontFamily: dm, fontSize: 13, color: "#999999", marginTop: 8 }}>Create your first event to get started.</p>
            <button
              onClick={() => setCreateOpen(true)}
              style={{
                marginTop: 20,
                fontFamily: dm,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                background: "#C9A96E",
                color: "#FFFFFF",
                borderRadius: 10,
                padding: "10px 22px",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Plus className="h-4 w-4" />
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((evt) => (
              <FadeCard key={evt.id}>
                <div
                  className="group cursor-pointer overflow-hidden transition-all"
                  style={{
                    borderRadius: 20,
                    border: "1px solid #EEEEEE",
                    background: "#FFFFFF",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
                  }}
                  onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)";
                    e.currentTarget.style.borderColor = "rgba(201,169,110,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.04)";
                    e.currentTarget.style.borderColor = "#EEEEEE";
                  }}
                >
                  {evt.cover_url ? (
                    <div style={{ aspectRatio: "16/10", overflow: "hidden" }}>
                      <img
                        src={evt.cover_url}
                        alt={evt.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        aspectRatio: "16/10",
                        background: "#F8F8F8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontFamily: cormorant, fontSize: 28, color: "#CCCCCC", fontWeight: 300 }}>
                        {evt.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 4 }}>
                    <h3 style={{ fontFamily: cormorant, fontSize: 17, fontWeight: 500, color: "#1A1A1A", lineHeight: 1.3 }}>
                      {evt.name}
                    </h3>
                    <p style={{ fontFamily: dm, fontSize: 11, color: "#999999", letterSpacing: "0.03em" }}>
                      {evt.event_date ? format(new Date(evt.event_date), "MMMM d, yyyy") : "No date set"}
                      {evt.location ? ` · ${evt.location}` : ""}
                    </p>
                    <p style={{ fontFamily: dm, fontSize: 10, color: "#C9A96E", letterSpacing: "0.08em" }}>
                      {evt.photo_count || 0} photos
                    </p>
                  </div>
                </div>
              </FadeCard>
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
