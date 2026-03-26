import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreateEventModal } from "@/components/CreateEventModal";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventItem {
  id: string;
  name: string;
  slug: string | null;
  event_date: string | null;
  location: string | null;
  cover_url: string | null;
  photo_count: number;
}

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">Events</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your photography events</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>

        {/* Event Cards */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground animate-pulse">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="font-serif text-xl text-foreground">No events yet</p>
            <p className="text-sm text-muted-foreground">Create your first event to get started.</p>
            <Button onClick={() => setCreateOpen(true)} size="sm" className="mt-2 gap-1.5">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((evt) => (
              <FadeCard key={evt.id}>
                <div
                  className="group cursor-pointer rounded-lg border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
                  onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                >
                  {evt.cover_url ? (
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={evt.cover_url}
                        alt={evt.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">No cover photo</span>
                    </div>
                  )}

                  <div className="p-4 space-y-1.5">
                    <h3 className="font-serif text-base font-medium text-foreground leading-tight truncate">
                      {evt.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {evt.event_date ? format(new Date(evt.event_date), "MMMM d, yyyy") : "No date set"}
                      {evt.location ? ` · ${evt.location}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
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
