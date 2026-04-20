import { useNavigate, useLocation } from "react-router-dom";
import { useViewMode } from "@/lib/ViewModeContext";
import { CalendarDays, Image, Grid3X3, Users, Plus, BookOpen } from "lucide-react";

const TABS = [
  { title: "Events", url: "/dashboard/events", icon: CalendarDays },
  { title: "Grid", url: "/builder-test", icon: Grid3X3 },
  { title: "Gallery", url: "/home", icon: Image, center: true },
  { title: "Album", url: "/dashboard/album-designer", icon: BookOpen },
  { title: "Clients", url: "/dashboard/clients", icon: Users },
];

const GOLD = "#1A1A1A";
const INK_MUTED = "#6E6E6E";
const RULE = "#E8E6E1";
const WASH = "#F4F3F0";

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
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: active ? GOLD : WASH,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 120ms cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                <Plus size={18} strokeWidth={1.75} style={{ color: active ? "#FAFAF8" : INK_MUTED }} />
              </div>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color,
                  fontWeight: 500,
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
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color,
                fontWeight: 500,
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
