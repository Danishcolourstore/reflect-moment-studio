import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Fab } from "@/components/Fab";
import { cn } from "@/lib/utils";

const CreateEventModal = lazy(() =>
  import("@/components/CreateEventModal").then((m) => ({ default: m.CreateEventModal })),
);

interface EventItem {
  id: string;
  name: string;
  slug: string | null;
  event_date: string | null;
  location: string | null;
  cover_url: string | null;
  photo_count: number;
  is_published: boolean;
  created_at?: string;
}

type EventFilter = "all" | "upcoming" | "live" | "draft";

const FILTERS: { key: EventFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "live", label: "Live" },
  { key: "draft", label: "Drafts" },
];

export default function Events() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<EventFilter>("all");

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase
      .from("events")
      .select("id, name, event_date, location, cover_url, photo_count, slug, is_published, created_at") as any)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const now = new Date();

  const filteredEvents = events.filter((evt) => {
    if (filter === "all") return true;
    if (filter === "live") return evt.is_published;
    if (filter === "draft") return !evt.is_published;
    if (filter === "upcoming") {
      return evt.event_date && new Date(evt.event_date) >= now;
    }
    return true;
  });

  return (
    <DashboardLayout>
      {/* ── Header ── */}
      <div className="flex items-baseline justify-between gap-4 pb-6">
        <h1 className="font-sans text-xl font-medium tracking-tight text-ink md:text-2xl">
          Events
        </h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="hidden md:inline-flex"
        >
          New event
        </Button>
      </div>

      {/* ── Filter rail ── */}
      <div className="flex gap-1 border-b border-rule">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "relative min-h-[44px] px-4 pb-3 pt-2 text-[13px] font-medium transition-colors duration-fast",
              filter === f.key
                ? "text-ink"
                : "text-ink-muted hover:text-ink-secondary",
            )}
          >
            {f.label}
            {filter === f.key && (
              <span className="absolute inset-x-4 -bottom-px h-px bg-ink" />
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="space-y-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-rule py-4 md:gap-6 md:py-5">
              <div className="skeleton-block h-16 w-24 shrink-0 rounded-md md:h-20 md:w-32" />
              <div className="flex-1 space-y-2">
                <div className="skeleton-block h-4 w-2/5 rounded" />
                <div className="skeleton-block h-3 w-1/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          hasEvents={events.length > 0}
          filter={filter}
          onCreate={() => setCreateOpen(true)}
        />
      ) : (
        <div role="list">
          {filteredEvents.map((evt) => (
            <EventRow
              key={evt.id}
              event={evt}
              onClick={() => navigate(`/dashboard/events/${evt.id}`)}
            />
          ))}
        </div>
      )}

      {/* ── Mobile FAB ── */}
      <Fab
        onClick={() => setCreateOpen(true)}
        aria-label="Create event"
        icon={<Plus size={22} strokeWidth={2} />}
        className="fixed right-5 bottom-[calc(80px+env(safe-area-inset-bottom))]"
      />

      {createOpen && (
        <Suspense fallback={null}>
          <CreateEventModal
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreated={(eventId) => {
              fetchEvents();
              navigate(`/dashboard/events/${eventId}`);
            }}
          />
        </Suspense>
      )}
    </DashboardLayout>
  );
}

/* ── Event row ── */

function EventRow({ event, onClick }: { event: EventItem; onClick: () => void }) {
  const dateStr = event.event_date
    ? format(new Date(event.event_date), "MMM d, yyyy")
    : null;
  const photoCount = (event.photo_count || 0).toLocaleString();

  return (
    <div
      role="listitem"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group flex cursor-pointer items-center gap-4 border-b border-rule py-4 outline-none",
        "transition-colors duration-fast",
        "hover:bg-wash focus-visible:bg-wash",
        "md:gap-6 md:py-5",
      )}
    >
      {/* Thumbnail */}
      {event.cover_url ? (
        <img
          src={event.cover_url}
          alt=""
          loading="lazy"
          className="h-16 w-24 shrink-0 rounded-md object-cover md:h-20 md:w-32"
        />
      ) : (
        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md bg-wash-strong md:h-20 md:w-32">
          <span className="font-serif text-xl text-ink-tertiary md:text-2xl">
            {event.name.charAt(0)}
          </span>
        </div>
      )}

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-medium leading-snug text-ink">
          {event.name}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
          <span className="num">{photoCount} photos</span>
          {event.location && (
            <>
              <span className="text-rule-strong" aria-hidden>·</span>
              <span className="truncate">{event.location}</span>
            </>
          )}
          {event.is_published && (
            <>
              <span className="text-rule-strong" aria-hidden>·</span>
              <span className="text-success">Live</span>
            </>
          )}
        </div>
      </div>

      {/* Date — right-aligned, desktop */}
      {dateStr && (
        <div className="hidden shrink-0 text-sm text-ink-muted num md:block">
          {dateStr}
        </div>
      )}
    </div>
  );
}

/* ── Empty state ── */

function EmptyState({
  hasEvents,
  filter,
  onCreate,
}: {
  hasEvents: boolean;
  filter: EventFilter;
  onCreate: () => void;
}) {
  if (hasEvents) {
    return (
      <div className="flex min-h-[calc(100vh-220px)] flex-col items-center justify-center gap-2 text-center md:min-h-[40vh]">
        <p className="text-base text-ink-muted">
          No {filter === "live" ? "live" : filter === "draft" ? "draft" : "upcoming"} events
        </p>
        <p className="text-sm text-ink-tertiary">
          Try a different filter or create a new event.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-220px)] flex-col items-center justify-center gap-6 text-center md:min-h-[50vh]">
      <div className="space-y-2">
        <p className="font-serif text-2xl text-ink">
          Your first event awaits
        </p>
        <p className="text-sm text-ink-muted">
          Create an event to start building your gallery.
        </p>
      </div>
      <Button onClick={onCreate}>
        Create event
      </Button>
    </div>
  );
}
