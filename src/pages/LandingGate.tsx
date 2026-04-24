import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
const CreateEventModal = lazy(() =>
  import("@/components/CreateEventModal").then((m) => ({ default: m.CreateEventModal }))
);
import { toast } from "sonner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { resolveUsername } from "@/lib/studio-url";

/* ──────────────────────────────────────────────────────────────────────────
   Editorial Home — /home
   Answers, in order:
     1. Who am I + where am I (identity, date)
     2. Business health at a glance (storage · delivered · views · galleries)
     3. What's been happening (recent events + recent activity)
     4. What to do next (one obvious primary action)

   Constraints:
     · Cormorant Garamond (display) + DM Sans (UI) only
     · Palette: #FAFAF8 / #1A1917 / #C8A97E / #6B6760 / #E8E5E0
     · 4px scale, 1px borders, max radius 4px, images 0px radius
     · No icon libraries, no shadcn Card/Badge, no spinners
     · 1px gold top loading bar
   ────────────────────────────────────────────────────────────────────────── */

interface EventRow {
  id: string;
  name: string;
  slug: string | null;
  cover_url: string | null;
  event_date: string | null;
  photo_count: number | null;
  location: string | null;
  is_published?: boolean | null;
  created_at?: string;
}

interface Health {
  storageUsedGB: number;        // 0..100
  storageQuotaGB: number;
  photosDelivered: number;
  clientViews: number;
  galleriesDelivered: number;
}

interface ActivityRow {
  id: string;
  kind: "view" | "favorite" | "download" | "event";
  text: string;
  meta: string;
  ts: number;
}

const PALETTE = {
  bg: "#FAFAF8",
  ink: "#1A1917",
  inkSoft: "#6B6760",
  rule: "#E8E5E0",
  gold: "#C8A97E",
  paper: "#FFFFFF",
};

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'DM Sans', system-ui, sans-serif";

export default function LandingGate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const drawer = useDrawerMenu();

  const [events, setEvents] = useState<EventRow[]>([]);
  const [health, setHealth] = useState<Health>({
    storageUsedGB: 0,
    storageQuotaGB: 100,
    photosDelivered: 0,
    clientViews: 0,
    galleriesDelivered: 0,
  });
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("Studio");
  const [feedSlug, setFeedSlug] = useState<string | null>(null);
  const [mob, setMob] = useState(
    typeof window !== "undefined" && window.innerWidth < 768
  );
  const [createEventOpen, setCreateEventOpen] = useState(false);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Profile
    const { data: prof } = await (supabase
      .from("profiles")
      .select("studio_name") as any)
      .eq("user_id", user.id)
      .maybeSingle();
    if (prof?.studio_name) setProfileName(prof.studio_name);

    // Feed slug
    let slug: string | null = null;
    const { data: dom } = await (supabase
      .from("domains")
      .select("subdomain") as any)
      .eq("user_id", user.id)
      .maybeSingle();
    slug = dom?.subdomain || null;
    if (!slug) slug = resolveUsername(undefined, user.email);
    setFeedSlug(slug);

    // Events
    const { data: eventsData } = await supabase
      .from("events")
      .select(
        "id, name, slug, cover_url, event_date, photo_count, location, is_published, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);

    const evRows = (eventsData || []) as EventRow[];
    setEvents(evRows);

    // Photos delivered
    const evtIds = evRows.map((e) => e.id);
    let photosDelivered = 0;
    if (evtIds.length > 0) {
      const { count } = await supabase
        .from("photos")
        .select("id", { count: "exact", head: true })
        .in("event_id", evtIds);
      photosDelivered = count || 0;
    }

    // Client views (sum of event_analytics.gallery_views)
    let clientViews = 0;
    if (evtIds.length > 0) {
      try {
        const { data: an } = await (supabase
          .from("event_analytics")
          .select("gallery_views, event_id, updated_at") as any)
          .in("event_id", evtIds);
        clientViews = (an || []).reduce(
          (s: number, r: any) => s + (r?.gallery_views || 0),
          0
        );
      } catch {
        /* analytics optional */
      }
    }

    // Galleries delivered = published events
    const galleriesDelivered = evRows.filter((e) => e.is_published).length;

    // Storage estimate: 5 MB / photo, capped at quota
    const storageQuotaGB = 100;
    const storageUsedGB = Math.min(
      storageQuotaGB,
      Math.round((photosDelivered * 5) / 1024)
    );

    setHealth({
      storageUsedGB,
      storageQuotaGB,
      photosDelivered,
      clientViews,
      galleriesDelivered,
    });

    // Activity feed (recent published events as proxy events)
    const acts: ActivityRow[] = [];
    evRows.slice(0, 6).forEach((e) => {
      acts.push({
        id: e.id,
        kind: "event",
        text: e.name,
        meta: e.location || "",
        ts: new Date(e.created_at || e.event_date || Date.now()).getTime(),
      });
    });
    acts.sort((a, b) => b.ts - a.ts);
    setActivity(acts.slice(0, 5));

    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleShare = async () => {
    const feedUrl = feedSlug
      ? `${window.location.origin}/feed/${feedSlug}`
      : window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({ title: profileName, url: feedUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(feedUrl);
      toast.success("Link copied");
    }
  };

  // Date / greeting
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 5 ? "Late night" :
    hour < 12 ? "Morning" :
    hour < 17 ? "Afternoon" :
    hour < 21 ? "Evening" : "Tonight";
  const dateLong = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dayNum = now.getDate();
  const monthShort = now
    .toLocaleDateString("en-IN", { month: "short" })
    .toUpperCase();

  const fmt = (n: number) => n.toLocaleString("en-IN");

  return (
    <div
      style={{
        background: PALETTE.bg,
        color: PALETTE.ink,
        minHeight: "100vh",
        fontFamily: SANS,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* ── 1px gold top loading bar ─────────────────────────────── */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: PALETTE.gold,
            zIndex: 9999,
            animation: "mai-load 1.4s ease-in-out infinite",
          }}
        />
      )}

      {/* ── Top nav (minimal, type-only) ─────────────────────────── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
          padding: "0 16px",
          background: PALETTE.bg,
          borderBottom: `1px solid ${PALETTE.rule}`,
        }}
      >
        <button
          onClick={drawer.toggle}
          aria-label="Menu"
          style={{
            minHeight: 44,
            minWidth: 44,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: 0,
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: PALETTE.ink,
            padding: 0,
          }}
        >
          Menu
        </button>

        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: 18,
            letterSpacing: "0.04em",
            color: PALETTE.ink,
          }}
        >
          Mirror<span style={{ color: PALETTE.gold }}>·</span>AI
        </span>

        <button
          onClick={handleShare}
          aria-label="Share studio link"
          style={{
            minHeight: 44,
            minWidth: 44,
            background: "transparent",
            border: 0,
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: PALETTE.inkSoft,
            padding: 0,
          }}
        >
          Share
        </button>
      </nav>

      <main
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: mob ? "32px 20px 160px" : "64px 48px 96px",
        }}
      >
        {/* ── 1. IDENTITY ─────────────────────────────────────────── */}
        <section style={{ marginBottom: mob ? 48 : 96 }}>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: PALETTE.inkSoft,
              marginBottom: 16,
            }}
          >
            {greeting} · {dateLong}
          </div>

          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 300,
              fontSize: mob ? 44 : 72,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: PALETTE.ink,
              margin: 0,
              fontStyle: "italic",
            }}
          >
            {profileName}
          </h1>

          {/* Hairline + day stamp */}
          <div
            style={{
              marginTop: 24,
              display: "flex",
              alignItems: "baseline",
              gap: 16,
            }}
          >
            <span
              style={{
                fontFamily: SERIF,
                fontWeight: 300,
                fontSize: 28,
                color: PALETTE.gold,
                lineHeight: 1,
              }}
            >
              {dayNum}
            </span>
            <span
              style={{
                fontFamily: SANS,
                fontSize: 11,
                letterSpacing: "0.24em",
                color: PALETTE.inkSoft,
              }}
            >
              {monthShort}
            </span>
            <span
              style={{
                flex: 1,
                height: 1,
                background: PALETTE.rule,
              }}
            />
          </div>
        </section>

        {/* ── 2. BUSINESS HEALTH ──────────────────────────────────── */}
        <section style={{ marginBottom: mob ? 48 : 96 }}>
          <SectionLabel>Studio at a glance</SectionLabel>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, 1fr)",
              gap: 0,
              borderTop: `1px solid ${PALETTE.rule}`,
              borderLeft: `1px solid ${PALETTE.rule}`,
            }}
          >
            <Metric
              label="Storage"
              value={loading ? "—" : `${health.storageUsedGB}`}
              suffix={loading ? "" : ` of ${health.storageQuotaGB} GB`}
              progress={
                loading ? null : health.storageUsedGB / health.storageQuotaGB
              }
              mob={mob}
            />
            <Metric
              label="Photos delivered"
              value={loading ? "—" : fmt(health.photosDelivered)}
              suffix=""
              mob={mob}
            />
            <Metric
              label="Client views"
              value={loading ? "—" : fmt(health.clientViews)}
              suffix=""
              mob={mob}
            />
            <Metric
              label="Galleries live"
              value={loading ? "—" : fmt(health.galleriesDelivered)}
              suffix={loading ? "" : ` of ${events.length}`}
              mob={mob}
            />
          </div>
        </section>

        {/* ── 3a. RECENT EVENTS — horizontal editorial reel ───────── */}
        <section style={{ marginBottom: mob ? 48 : 80 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <SectionLabel noMargin>Recent work</SectionLabel>
            <button
              onClick={() => navigate("/dashboard/events")}
              style={{
                background: "transparent",
                border: 0,
                cursor: "pointer",
                fontFamily: SANS,
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: PALETTE.gold,
                padding: 0,
                minHeight: 44,
              }}
            >
              All events →
            </button>
          </div>

          {loading ? (
            <EventReelSkeleton mob={mob} />
          ) : events.length === 0 ? (
            <EmptyEvents
              onCreate={() => setCreateEventOpen(true)}
              mob={mob}
            />
          ) : (
            <div
              style={{
                display: "flex",
                gap: 16,
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                scrollPaddingLeft: mob ? 20 : 48,
                margin: mob ? "0 -20px" : "0 -48px",
                padding: mob ? "0 20px 8px" : "0 48px 8px",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
              }}
              className="mai-no-scrollbar"
            >
              {events.map((e, i) => (
                <EventCard
                  key={e.id}
                  event={e}
                  index={i}
                  mob={mob}
                  onClick={() => navigate(`/dashboard/events/${e.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── 3b. ACTIVITY FEED ───────────────────────────────────── */}
        {activity.length > 0 && (
          <section style={{ marginBottom: mob ? 48 : 80 }}>
            <SectionLabel>What's been happening</SectionLabel>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                borderTop: `1px solid ${PALETTE.rule}`,
              }}
            >
              {activity.map((a) => (
                <li
                  key={a.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: mob ? "1fr auto" : "120px 1fr auto",
                    gap: 16,
                    alignItems: "baseline",
                    padding: "20px 0",
                    borderBottom: `1px solid ${PALETTE.rule}`,
                  }}
                >
                  {!mob && (
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: 11,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: PALETTE.inkSoft,
                      }}
                    >
                      {labelFor(a.kind)}
                    </span>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: SERIF,
                        fontWeight: 400,
                        fontSize: mob ? 18 : 22,
                        lineHeight: 1.25,
                        color: PALETTE.ink,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.text}
                    </div>
                    {a.meta && (
                      <div
                        style={{
                          fontFamily: SANS,
                          fontSize: 12,
                          color: PALETTE.inkSoft,
                          marginTop: 4,
                        }}
                      >
                        {mob ? `${labelFor(a.kind)} · ${a.meta}` : a.meta}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 11,
                      letterSpacing: "0.12em",
                      color: PALETTE.inkSoft,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {timeAgo(a.ts)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── 4. ONE PRIMARY ACTION ───────────────────────────────── */}
        {!mob && (
          <section
            style={{
              marginTop: 96,
              borderTop: `1px solid ${PALETTE.rule}`,
              paddingTop: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 32,
            }}
          >
            <div style={{ maxWidth: 480 }}>
              <p
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: 32,
                  lineHeight: 1.25,
                  color: PALETTE.ink,
                  margin: 0,
                }}
              >
                Begin the next story.
              </p>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: 13,
                  color: PALETTE.inkSoft,
                  marginTop: 12,
                  lineHeight: 1.6,
                }}
              >
                A new event opens a new chapter in your studio's archive.
              </p>
            </div>
            <PrimaryAction
              onClick={() => setCreateEventOpen(true)}
              label="Create event"
            />
          </section>
        )}
      </main>

      {/* ── Mobile sticky primary action ─────────────────────────── */}
      {mob && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 60,
            background: PALETTE.bg,
            borderTop: `1px solid ${PALETTE.rule}`,
            padding: "12px 20px calc(12px + env(safe-area-inset-bottom, 0px))",
            paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <PrimaryAction
            onClick={() => setCreateEventOpen(true)}
            label="Create event"
            full
          />
        </div>
      )}

      <DrawerMenu open={drawer.open} onClose={drawer.close} />
      {mob && <MobileBottomNav />}

      <Suspense fallback={null}>
        {createEventOpen && (
          <CreateEventModal
            open={createEventOpen}
            onOpenChange={setCreateEventOpen}
            onCreated={(id) => navigate(`/dashboard/events/${id}`)}
          />
        )}
      </Suspense>

      {/* Local keyframes (no Tailwind config dependency) */}
      <style>{`
        @keyframes mai-load {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .mai-no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes mai-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Subcomponents — kept inline, raw, no shadcn
   ────────────────────────────────────────────────────────────────────────── */

function SectionLabel({
  children,
  noMargin,
}: {
  children: React.ReactNode;
  noMargin?: boolean;
}) {
  return (
    <p
      style={{
        fontFamily: SANS,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: PALETTE.inkSoft,
        margin: 0,
        marginBottom: noMargin ? 0 : 24,
      }}
    >
      {children}
    </p>
  );
}

function Metric({
  label,
  value,
  suffix,
  progress,
  mob,
}: {
  label: string;
  value: string;
  suffix?: string;
  progress?: number | null;
  mob: boolean;
}) {
  return (
    <div
      style={{
        padding: mob ? "20px 16px" : "32px 24px",
        borderRight: `1px solid ${PALETTE.rule}`,
        borderBottom: `1px solid ${PALETTE.rule}`,
        background: PALETTE.bg,
        minHeight: mob ? 96 : 140,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <p
        style={{
          fontFamily: SANS,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: PALETTE.inkSoft,
          margin: 0,
        }}
      >
        {label}
      </p>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 4,
            marginTop: 12,
          }}
        >
          <span
            style={{
              fontFamily: SERIF,
              fontWeight: 300,
              fontSize: mob ? 32 : 44,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: PALETTE.ink,
            }}
          >
            {value}
          </span>
          {suffix && (
            <span
              style={{
                fontFamily: SANS,
                fontSize: 11,
                color: PALETTE.inkSoft,
                letterSpacing: "0.04em",
              }}
            >
              {suffix}
            </span>
          )}
        </div>
        {typeof progress === "number" && (
          <div
            style={{
              marginTop: 12,
              height: 1,
              background: PALETTE.rule,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                background: PALETTE.gold,
                height: 1,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  index,
  mob,
  onClick,
}: {
  event: EventRow;
  index: number;
  mob: boolean;
  onClick: () => void;
}) {
  const w = mob ? 260 : 340;
  const cover =
    event.cover_url ||
    `https://source.unsplash.com/featured/${w}x${Math.round(
      w * 1.25
    )}/?indianwedding,photography&sig=${event.id.slice(0, 6)}`;
  const dateStr = event.event_date
    ? new Date(event.event_date)
        .toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .toUpperCase()
    : "DATE TBC";

  return (
    <button
      onClick={onClick}
      style={{
        flex: "0 0 auto",
        width: w,
        scrollSnapAlign: "start",
        background: "transparent",
        border: 0,
        padding: 0,
        margin: 0,
        cursor: "pointer",
        textAlign: "left",
        animation: `mai-fade-up 0.5s ${index * 60}ms ease both`,
        minHeight: 44,
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "4 / 5",
          background: "#EDE9E2",
          overflow: "hidden",
          borderRadius: 0,
          position: "relative",
        }}
      >
        <img
          src={cover}
          alt={event.name}
          loading={index < 2 ? "eager" : "lazy"}
          decoding="async"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "transform 600ms cubic-bezier(.2,.7,.2,1)",
          }}
        />
        {event.is_published && (
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              fontFamily: SANS,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: PALETTE.paper,
              background: "rgba(26,25,23,0.72)",
              padding: "4px 8px",
              backdropFilter: "blur(4px)",
            }}
          >
            Live
          </span>
        )}
      </div>

      <div style={{ paddingTop: 16 }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: PALETTE.inkSoft,
            marginBottom: 6,
          }}
        >
          {dateStr}
          {event.location ? ` · ${event.location}` : ""}
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: mob ? 20 : 24,
            fontWeight: 400,
            color: PALETTE.ink,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {event.name}
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 11,
            color: PALETTE.inkSoft,
            marginTop: 8,
            letterSpacing: "0.04em",
          }}
        >
          {(event.photo_count || 0).toLocaleString("en-IN")} photographs
        </div>
      </div>
    </button>
  );
}

function EventReelSkeleton({ mob }: { mob: boolean }) {
  const w = mob ? 260 : 340;
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        overflowX: "hidden",
      }}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ flex: "0 0 auto", width: w }}>
          <div
            style={{
              width: "100%",
              aspectRatio: "4 / 5",
              background: "#EFECE6",
            }}
          />
          <div
            style={{
              height: 10,
              width: "40%",
              marginTop: 16,
              background: "#EFECE6",
            }}
          />
          <div
            style={{
              height: 18,
              width: "80%",
              marginTop: 12,
              background: "#EFECE6",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyEvents({
  onCreate,
  mob,
}: {
  onCreate: () => void;
  mob: boolean;
}) {
  return (
    <div
      style={{
        border: `1px solid ${PALETTE.rule}`,
        padding: mob ? "48px 24px" : "80px 48px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: mob ? 24 : 32,
          color: PALETTE.ink,
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        The first chapter awaits.
      </p>
      <p
        style={{
          fontFamily: SANS,
          fontSize: 13,
          color: PALETTE.inkSoft,
          marginTop: 12,
          marginBottom: 24,
        }}
      >
        Create an event to begin your studio's archive.
      </p>
      <PrimaryAction onClick={onCreate} label="Create event" />
    </div>
  );
}

function PrimaryAction({
  onClick,
  label,
  full,
}: {
  onClick: () => void;
  label: string;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48,
        padding: "0 32px",
        width: full ? "100%" : "auto",
        background: PALETTE.ink,
        color: PALETTE.paper,
        border: 0,
        borderRadius: 0,
        fontFamily: SANS,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "background 160ms ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          PALETTE.gold;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = PALETTE.ink;
      }}
    >
      {label}
    </button>
  );
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function labelFor(k: ActivityRow["kind"]) {
  switch (k) {
    case "view":
      return "Viewed";
    case "favorite":
      return "Favorited";
    case "download":
      return "Downloaded";
    default:
      return "Event";
  }
}

function timeAgo(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts)
    .toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    .toUpperCase();
}
