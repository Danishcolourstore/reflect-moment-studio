import { lazy, Suspense, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useViewMode } from "@/lib/ViewModeContext";
import { useScrollChrome } from "@/lib/ScrollChromeContext";
import { Home, Calendar, Scissors, Briefcase, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const CreateEventModal = lazy(() =>
  import("@/components/CreateEventModal").then((m) => ({ default: m.CreateEventModal })),
);

type TabKey = "home" | "events" | "create" | "cull" | "studio";

interface Tab {
  key: TabKey;
  label: string;
  icon: typeof Calendar;
  url?: string;
  match?: (path: string) => boolean;
  isCreate?: boolean;
}

const TABS: Tab[] = [
  {
    key: "home",
    label: "Home",
    icon: Home,
    url: "/home",
    match: (p) => p === "/home",
  },
  {
    key: "events",
    label: "Events",
    icon: Calendar,
    url: "/dashboard/events",
    match: (p) => p.startsWith("/dashboard/events"),
  },
  { key: "create", label: "New", icon: Plus, isCreate: true },
  {
    key: "cull",
    label: "Cull",
    icon: Scissors,
    url: "/dashboard/cheetah",
    match: (p) => p.startsWith("/dashboard/cheetah") || p === "/cheetah",
  },
  {
    key: "studio",
    label: "Studio",
    icon: Briefcase,
    url: "/dashboard/more",
    match: (p) => p.startsWith("/dashboard/more") || p.startsWith("/dashboard/business") || p.startsWith("/dashboard/analytics") || p.startsWith("/dashboard/clients") || p.startsWith("/dashboard/branding") || p.startsWith("/dashboard/website") || p.startsWith("/studio/storybook"),
  },
];

export function MobileBottomNav() {
  const { isMobile } = useViewMode();
  const { navState } = useScrollChrome();
  const navigate = useNavigate();
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);

  if (!isMobile) return null;

  const navHidden = navState === "hidden";

  const activeKey: TabKey | null = (() => {
    for (const t of TABS) {
      if (t.match && t.match(location.pathname)) return t.key;
    }
    return null;
  })();

  const handleCreate = () => {
    if (activeKey === "cull") {
      navigate("/dashboard/cheetah");
      return;
    }
    if (!createOpen) setCreateOpen(true);
  };

  const handleTap = (tab: Tab) => {
    if (tab.isCreate) {
      handleCreate();
      return;
    }
    if (tab.url) navigate(tab.url);
  };

  return (
    <>
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-[60]",
          "flex h-16 items-center justify-around",
          "border-t border-rule bg-paper/90 backdrop-blur-xl",
          "safe-area-pb",
          "transition-transform duration-200 ease-out will-change-transform",
          navHidden ? "translate-y-full" : "translate-y-0",
        )}
      >
        {TABS.map((tab) => {
          const active = activeKey === tab.key;
          const Icon = tab.icon;

          if (tab.isCreate) {
            return (
              <button
                key={tab.key}
                onClick={() => handleTap(tab)}
                aria-label="Create"
                className="flex flex-1 flex-col items-center justify-center gap-1 active:scale-[0.92]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper">
                  <Plus size={18} strokeWidth={2} />
                </div>
                <span className="text-2xs font-medium text-ink-muted">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.key}
              onClick={() => handleTap(tab)}
              aria-label={tab.label}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5",
                "transition-colors duration-fast active:scale-[0.98]",
              )}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2 : 1.5}
                className={cn(
                  "transition-all duration-fast",
                  active ? "text-ink" : "text-ink-muted",
                )}
              />
              {/* Active indicator dot */}
              <span
                className={cn(
                  "h-1 w-1 rounded-full bg-ink transition-transform duration-fast",
                  active ? "scale-100" : "scale-0",
                )}
              />
              <span
                className={cn(
                  "text-2xs transition-colors duration-fast",
                  active ? "font-semibold text-ink" : "font-medium text-ink-muted",
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

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
