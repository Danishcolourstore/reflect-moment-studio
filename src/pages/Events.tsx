import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
const CreateEventModal = lazy(() => import("@/components/CreateEventModal").then(m => ({ default: m.CreateEventModal })));
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

type StatusKey = "confirmed" | "pending" | "draft";

const STATUS_COLOR: Record<StatusKey, string> = {
  confirmed: "#5C7C5A", // --go
  pending: "#1A1A1A",   // --gold
  draft: "#A8A6A0",     // --ink-whisper
};

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

  const getStatus = (evt: EventItem): StatusKey => {
    if (evt.is_published) return "confirmed";
    if (evt.photo_count === 0) return "draft";
    return "pending";
  };

  // Tokens (locked design system)
  const INK = "#1A1917";
  const INK_MUTED = "#6E6E6E";
  const RULE = "#E8E6E1";
  const WASH = "#F4F3F0";
  const PAPER = "#FAFAF8";

  const gutter = isMobile ? 24 : 64;
  const thumbW = isMobile ? 80 : 120;
  const thumbH = isMobile ? 56 : 80;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: `0 ${gutter}px` }}>
        {/* Header row: title + new event */}
        <div style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginTop: isMobile ? 24 : 48,
          marginBottom: isMobile ? 24 : 32,
          gap: 16,
        }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: isMobile ? 28 : 40,
            fontWeight: 300,
            color: INK,
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: "-0.005em",
          }}>
            Events
          </h1>
          {!isMobile && (
            <button
              onClick={() => setCreateOpen(true)}
              style={{
                background: "transparent",
                color: INK,
                border: `1px solid ${RULE}`,
                padding: "0 24px",
                height: 44,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.06em",
                cursor: "pointer",
                transition: "border-color 120ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D6D3CC")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = RULE)}
            >
              New event
            </button>
          )}
        </div>

        {/* Filter rail */}
        <div style={{
          display: "flex",
          gap: isMobile ? 24 : 32,
          borderBottom: `1px solid ${RULE}`,
          marginBottom: 0,
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
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: filter === f.key ? INK : INK_MUTED,
                paddingBottom: 12,
                paddingTop: 4,
                marginBottom: -1,
                borderBottom: filter === f.key ? "1px solid #1A1A1A" : "1px solid transparent",
                transition: "color 120ms cubic-bezier(0.4, 0, 0.2, 1)",
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
          <div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                padding: "16px 0",
                borderBottom: `1px solid ${RULE}`,
                minHeight: 56,
              }}>
                <div className="skeleton-block" style={{ width: thumbW, height: thumbH, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton-block" style={{ height: 18, width: "40%" }} />
                  <div className="skeleton-block" style={{ height: 12, width: "25%", marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 28,
              fontWeight: 400,
              color: INK,
              margin: 0,
              lineHeight: 1.2,
            }}>
              No events.
            </h2>
            <button
              onClick={() => setCreateOpen(true)}
              style={{
                background: "#1A1A1A",
                color: "#FAFAF8",
                border: "none",
                padding: "0 24px",
                height: 44,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "background 120ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1A1A1A")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#1A1A1A")}
            >
              Create event
            </button>
          </div>
        ) : (
          <div role="list">
            {filteredEvents.map((evt) => {
              const status = getStatus(evt);
              const dateStr = evt.event_date ? format(new Date(evt.event_date), "MMM d, yyyy") : "—";
              const thumbnail = evt.cover_url ? (
                <img
                  src={evt.cover_url}
                  alt={evt.name}
                  loading="lazy"
                  style={{
                    width: thumbW,
                    height: thumbH,
                    objectFit: "cover",
                    display: "block",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div style={{
                  width: thumbW,
                  height: thumbH,
                  flexShrink: 0,
                  background: WASH,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: isMobile ? 22 : 28,
                  color: "#A8A6A0",
                  fontWeight: 300,
                }}>
                  {evt.name.charAt(0)}
                </div>
              );

              return (
                <div
                  key={evt.id}
                  role="listitem"
                  onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/dashboard/events/${evt.id}`);
                    }
                  }}
                  tabIndex={0}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? 16 : 24,
                    padding: isMobile ? "16px 0" : "20px 0",
                    borderBottom: `1px solid ${RULE}`,
                    minHeight: 56,
                    cursor: "pointer",
                    background: "transparent",
                    transition: "background-color 120ms cubic-bezier(0.4, 0, 0.2, 1)",
                    outline: "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = WASH)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  onFocus={(e) => (e.currentTarget.style.backgroundColor = WASH)}
                  onBlur={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {/* Thumbnail with subtle inset so wash doesn't bleed under it */}
                  <div style={{ paddingLeft: isMobile ? 4 : 8, flexShrink: 0 }}>{thumbnail}</div>

                  {/* Title + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: 20,
                      fontWeight: 500,
                      color: INK,
                      margin: 0,
                      lineHeight: 1.3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {evt.name}
                    </h3>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 4,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      color: INK_MUTED,
                      lineHeight: 1.4,
                    }}>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        {(evt.photo_count || 0).toLocaleString()} photos
                      </span>
                      <span aria-hidden style={{ color: "#D6D3CC" }}>·</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span
                          aria-hidden
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 9999,
                            background: STATUS_COLOR[status],
                            display: "inline-block",
                          }}
                        />
                        {status}
                      </span>
                      {/* Mobile: date stacks here */}
                      {isMobile && (
                        <>
                          <span aria-hidden style={{ color: "#D6D3CC" }}>·</span>
                          <span style={{ fontVariantNumeric: "tabular-nums" }}>{dateStr}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Date — desktop only, right-aligned */}
                  {!isMobile && (
                    <div style={{
                      paddingRight: 8,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      color: INK_MUTED,
                      letterSpacing: "0.01em",
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}>
                      {dateStr}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      {isMobile && (
        <button
          onClick={() => setCreateOpen(true)}
          aria-label="Create event"
          style={{
            position: "fixed",
            bottom: 80,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: INK,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            transition: "opacity 120ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Plus size={22} strokeWidth={2} style={{ color: PAPER }} />
        </button>
      )}

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
