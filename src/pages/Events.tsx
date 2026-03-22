import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { CreateEventModal } from "@/components/CreateEventModal";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { colors, fonts, spacing } from "@/styles/design-tokens";

const NAV_ITEMS = [
  { label: "HOME", path: "/home" },
  { label: "EVENTS", path: "/dashboard/events" },
  { label: "STORYBOOK", path: "/dashboard/storybook" },
  { label: "CHEETAH", path: "/dashboard/cheetah" },
  { label: "RYFINE", path: "/refyn" },
  { label: "ANALYTICS", path: "/dashboard/analytics" },
  { label: "STUDIO FEED", path: "/dashboard/website-editor" },
  { label: "MORE", path: "__drawer__" },
];

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
  const drawer = useDrawerMenu();
  const { user } = useAuth();
  const [navHover, setNavHover] = useState<number | null>(null);
  const [imgHover, setImgHover] = useState<string | null>(null);
  const [mob, setMob] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

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
    <div style={{ minHeight: "100vh", width: "100%", background: colors.bg, overflow: "visible" }}>
      {/* NAV */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(10,10,11,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${colors.border}`,
          padding: mob ? "8px 16px" : "12px 20px",
          paddingTop: mob ? "calc(8px + env(safe-area-inset-top, 0px))" : "calc(12px + env(safe-area-inset-top, 0px))",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: mob ? 6 : 8 }}>
          <span
            style={{ fontFamily: fonts.display, fontSize: mob ? 18 : 24, fontWeight: 300, color: colors.gold, cursor: "pointer", letterSpacing: "0.06em" }}
            onClick={() => navigate("/home")}
          >
            MirrorAI
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: mob ? 12 : 20,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {NAV_ITEMS.map((item, i) => {
            const isActive = item.label === "EVENTS";
            const isHov = navHover === i;
            return (
              <button
                key={item.label}
                onClick={() => item.path === "__drawer__" ? drawer.toggle() : navigate(item.path)}
                onMouseEnter={() => setNavHover(i)}
                onMouseLeave={() => setNavHover(null)}
                style={{
                  fontFamily: fonts.body,
                  fontSize: mob ? 10 : 14,
                  fontWeight: 400,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.12em",
                  color: isActive ? colors.gold : isHov ? colors.cream : colors.textMuted,
                  background: "none",
                  border: "none",
                  borderBottom: isActive ? `2px solid ${colors.gold}` : "2px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap" as const,
                  padding: mob ? "8px 0" : "12px 0",
                  minHeight: 44,
                  transition: "color 0.3s",
                  flexShrink: 0,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* CREATE BUTTON */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: mob ? `20px ${spacing.pageMobile} 0` : "28px 20px 0" }}>
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            fontFamily: fonts.body,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase" as const,
            letterSpacing: "0.12em",
            background: colors.gold,
            color: colors.bg,
            border: "none",
            padding: "12px 28px",
            cursor: "pointer",
            transition: "opacity 0.3s",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          + Create Event
        </button>
      </div>

      {/* EVENT CARDS */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: mob ? "24px 0" : "40px 0" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textMuted }}>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <p style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 300, color: colors.text, marginBottom: 12 }}>
              No events yet
            </p>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>
              Create your first event to get started.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              style={{
                fontFamily: fonts.body,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase" as const,
                letterSpacing: "0.12em",
                background: colors.gold,
                color: colors.bg,
                border: "none",
                padding: "12px 28px",
                cursor: "pointer",
              }}
            >
              + Create Event
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: mob ? 40 : 48 }}>
            {events.map((evt) => (
              <FadeCard key={evt.id}>
                <div
                  style={{
                    overflow: "hidden",
                    lineHeight: 0,
                    cursor: "pointer",
                    transform: imgHover === evt.id ? "scale(1.02)" : "scale(1)",
                    transition: "transform 0.4s ease",
                  }}
                  onMouseEnter={() => setImgHover(evt.id)}
                  onMouseLeave={() => setImgHover(null)}
                  onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                >
                  {evt.cover_url ? (
                    <img
                      src={evt.cover_url}
                      alt={evt.name}
                      style={{ width: "100%", height: "auto", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: mob ? "65vw" : 400,
                      background: `linear-gradient(135deg, ${colors.surface}, ${colors.surface2})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <span style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted }}>No cover photo</span>
                    </div>
                  )}
                </div>

                <div
                  style={{ padding: mob ? `0 ${spacing.pageMobile}` : "0 20px", cursor: "pointer" }}
                  onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                >
                  <div
                    style={{
                      fontFamily: fonts.display,
                      fontSize: mob ? 16 : 18,
                      fontWeight: 400,
                      color: colors.text,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.06em",
                      marginTop: mob ? 16 : 20,
                    }}
                  >
                    {evt.name}
                  </div>

                  <div style={{ fontFamily: fonts.body, fontSize: mob ? 12 : 14, fontWeight: 400, color: colors.textMuted, marginTop: 6 }}>
                    {evt.event_date ? format(new Date(evt.event_date), "MMMM d, yyyy") : "No date set"}
                    {evt.location ? ` · ${evt.location}` : ""}
                  </div>

                  <div style={{
                    fontFamily: fonts.body,
                    fontSize: mob ? 11 : 13,
                    fontWeight: 400,
                    color: colors.textDim,
                    marginTop: 8,
                  }}>
                    {evt.photo_count || 0} photos
                  </div>

                  <div style={{ height: 1, background: colors.border, marginTop: 20 }} />
                </div>
              </FadeCard>
            ))}
          </div>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: mob ? "40px 16px 28px" : "60px 20px 40px", paddingBottom: `calc(${mob ? 28 : 40}px + env(safe-area-inset-bottom, 0px))` }}>
        <div style={{ fontFamily: fonts.body, fontSize: mob ? 10 : 12, color: colors.textMuted, letterSpacing: "0.1em" }}>© MIRRORAI</div>
      </footer>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />
      <CreateEventModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(eventId) => {
          fetchEvents();
          navigate(`/dashboard/events/${eventId}`);
        }}
      />
    </div>
  );
}
