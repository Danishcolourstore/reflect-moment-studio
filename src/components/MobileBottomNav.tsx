import { useNavigate, useLocation } from "react-router-dom";
import { useViewMode } from "@/lib/ViewModeContext";
import { Camera, CalendarDays, User, SlidersHorizontal, Home } from "lucide-react";

const TABS = [
  { title: "Gallery", url: "/home", icon: Camera },
  { title: "Events", url: "/dashboard/events", icon: CalendarDays },
  { title: "Clients", url: "/dashboard/clients", icon: User },
  { title: "Settings", url: "/dashboard/profile", icon: SlidersHorizontal },
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
      className="fixed bottom-0 left-0 right-0 z-40 safe-area-pb"
      style={{
        background: "#FFFFFF",
        borderTop: "1px solid #F0EDE8",
        height: 56,
      }}
    >
      <div className="flex justify-around items-center h-full px-2">
        {TABS.map((tab) => {
          const active = isActive(tab.url);
          const Icon = tab.icon;
          return (
            <button
              key={tab.url}
              onClick={() => navigate(tab.url)}
              className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] flex-1 transition-colors duration-200"
            >
              <Icon
                className="h-5 w-5"
                strokeWidth={1.5}
                style={{ color: active ? "#C8A97E" : "#AAAAAA" }}
              />
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  color: active ? "#C8A97E" : "#AAAAAA",
                  fontWeight: 400,
                }}
              >
                {tab.title}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
