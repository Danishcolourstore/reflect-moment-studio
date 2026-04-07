import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreateEventModal } from "@/components/CreateEventModal";
import { EmptyState } from "@/components/PageStates";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { LazyImage } from "@/components/LazyImage";
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
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
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

  useEffect(() => { fetchEvents(); }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-2">COLLECTIONS</p>
            <h1 className="font-serif text-3xl text-foreground tracking-wide" style={{ fontWeight: 300 }}>
              Events
            </h1>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton-shimmer rounded-xl" style={{ aspectRatio: "4/5" }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            heading="No events yet"
            subtext="Create your first event to start building your gallery."
            ctaLabel="Create Event"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((evt) => (
              <FadeCard key={evt.id}>
                <button
                  className="group w-full text-left overflow-hidden rounded-xl bg-card border border-border transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(212,175,55,0.06)]"
                  onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                >
                  {evt.cover_url ? (
                    <div className="overflow-hidden">
                      <LazyImage
                        src={evt.cover_url}
                        alt={evt.name}
                        aspectRatio="4/5"
                        objectFit="cover"
                        imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center bg-secondary" style={{ aspectRatio: "4/5" }}>
                      <span className="font-serif text-3xl text-muted-foreground" style={{ fontWeight: 300 }}>
                        {evt.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="p-4 space-y-1">
                    <h3 className="font-serif text-[15px] text-foreground leading-tight">{evt.name}</h3>
                    <p className="text-[11px] text-muted-foreground tracking-wide">
                      {evt.event_date ? format(new Date(evt.event_date), "MMM d, yyyy") : "No date"}
                      {evt.location ? ` · ${evt.location}` : ""}
                    </p>
                    <p className="text-[10px] text-primary tracking-wider">
                      {evt.photo_count || 0} photos
                    </p>
                  </div>
                </button>
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
