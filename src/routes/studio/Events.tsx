import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Search } from "lucide-react";
import { StudioLayout } from "@/components/studio/StudioLayout";
import { ScrollableTabBar } from "@/components/studio/ScrollableTabBar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const CreateEventModal = lazy(() =>
  import("@/components/CreateEventModal").then((m) => ({ default: m.CreateEventModal })),
);

type PipelineFilter = "all" | "booked" | "shooting" | "editing";

interface WeddingEvent {
  id: string;
  name: string;
  event_date: string | null;
  photo_count: number;
  is_published: boolean;
}

const TABS = [
  { id: "all", label: "All" },
  { id: "booked", label: "Booked" },
  { id: "shooting", label: "Shooting" },
  { id: "editing", label: "Editing" },
] as const;

function pipelineStage(event: WeddingEvent): PipelineFilter {
  if (event.is_published) return "editing";
  if (event.photo_count > 0) return "shooting";
  return "booked";
}

export default function StudioEvents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PipelineFilter>("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase
      .from("events")
      .select("id, name, event_date, photo_count, is_published")
      .eq("user_id", user.id)
      .order("event_date", { ascending: false }) as any);
    setEvents((data as WeddingEvent[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((event) => {
      if (filter !== "all" && pipelineStage(event) !== filter) return false;
      if (q && !event.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, filter, search]);

  return (
    <StudioLayout>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(26px, 6vw, 32px)",
              fontWeight: 300,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            Weddings
          </h1>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
              minWidth: "max-content",
              flexShrink: 0,
              padding: "10px 16px",
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface)",
              color: "var(--ink)",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              borderRadius: 0,
            }}
          >
            <Plus size={14} strokeWidth={1.75} />
            New Event
          </button>
        </div>

        <div style={{ position: "relative", marginBottom: 20 }}>
          <Search
            size={16}
            strokeWidth={1.5}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ink-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search weddings"
            aria-label="Search weddings"
            style={{
              width: "100%",
              padding: "12px 12px 12px 40px",
              borderRadius: 0,
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface)",
              color: "var(--ink)",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 300,
              outline: "none",
            }}
          />
        </div>

        <ScrollableTabBar
          tabs={[...TABS]}
          activeId={filter}
          onChange={(id) => setFilter(id as PipelineFilter)}
        />

        <div style={{ marginTop: 24 }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-block" style={{ height: 72 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 22,
                fontStyle: "italic",
                fontWeight: 300,
                color: "var(--ink-muted)",
                textAlign: "center",
                marginTop: 48,
              }}
            >
              No weddings in this stage.
            </p>
          ) : (
            filtered.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => navigate(`/studio/weddings/${event.id}`)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "16px 0",
                  border: "none",
                  borderBottom: "1px solid var(--border-default)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 20,
                    fontWeight: 400,
                    color: "var(--ink)",
                    margin: "0 0 4px",
                  }}
                >
                  {event.name}
                </p>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 300,
                    color: "var(--ink-muted)",
                    margin: 0,
                  }}
                >
                  {event.event_date
                    ? format(new Date(event.event_date), "MMM d, yyyy")
                    : "Date TBD"}{" "}
                  · {event.photo_count} photos · {pipelineStage(event)}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {createOpen && (
        <Suspense fallback={null}>
          <CreateEventModal
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreated={(id) => {
              void loadEvents();
              navigate(`/studio/weddings/${id}`);
            }}
          />
        </Suspense>
      )}
    </StudioLayout>
  );
}
