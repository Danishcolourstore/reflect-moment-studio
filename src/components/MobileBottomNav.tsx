import { useNavigate, useLocation } from "react-router-dom";
import { useViewMode } from "@/lib/ViewModeContext";
import { Home, CalendarDays, Image, User } from "lucide-react";

const TABS = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Events", url: "/dashboard/events", icon: CalendarDays },
  { title: "Gallery", url: "/dashboard/cheetah-live", icon: Image },
  { title: "You", url: "/dashboard/profile", icon: User },
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
        zIndex: 40,
        background: "hsla(0, 0%, 100%, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid hsl(37, 10%, 92%)",
        height: 60,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      {TABS.map((tab, i) => {
        const active = i === activeIndex;
        const Icon = tab.icon;
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
              size={22}
              strokeWidth={1.5}
              style={{ color: active ? "hsl(48, 7%, 10%)" : "hsl(35, 4%, 65%)" }}
            />
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: active ? "hsl(48, 7%, 10%)" : "hsl(35, 4%, 65%)",
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
