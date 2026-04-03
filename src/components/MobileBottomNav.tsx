import { useNavigate, useLocation } from "react-router-dom";
import { useViewMode } from "@/lib/ViewModeContext";
import { fonts } from "@/styles/design-tokens";

const TABS = [
  { title: "GALLERY", url: "/home", emoji: "📸" },
  { title: "EVENTS", url: "/dashboard/events", emoji: "📅" },
  { title: "CLIENT", url: "/dashboard/clients", emoji: "🖼️" },
  { title: "SET", url: "/dashboard/profile", emoji: "⚙️" },
];

export function MobileBottomNav() {
  const { isMobile } = useViewMode();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isMobile) return null;

  const isActive = (url: string) => {
    if (url === "/home") return location.pathname === "/home";
    return location.pathname.startsWith(url);
  };

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        borderTop: "1px solid #f0f0f0",
        background: "white",
        paddingBottom: "env(safe-area-inset-bottom)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 12px",
        gap: 4,
      }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.url);
        return (
          <button
            key={tab.url}
            onClick={() => navigate(tab.url)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "8px 12px",
              background: "none",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.emoji}</span>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: 11,
                color: active ? "#d97706" : "#666666",
                fontWeight: active ? 600 : 400,
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
