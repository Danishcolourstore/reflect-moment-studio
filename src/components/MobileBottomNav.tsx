import { useNavigate, useLocation } from "react-router-dom";
import { useViewMode } from "@/lib/ViewModeContext";
import { Home, Camera, Users, Settings, Zap } from "lucide-react";

const TABS = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Events", url: "/dashboard/events", icon: Camera },
  { title: "Cheetah", url: "/dashboard/cheetah-live", icon: Zap },
  { title: "Clients", url: "/dashboard/clients", icon: Users },
  { title: "Settings", url: "/dashboard/profile", icon: Settings },
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border safe-area-pb">
      <div className="flex justify-between items-center px-2 h-[56px]">
        {TABS.map((tab) => {
          const active = isActive(tab.url);
          const Icon = tab.icon;
          return (
            <button
              key={tab.url}
              onClick={() => navigate(tab.url)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2 : 1.5} />
              <span className="text-[9px] tracking-wider uppercase font-medium">
                {tab.title}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
