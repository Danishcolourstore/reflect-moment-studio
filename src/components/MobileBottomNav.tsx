import { useNavigate, useLocation } from "react-router-dom";
import { useViewMode } from "@/lib/ViewModeContext";
import { Home, CalendarDays, Image, Sparkles, User } from "lucide-react";

const TABS = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Events", url: "/dashboard/events", icon: CalendarDays },
  { title: "Gallery", url: "/dashboard/gallery", icon: Image },
  { title: "AI Tools", url: "/dashboard/ai-tools", icon: Sparkles },
  { title: "Profile", url: "/dashboard/profile", icon: User },
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
        background: "#ffffff",
        borderTop: "1px solid #e5e5e5",
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
              gap: 4,
              flex: 1,
              minHeight: 44,
              minWidth: 44,
              padding: "8px 0",
            }}
          >
            <Icon
              size={22}
              strokeWidth={1.5}
              style={{
                color: active ? "#111111" : "#9ca3af",
                transition: "color 0.15s ease",
              }}
            />
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.6rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: active ? "#111111" : "#9ca3af",
                fontWeight: active ? 600 : 400,
                transition: "color 0.15s ease",
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
