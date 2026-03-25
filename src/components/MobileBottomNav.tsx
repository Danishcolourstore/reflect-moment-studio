import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Calendar, Plus, Sparkles, User, Camera, Upload, BookOpen, Zap, Palette, Layers } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useDeviceDetect } from "@/hooks/use-device-detect";

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
  { title: "Cheetah", url: "/dashboard/cheetah-live", icon: Zap },
  { title: "Refyn", url: "/colour-store", icon: Palette },
  { title: "Storybook", url: "/dashboard/storybook", icon: BookOpen },
  { title: "Album Designer", url: "/dashboard/album-designer", icon: Layers },
];

export function MobileBottomNav() {
  const device = useDeviceDetect();
  const navigate = useNavigate();
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  if (!device.isPhone) return null;

  const isActive = (url: string) => {
    if (!url) return false;
    if (url === "/home") return location.pathname === "/home";
    return location.pathname.startsWith(url);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "rgba(13,13,13,0.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 -8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className="flex items-stretch" style={{ height: 60 }}>
        {TABS.map((tab) => {
          if (tab.title === "Create") {
            return (
              <Sheet key="create" open={createOpen} onOpenChange={setCreateOpen}>
                <SheetTrigger asChild>
                  <button className="flex-1 flex items-center justify-center min-h-[44px]">
                    <div
                      className="flex items-center justify-center rounded-2xl"
                      style={{
                        width: 44,
                        height: 36,
                        background: "hsl(var(--primary))",
                        boxShadow: "0 4px 14px hsla(var(--primary) / 0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                      }}
                    >
                      <Plus className="h-5 w-5" style={{ color: "#000" }} strokeWidth={2.5} />
                    </div>
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="rounded-t-[24px] border-0"
                  style={{
                    background: "#161616",
                    boxShadow: "0 -12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
                    paddingBottom: "env(safe-area-inset-bottom, 16px)",
                  }}
                >
                  <div className="pt-5 pb-4 space-y-1 px-2">
                    <p className="px-4 mb-3 text-[9px] font-semibold uppercase tracking-[0.2em]"
                       style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'DM Sans', sans-serif" }}>
                      Create
                    </p>
                    {CREATE_ACTIONS.map((action) => (
                      <button
                        key={action.url}
                        onClick={() => { navigate(action.url); setCreateOpen(false); }}
                        className="neu-card-sm flex items-center gap-3 w-full px-4 py-3.5 mb-2 min-h-[48px]"
                        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.8)" }}
                      >
                        <div className="neu-icon-circle" style={{ width: 36, height: 36, borderRadius: 10 }}>
                          <action.icon className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} strokeWidth={1.5} />
                        </div>
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
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    <tab.icon className="h-[20px] w-[20px]" strokeWidth={1.5} />
                    <span className="text-[9px] font-medium tracking-wider" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {tab.title}
                    </span>
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="rounded-t-[24px] border-0"
                  style={{
                    background: "#161616",
                    boxShadow: "0 -12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
                    paddingBottom: "env(safe-area-inset-bottom, 16px)",
                  }}
                >
                  <div className="pt-5 pb-4 space-y-1 px-2">
                    <p className="px-4 mb-3 text-[9px] font-semibold uppercase tracking-[0.2em]"
                       style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'DM Sans', sans-serif" }}>
                      Tools
                    </p>
                    {TOOL_ACTIONS.map((action) => (
                      <button
                        key={action.url}
                        onClick={() => { navigate(action.url); setToolsOpen(false); }}
                        className="neu-card-sm flex items-center gap-3 w-full px-4 py-3.5 mb-2 min-h-[48px]"
                        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.8)" }}
                      >
                        <div className="neu-icon-circle" style={{ width: 36, height: 36, borderRadius: 10 }}>
                          <action.icon className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} strokeWidth={1.5} />
                        </div>
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
              className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] transition-all duration-200"
              style={{ color: active ? "hsl(var(--primary))" : "rgba(255,255,255,0.3)" }}
            >
              <tab.icon className="h-[20px] w-[20px]" strokeWidth={1.5} />
              <span className="text-[9px] font-medium tracking-wider" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {tab.title}
              </span>
              {active && (
                <div
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ background: "hsl(var(--primary))", boxShadow: "0 0 6px hsla(var(--primary) / 0.5)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
