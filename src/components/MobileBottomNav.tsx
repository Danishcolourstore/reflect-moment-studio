import { lazy, Suspense, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useViewMode } from "@/lib/ViewModeContext";
import { Calendar, Zap, BookOpen, MoreHorizontal, Plus } from "lucide-react";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { useEntiranOpen } from "@/components/entiran/EntiranProvider";

const CreateEventModal = lazy(() =>
  import("@/components/CreateEventModal").then((m) => ({ default: m.CreateEventModal })),
);

type TabKey = "events" | "cheetah" | "gallery" | "storybook" | "more";

interface Tab {
  key: TabKey;
  title: string;
  icon: typeof Calendar;
  url?: string;
  match?: (path: string) => boolean;
  center?: boolean;
}

const TABS: Tab[] = [
  {
    key: "events",
    title: "Events",
    icon: Calendar,
    url: "/dashboard/events",
    match: (p) => p.startsWith("/dashboard/events"),
  },
  {
    key: "cheetah",
    title: "Cheetah",
    icon: Zap,
    url: "/dashboard/cheetah",
    match: (p) => p.startsWith("/dashboard/cheetah") || p === "/cheetah",
  },
  { key: "gallery", title: "Gallery", icon: Plus, center: true },
  {
    key: "storybook",
    title: "Storybook",
    icon: BookOpen,
    url: "/storybook",
    match: (p) => p.startsWith("/storybook") || p.startsWith("/dashboard/storybook"),
  },
  {
    key: "more",
    title: "More",
    icon: MoreHorizontal,
    url: "/dashboard/more",
    match: (p) => p.startsWith("/dashboard/more"),
  },
];

const ACTIVE = "hsl(var(--primary))";
const MUTED = "hsl(var(--muted-foreground))";
const RULE = "hsl(var(--border))";
const WASH = "hsl(var(--secondary))";
const PAPER = "hsl(var(--background))";

export function MobileBottomNav() {
  const { isMobile } = useViewMode();
  const navigate = useNavigate();
  const location = useLocation();
  const drawer = useDrawerMenu();
  const { openBot } = useEntiranOpen();
  const [createOpen, setCreateOpen] = useState(false);

  if (!isMobile) return null;

  const activeKey: TabKey | null = (() => {
    for (const t of TABS) {
      if (t.match && t.match(location.pathname)) return t.key;
    }
    return null;
  })();

  const handleTap = (tab: Tab) => {
    if (tab.center) {
      setCreateOpen(true);
      return;
    }
    if (tab.key === "daan") {
      navigate("/daan");
      return;
    }
    if (tab.key === "more") {
      navigate("/dashboard/more");
      return;
    }
    if (tab.url) navigate(tab.url);
  };

  return (
    <>
      <nav
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 60,
          background: `color-mix(in hsl, ${PAPER} 86%, transparent)`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: `1px solid ${RULE}`,
          height: 64,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        {TABS.map((tab) => {
          const active = activeKey === tab.key;
          const Icon = tab.icon;
          const isCenter = tab.center;
          const color = active ? ACTIVE : MUTED;

          if (isCenter) {
            return (
              <button
                key={tab.key}
                onClick={() => handleTap(tab)}
                aria-label="Create event"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  flex: 1,
                  minHeight: 44,
                  minWidth: 44,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: WASH,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 120ms cubic-bezier(0.4,0,0.2,1)",
                  }}
                >
                  <Plus size={18} strokeWidth={1.75} style={{ color: MUTED }} />
                </div>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 10,
                    fontWeight: 400,
                    letterSpacing: "0.04em",
                    color,
                    lineHeight: 1.1,
                    maxWidth: 64,
                    textAlign: "center",
                  }}
                >
                  {tab.title}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.key}
              onClick={() => handleTap(tab)}
              aria-label={tab.title}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                flex: 1,
                minHeight: 44,
                minWidth: 44,
                transition: "color 120ms cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <Icon size={20} strokeWidth={1.5} style={{ color }} />
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 400,
                  letterSpacing: "0.04em",
                  color,
                  lineHeight: 1.1,
                  maxWidth: 64,
                  textAlign: "center",
                }}
              >
                {tab.title}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Drawer still available for hamburger menu triggers on other pages */}
      <DrawerMenu open={drawer.open} onClose={drawer.close} />

      {createOpen && (
        <Suspense fallback={null}>
          <CreateEventModal
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreated={(eventId) => {
              setCreateOpen(false);
              navigate(`/dashboard/events/${eventId}`);
            }}
          />
        </Suspense>
      )}
    </>
  );
}
