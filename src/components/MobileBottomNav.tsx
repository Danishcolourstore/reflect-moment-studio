import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Calendar, Plus, Sparkles, User, Camera, Upload, BookOpen, Zap, Palette, Layers } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useDeviceDetect } from "@/hooks/use-device-detect";
import { colors, fonts } from "@/styles/design-tokens";

const TABS = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Events", url: "/dashboard/events", icon: Calendar },
  { title: "Create", url: "", icon: Plus, isAction: true },
  { title: "Tools", url: "", icon: Sparkles, isAction: true },
  { title: "Profile", url: "/dashboard/profile", icon: User },
];

const CREATE_ACTIONS = [
  { title: "New Event", url: "/dashboard/events", icon: Camera },
  { title: "Upload Photos", url: "/dashboard/upload", icon: Upload },
  { title: "New Storybook", url: "/dashboard/storybook", icon: BookOpen },
];

const TOOL_ACTIONS = [
  { title: "Storybook", url: "/dashboard/storybook", icon: BookOpen },
  { title: "Cheetah", url: "/dashboard/cheetah-live", icon: Zap },
  { title: "Retouch", url: "/colour-store", icon: Palette },
];

export function MobileBottomNav() {
  const device = useDeviceDetect();
  const navigate = useNavigate();
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  // Detect light theme
  const [isLt, setIsLt] = useState(() => {
    const t = localStorage.getItem("theme") || "dark";
    return t === "light" || t === "classic";
  });
  useState(() => {
    const check = () => {
      const el = document.documentElement;
      setIsLt(el.classList.contains("light") || el.classList.contains("classic"));
    };
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  });

  if (!device.isPhone) return null;

  const isActive = (url: string) => {
    if (!url) return false;
    if (url === "/home") return location.pathname === "/home";
    return location.pathname.startsWith(url);
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch"
        style={{
          height: 56,
          background: isLt ? "#FFFFFF" : colors.bg,
          borderTop: `1px solid ${isLt ? "rgba(0,0,0,0.08)" : colors.border}`,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {TABS.map((tab) => {
          if (tab.title === "Create") {
            return (
              <Sheet key="create" open={createOpen} onOpenChange={setCreateOpen}>
                <SheetTrigger asChild>
                  <button
                    className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px]"
                    style={{ color: isLt ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.45)" }}
                  >
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{ width: 28, height: 28, background: colors.gold }}
                    >
                      <Plus className="h-[16px] w-[16px]" style={{ color: colors.bg }} strokeWidth={2.5} />
                    </div>
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="rounded-t-[20px]"
                  style={{
                    background: colors.surface,
                    border: "none",
                    paddingBottom: "env(safe-area-inset-bottom, 16px)",
                  }}
                >
                  <div className="pt-4 pb-4 space-y-1">
                    <p style={{
                      fontFamily: fonts.body, fontSize: 9, fontWeight: 600,
                      color: colors.textMuted, letterSpacing: "0.2em",
                      textTransform: "uppercase", padding: "0 16px", marginBottom: 12,
                    }}>Create</p>
                    {CREATE_ACTIONS.map((action) => (
                      <button
                        key={action.url}
                        onClick={() => { navigate(action.url); setCreateOpen(false); }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors min-h-[48px]"
                        style={{ color: colors.text, fontFamily: fonts.body, fontSize: 14 }}
                      >
                        <action.icon className="h-5 w-5" style={{ color: colors.gold }} strokeWidth={1.5} />
                        {action.title}
                      </button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            );
          }

          if (tab.title === "Tools") {
            return (
              <Sheet key="tools" open={toolsOpen} onOpenChange={setToolsOpen}>
                <SheetTrigger asChild>
                  <button
                    className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px]"
                    style={{ color: isLt ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.45)" }}
                  >
                    <tab.icon className="h-[22px] w-[22px]" strokeWidth={1.6} />
                    <span style={{ fontFamily: fonts.body, fontSize: 10, fontWeight: 500 }}>{tab.title}</span>
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="rounded-t-[20px]"
                  style={{
                    background: colors.surface,
                    border: "none",
                    paddingBottom: "env(safe-area-inset-bottom, 16px)",
                  }}
                >
                  <div className="pt-4 pb-4 space-y-1">
                    <p style={{
                      fontFamily: fonts.body, fontSize: 9, fontWeight: 600,
                      color: colors.textMuted, letterSpacing: "0.2em",
                      textTransform: "uppercase", padding: "0 16px", marginBottom: 12,
                    }}>Tools</p>
                    {TOOL_ACTIONS.map((action) => (
                      <button
                        key={action.url}
                        onClick={() => { navigate(action.url); setToolsOpen(false); }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors min-h-[48px]"
                        style={{ color: colors.text, fontFamily: fonts.body, fontSize: 14 }}
                      >
                        <action.icon className="h-5 w-5" style={{ color: colors.gold }} strokeWidth={1.5} />
                        {action.title}
                      </button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            );
          }

          const active = isActive(tab.url);
          return (
            <button
              key={tab.url}
              onClick={() => navigate(tab.url)}
              className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors"
              style={{ color: active ? colors.gold : (isLt ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)") }}
            >
              <tab.icon className="h-[22px] w-[22px]" strokeWidth={1.6} />
              <span style={{ fontFamily: fonts.body, fontSize: 10, fontWeight: 500 }}>{tab.title}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
