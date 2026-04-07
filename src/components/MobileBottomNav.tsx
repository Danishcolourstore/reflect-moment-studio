import { useNavigate, useLocation } from "react-router-dom";
import { useViewMode } from "@/lib/ViewModeContext";
import { Camera, CalendarDays, User, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const TABS = [
  { title: "Gallery", url: "/home", icon: Camera },
  { title: "Events", url: "/dashboard/events", icon: CalendarDays },
  { title: "Client", url: "/dashboard/clients", icon: User },
  { title: "Set", url: "/dashboard/profile", icon: SlidersHorizontal },
];

const ACTIVE_COLOR = "#B8860B";
const INACTIVE_COLOR = "#9ca3af";

export function MobileBottomNav() {
  const { isMobile } = useViewMode();
  const navigate = useNavigate();
  const location = useLocation();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillX, setPillX] = useState(0);

  const activeIndex = TABS.findIndex((tab) => {
    if (tab.url === "/home") return location.pathname === "/home";
    return location.pathname.startsWith(tab.url);
  });

  useEffect(() => {
    const el = tabRefs.current[activeIndex];
    if (el) {
      const parent = el.parentElement;
      if (parent) {
        setPillX(el.offsetLeft + el.offsetWidth / 2);
      }
    }
  }, [activeIndex]);

  if (!isMobile) return null;

  return (
    <nav
      className="fixed left-0 right-0 z-40"
      style={{
        bottom: 0,
        padding: "0 12px calc(env(safe-area-inset-bottom, 0px) + 12px)",
      }}
    >
      <div
        className="relative flex justify-around items-center"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: 20,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
          height: 64,
        }}
      >
        {/* Sliding pill indicator */}
        {pillX > 0 && (
          <motion.div
            layoutId="tab-pill"
            className="absolute top-[6px]"
            animate={{ x: pillX - 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              width: 24,
              height: 3,
              borderRadius: 2,
              background: ACTIVE_COLOR,
            }}
          />
        )}

        {TABS.map((tab, i) => {
          const active = i === activeIndex;
          const Icon = tab.icon;
          return (
            <button
              key={tab.url}
              ref={(el) => { tabRefs.current[i] = el; }}
              onClick={() => navigate(tab.url)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1"
              style={{ minHeight: 44, minWidth: 44 }}
            >
              <Icon
                className="transition-colors duration-200"
                size={26}
                strokeWidth={1.5}
                style={{ color: active ? ACTIVE_COLOR : INACTIVE_COLOR }}
              />
              <span
                className="transition-colors duration-200"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: active ? ACTIVE_COLOR : INACTIVE_COLOR,
                  fontWeight: active ? 600 : 400,
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
