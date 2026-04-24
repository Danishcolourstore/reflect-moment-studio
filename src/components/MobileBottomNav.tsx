import { useNavigate, useLocation } from "react-router-dom";
import { useViewMode } from "@/lib/ViewModeContext";
import { CalendarDays, Image, Grid3X3, Users, Plus, BookOpen } from "lucide-react";

const TABS = [
  { title: "Events", url: "/dashboard/events", icon: CalendarDays },
  { title: "Grid", url: "/builder-test", icon: Grid3X3 },
  { title: "Gallery", url: "/home", icon: Image, center: true },
  { title: "Album Builder", url: "/dashboard/album-designer", icon: BookOpen },
  { title: "Clients", url: "/dashboard/clients", icon: Users },
];

const GOLD = "hsl(0, 0%, 10%)";
const INK_MUTED = "hsl(0, 0%, 43%)";
const RULE = "hsl(40, 12%, 90%)";
const WASH = "hsl(45, 12%, 95%)";

export function MobileBottomNav() {
  const { isMobile } = useViewMode();
  const navigate = useNavigate();
  const location = useLocation();

  const activeIndex = TABS.findIndex((tab) => {
    if (tab.url === "/home") return location.pathname === "/home";
    return location.pathname.startsWith(tab.url);
  });

  if (!isMobile) return null;

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        background: "hsla(45, 14%, 97%, 0.85)",
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
      {TABS.map((tab, i) => {
        const active = i === activeIndex;
        const Icon = tab.icon;
        const isCenter = tab.center;
        const color = active ? GOLD : INK_MUTED;

        if (isCenter) {
          return (
            <button
              key={tab.url}
              onClick={() => navigate(tab.url)}
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
                  background: active ? GOLD : WASH,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 120ms cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                <Plus size={18} strokeWidth={1.75} style={{ color: active ? "hsl(60, 14%, 98%)" : INK_MUTED }} />
              </div>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 9,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color,
                  fontWeight: 500,
                  lineHeight: 1.1,
                  maxWidth: 58,
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
            key={tab.url}
            onClick={() => navigate(tab.url)}
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
                fontSize: 9,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color,
                fontWeight: 500,
                lineHeight: 1.1,
                maxWidth: 58,
                textAlign: "center",
              }}
            >
              {tab.title}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
