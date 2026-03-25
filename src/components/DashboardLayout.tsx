import { ReactNode, useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceDetect } from "@/hooks/use-device-detect";
import {
  LayoutGrid,
  Camera,
  BookOpen,
  Zap,
  Users,
  BarChart2,
  Palette,
  User,
  LogOut,
  Bell,
  ChevronRight,
  Menu,
  Globe,
  Compass,
  Bot,
  Home,
} from "lucide-react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { EntiranProvider, useEntiranOpen } from "@/components/entiran/EntiranProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/NotificationBell";
import { useStorageUsage, formatBytes, PLAN_LIMITS } from "@/hooks/use-storage-usage";

const NAV_SECTIONS = [
  {
    label: "STUDIO",
    items: [
      { title: "Home", url: "/home", icon: Home, end: true },
      { title: "Overview", url: "/dashboard", icon: LayoutGrid, end: true },
      { title: "Events", url: "/dashboard/events", icon: Camera },
      { title: "Studio Feed", url: "/dashboard/website-editor", icon: Globe },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { title: "Storybook", url: "/dashboard/storybook", icon: BookOpen },
      { title: "Cheetah", url: "/dashboard/cheetah-live", icon: Zap },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      { title: "Clients", url: "/dashboard/clients", icon: Users },
      { title: "Analytics", url: "/dashboard/analytics", icon: BarChart2 },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { title: "Domains", url: "/dashboard/domains", icon: Globe },
      { title: "Profile", url: "/dashboard/profile", icon: User },
      { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
    ],
  },
];

const NAV_ITEMS = NAV_SECTIONS.flatMap(s => s.items);

interface Profile {
  studio_name: string;
  avatar_url: string | null;
  plan: string;
  email: string | null;
  onboarding_completed: boolean;
}

function useDomainNudge(userId: string | undefined) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!userId) return;
    (supabase.from("domains").select("id, custom_domain").eq("user_id", userId) as any).then(({ data }: any) => {
      const hasCustom = (data || []).some((d: any) => !!d.custom_domain);
      setShow(!hasCustom);
    });
  }, [userId]);
  return show;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/events": "Events",
  "/dashboard/website-editor": "Studio Feed",
  "/dashboard/domains": "Domains",
  "/dashboard/storybook": "Storybook",
  "/dashboard/album-designer": "Albums",
  "/dashboard/cheetah-live": "Cheetah",
  "/dashboard/clients": "Clients",
  "/dashboard/analytics": "Analytics",
  "/dashboard/notifications": "Notifications",
  "/dashboard/branding": "Branding",
  "/dashboard/profile": "Profile",
  "/dashboard/onboarding": "Welcome",
};

type ThemeMode = "dark" | "versace" | "classic" | "darkroom";
type AccentMode = "gold" | "red";

const THEME_ORDER: ThemeMode[] = ["dark", "versace", "classic", "darkroom"];
const THEME_ICONS: Record<ThemeMode, string> = { dark: "🌙", versace: "👑", classic: "☀️", darkroom: "🎞️" };

function applyThemeClass(t: ThemeMode) {
  document.documentElement.classList.remove("dark", "editorial", "classic", "versace", "darkroom");
  if (t !== "dark") document.documentElement.classList.add(t);
  localStorage.setItem("theme", t);
}

function applyAccentClass(a: AccentMode) {
  if (a === "red") {
    document.documentElement.classList.add("accent-red");
  } else {
    document.documentElement.classList.remove("accent-red");
  }
  localStorage.setItem("accent", a);
}

function BotNavTab() {
  const { openBot } = useEntiranOpen();
  return (
    <button
      onClick={openBot}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-h-[44px]"
      style={{ color: "rgba(255,255,255,0.45)" }}
    >
      <Bot className="h-[22px] w-[22px]" strokeWidth={1.6} />
      <span className="text-[10px] font-medium tracking-wide">Bot</span>
    </button>
  );
}

const cormorant = '"Cormorant Garamond", serif';
const dm = '"DM Sans", sans-serif';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const device = useDeviceDetect();
  const showDomainNudge = useDomainNudge(user?.id);
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme") || "dark";
    const t: ThemeMode = THEME_ORDER.includes(saved as ThemeMode) ? (saved as ThemeMode) : "dark";
    applyThemeClass(t);
    return t;
  });
  const [accent, setAccent] = useState<AccentMode>(() => {
    const saved = localStorage.getItem("accent") || "gold";
    const a: AccentMode = saved === "red" ? "red" : "gold";
    applyAccentClass(a);
    return a;
  });
  const [moreOpen, setMoreOpen] = useState(false);
  const storage = useStorageUsage();

  useEffect(() => {
    if (!user) return;
    (
      supabase
        .from("profiles")
        .select(
          "studio_name, avatar_url, plan, email, onboarding_completed, theme_preference, accent_preference",
        ) as any
    )
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setProfile(data);
          const dbTheme: ThemeMode = THEME_ORDER.includes(data.theme_preference as ThemeMode)
            ? (data.theme_preference as ThemeMode)
            : "dark";
          applyThemeClass(dbTheme);
          setTheme(dbTheme);
          const dbAccent: AccentMode = data.accent_preference === "red" ? "red" : "gold";
          applyAccentClass(dbAccent);
          setAccent(dbAccent);
          if (!data.onboarding_completed && !location.pathname.includes("/onboarding")) {
            navigate("/dashboard/onboarding", { replace: true });
          }
        }
      });
  }, [user, location.pathname, navigate]);

  const switchTheme = useCallback(
    (next: ThemeMode) => {
      if (next === theme) return;
      applyThemeClass(next);
      setTheme(next);
      if (user) {
        (supabase.from("profiles").update({ theme_preference: next } as any) as any)
          .eq("user_id", user.id)
          .then(() => {});
      }
    },
    [theme, user],
  );

  const switchAccent = useCallback(
    (next: AccentMode) => {
      if (next === accent) return;
      applyAccentClass(next);
      setAccent(next);
      if (user) {
        (supabase.from("profiles").update({ accent_preference: next } as any) as any)
          .eq("user_id", user.id)
          .then(() => {});
      }
    },
    [accent, user],
  );

  const initials = profile?.studio_name?.slice(0, 2).toUpperCase() || "MA";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const storageUsed = storage.data?.used ?? 0;
  const storageLimit = storage.data?.limit ?? PLAN_LIMITS.free;
  const storagePct = Math.min((storageUsed / storageLimit) * 100, 100);

  const showSidebar = device.isDesktop || device.isTablet;
  const showBottomNav = device.isPhone;
  const sidebarWidth = 200;

  const pageTitle = PAGE_TITLES[location.pathname] || "MirrorAI";

  return (
    <EntiranProvider>
      <div className="min-h-screen" style={{ background: "#080808", overflowY: "auto", overflowX: "hidden" }}>
        {/* ── Desktop Sidebar ── */}
        {showSidebar && (
          <aside
            className="fixed left-0 top-0 z-30 h-screen flex flex-col"
            style={{
              width: sidebarWidth,
              background: "#0D0D0D",
              borderRight: "none",
              boxShadow: "4px 0 20px rgba(0,0,0,0.5)",
            }}
          >
            {/* Brand */}
            <div className="px-6 pt-8 pb-6">
              <h1
                style={{
                  fontFamily: cormorant,
                  fontSize: 18,
                  fontWeight: 500,
                  color: "hsl(var(--primary))",
                  letterSpacing: "0.15em",
                }}
              >
                MirrorAI
              </h1>
              {profile?.studio_name && (
                <p
                  className="mt-1.5 truncate"
                  style={{
                    fontFamily: dm,
                    fontSize: 9,
                    color: "rgba(255,255,255,0.2)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {profile.studio_name}
                </p>
              )}
            </div>

            <nav className="flex-1 px-4 pt-3 space-y-5 overflow-y-auto">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="px-3 mb-2" style={{
                    fontFamily: dm, fontSize: 9, fontWeight: 600,
                    color: "rgba(255,255,255,0.15)", letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}>{section.label}</p>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      end={item.end}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all mb-0.5"
                      style={{ fontFamily: dm, fontSize: 13, border: "none" }}
                      activeClassName="neu-card-sm !bg-[hsl(0,0%,13%)]"
                    >
                      {({ isActive }: { isActive: boolean }) => (
                        <>
                          <item.icon
                            className="h-[15px] w-[15px]"
                            strokeWidth={1.5}
                            style={{ color: isActive ? "hsl(var(--primary))" : "rgba(255,255,255,0.25)" }}
                          />
                          <span style={{ color: isActive ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }}>{item.title}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>

            {/* Storage */}
            <div className="px-5 py-4">
              <div className="neu-inset p-3">
                <p style={{ fontFamily: dm, fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
                  Storage
                </p>
                <p style={{ fontFamily: dm, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                  {formatBytes(storageUsed)}{" "}
                  <span style={{ color: "rgba(255,255,255,0.12)" }}>/ {formatBytes(storageLimit)}</span>
                </p>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${storagePct}%`, background: "hsl(var(--primary))" }} />
                </div>
              </div>
            </div>

            {/* Sign out */}
            <div className="px-4 pb-6">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors"
                style={{ fontFamily: dm, fontSize: 13, color: "rgba(255,255,255,0.2)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
              >
                <LogOut className="h-[15px] w-[15px]" strokeWidth={1.5} />
                <span>Sign out</span>
              </button>
            </div>
          </aside>
        )}

        {/* ── Top Header ── */}
        <header
          className="fixed top-0 right-0 z-20 flex items-center justify-between"
          style={{
            left: showSidebar ? sidebarWidth : 0,
            height: 48,
            padding: "0 20px",
            background: "rgba(13,13,13,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {!showSidebar && location.pathname !== "/dashboard" && location.pathname !== "/home" && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center transition-colors"
                style={{ color: "rgba(255,255,255,0.3)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >
                <ChevronRight className="h-5 w-5 rotate-180" />
              </button>
            )}
            <h2
              className="truncate"
              style={{
                fontFamily: cormorant,
                fontSize: 16,
                fontWeight: 400,
                color: "rgba(255,255,255,0.65)",
                letterSpacing: "0.08em",
              }}
            >
              {pageTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Accent toggle */}
            <button
              onClick={() => switchAccent(accent === "gold" ? "red" : "gold")}
              className="neu-card-sm flex items-center gap-1.5 px-2.5 py-1.5"
              title={`Accent: ${accent}`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background: accent === "gold" ? "hsl(var(--primary))" : "#C0392B",
                  boxShadow: accent === "gold" ? "0 0 8px hsla(var(--primary) / 0.5)" : "0 0 8px rgba(192,57,43,0.5)",
                }}
              />
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => {
                const idx = THEME_ORDER.indexOf(theme);
                switchTheme(THEME_ORDER[(idx + 1) % THEME_ORDER.length]);
              }}
              className="neu-card-sm flex items-center justify-center transition-colors"
              style={{ fontSize: 14, minWidth: 34, minHeight: 34 }}
              title={`Theme: ${theme}`}
            >
              {THEME_ICONS[theme]}
            </button>

            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback
                      className="neu-card-sm"
                      style={{
                        fontFamily: dm,
                        fontSize: 10,
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="pt-12 pb-24 lg:pb-8" style={{ marginLeft: showSidebar ? sidebarWidth : 0, background: "#0D0D0D" }}>
          <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>

        {showBottomNav && <MobileBottomNav />}
      </div>
    </EntiranProvider>
  );
}
