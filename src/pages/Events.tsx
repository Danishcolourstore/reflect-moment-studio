import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { CreateEventModal } from "@/components/CreateEventModal";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const playfair = '"Playfair Display", serif';
const montserrat = '"Montserrat", sans-serif';

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
    <div style={{ minHeight: "100vh", width: "100%", background: "#FFFFFF", overflow: "visible" }}>
      {/* NAV */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#FFFFFF",
          borderBottom: "1px solid #F2F2F2",
          padding: mob ? "8px 16px" : "12px 20px",
          paddingTop: mob ? "calc(8px + env(safe-area-inset-top, 0px))" : "calc(12px + env(safe-area-inset-top, 0px))",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: mob ? 6 : 8 }}>
          <span
            style={{ fontFamily: playfair, fontSize: mob ? 18 : 24, fontWeight: 700, color: "#000000", cursor: "pointer" }}
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
                  fontFamily: montserrat,
                  fontSize: mob ? 10 : 14,
                  fontWeight: 400,
                  textTransform: "uppercase" as const,
                  letterSpacing: "1px",
                  color: isActive || isHov ? "#000000" : "#666666",
                  background: "none",
                  border: "none",
                  borderBottom: isActive ? "2px solid #000000" : "2px solid transparent",
                  textDecoration: isHov && !isActive ? "underline" : "none",
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
      <div style={{ maxWidth: 720, margin: "0 auto", padding: mob ? "20px 16px 0" : "28px 20px 0" }}>
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            fontFamily: montserrat,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase" as const,
            letterSpacing: "1px",
            background: "#000000",
            color: "#FFFFFF",
            border: "none",
            padding: "12px 28px",
            cursor: "pointer",
            transition: "background 0.3s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#333333")}
          onMouseLeave={e => (e.currentTarget.style.background = "#000000")}
        >
          + Create Event
        </button>
      </div>

      {/* EVENT CARDS */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: mob ? "24px 0" : "40px 0" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <p style={{ fontFamily: montserrat, fontSize: 14, color: "#666666" }}>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <p style={{ fontFamily: playfair, fontSize: 22, fontWeight: 700, color: "#000000", marginBottom: 12 }}>
              No events yet
            </p>
            <p style={{ fontFamily: montserrat, fontSize: 14, color: "#666666", marginBottom: 24 }}>
              Create your first event to get started.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              style={{
                fontFamily: montserrat,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase" as const,
                letterSpacing: "1px",
                background: "#000000",
                color: "#FFFFFF",
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
                {/* Cover Image — full bleed */}
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
                      background: "linear-gradient(135deg, #f5f0ea, #e8e0d4, #f5f0ea)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <span style={{ fontFamily: montserrat, fontSize: 12, color: "#999999" }}>No cover photo</span>
                    </div>
                  )}
                </div>

                {/* Text content */}
                <div
                  style={{ padding: mob ? "0 16px" : "0 20px", cursor: "pointer" }}
                  onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                >
                  <div
                    style={{
                      fontFamily: playfair,
                      fontSize: mob ? 16 : 18,
                      fontWeight: 700,
                      color: "#000000",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.5px",
                      marginTop: mob ? 16 : 20,
                    }}
                  >
                    {evt.name}
                  </div>

                  <div style={{ fontFamily: montserrat, fontSize: mob ? 12 : 14, fontWeight: 400, color: "#666666", marginTop: 6 }}>
                    {evt.event_date ? format(new Date(evt.event_date), "MMMM d, yyyy") : "No date set"}
                    {evt.location ? ` · ${evt.location}` : ""}
                  </div>

                  <div style={{
                    fontFamily: montserrat,
                    fontSize: mob ? 11 : 13,
                    fontWeight: 400,
                    color: "#999999",
                    marginTop: 8,
                  }}>
                    {evt.photo_count || 0} photos
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: "#F2F2F2", marginTop: 20 }} />
                </div>
              </FadeCard>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ textAlign: "center", padding: mob ? "40px 16px 28px" : "60px 20px 40px", paddingBottom: `calc(${mob ? 28 : 40}px + env(safe-area-inset-bottom, 0px))` }}>
        <div style={{ fontFamily: montserrat, fontSize: mob ? 10 : 12, color: "#666666" }}>© MIRRORAI</div>
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
