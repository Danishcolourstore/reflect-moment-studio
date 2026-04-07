import { useNavigate, useLocation } from "react-router-dom";
import { useViewMode } from "@/lib/ViewModeContext";
import { CalendarDays, Image, Grid3X3, BookOpen, Plus } from "lucide-react";

const TABS = [
  { title: "Events", url: "/dashboard/events", icon: CalendarDays },
  { title: "Gallery", url: "/home", icon: Image, center: true },
  { title: "Grid", url: "/builder-test", icon: Grid3X3 },
  { title: "Album", url: "/dashboard/albums", icon: BookOpen },
];

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
        background: "hsla(45, 14%, 97%, 0.94)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid hsl(37, 10%, 90%)",
        height: 56,
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
                gap: 2,
                flex: 1,
                minHeight: 44,
                minWidth: 44,
                position: "relative",
              }}
            >
              {/* Center plus circle */}
              <div style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: active ? "#C8A97E" : "hsl(37, 10%, 88%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s ease",
              }}>
                <Plus
                  size={18}
                  strokeWidth={2}
                  style={{ color: active ? "#fff" : "hsl(48, 7%, 30%)" }}
                />
              </div>
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.55rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: active ? "#C8A97E" : "hsl(35, 4%, 56%)",
                fontWeight: active ? 500 : 400,
              }}>
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
              gap: 3,
              flex: 1,
              minHeight: 44,
              minWidth: 44,
              transition: "color 0.2s ease",
            }}
          >
            <Icon
              size={21}
              strokeWidth={1.5}
              style={{ color: active ? "#C8A97E" : "hsl(35, 4%, 56%)" }}
            />
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.55rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: active ? "#C8A97E" : "hsl(35, 4%, 56%)",
                fontWeight: active ? 500 : 400,
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
