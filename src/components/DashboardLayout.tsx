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
      { title: "Events", url: "/dashboard/events", icon: Camera },
      { title: "Portfolio", url: "/dashboard/website-editor", icon: Globe },
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
  "/dashboard": "Home",
  "/dashboard/events": "Events",
  "/dashboard/website-editor": "Portfolio",
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

type ThemeMode = "dark" | "light" | "versace" | "classic" | "darkroom";
type AccentMode = "gold" | "red";

const THEME_ORDER: ThemeMode[] = ["dark", "light", "versace", "classic", "darkroom"];
const THEME_ICONS: Record<ThemeMode, string> = { dark: "🌙", light: "☀️", versace: "👑", classic: "🏛️", darkroom: "🎞️" };

function applyThemeClass(t: ThemeMode) {
  document.documentElement.classList.remove("dark", "editorial", "classic", "versace", "darkroom", "light");
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

function useIsLightTheme(theme: ThemeMode) {
  return theme === "light" || theme === "classic";
}

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
  const isLt = useIsLightTheme(theme);

  // Adaptive palette
  const pal = {
    bg: isLt ? "#FFFFFF" : "#080808",
    sidebarBg: isLt ? "#FFFFFF" : "#080808",
    sidebarBorder: isLt ? "rgba(0,0,0,0.08)" : "rgba(240,237,232,0.06)",
    brandColor: isLt ? "#D4AF37" : "#E8C97A",
    textPrimary: isLt ? "#1A1A1A" : "#F0EDE8",
    textMuted: isLt ? "rgba(0,0,0,0.45)" : "rgba(240,237,232,0.3)",
    textFaint: isLt ? "rgba(0,0,0,0.25)" : "rgba(240,237,232,0.2)",
    textSubtle: isLt ? "rgba(0,0,0,0.55)" : "rgba(240,237,232,0.5)",
    navActive: isLt ? "#D4AF37" : "#E8C97A",
    navActiveBg: isLt ? "rgba(212,175,55,0.08)" : "rgba(232,201,122,0.04)",
    headerBg: isLt ? "rgba(255,255,255,0.92)" : "rgba(8,8,8,0.9)",
    headerBorder: isLt ? "rgba(0,0,0,0.06)" : "rgba(240,237,232,0.05)",
    storageBg: isLt ? "rgba(0,0,0,0.04)" : "rgba(240,237,232,0.06)",
    accentDotBg: isLt ? "rgba(0,0,0,0.04)" : "rgba(240,237,232,0.04)",
    accentDotBorder: isLt ? "rgba(0,0,0,0.08)" : "rgba(240,237,232,0.06)",
    avatarBg: isLt ? "rgba(0,0,0,0.06)" : "rgba(240,237,232,0.06)",
    avatarText: isLt ? "rgba(0,0,0,0.5)" : "rgba(240,237,232,0.5)",
  };

  return (
    <EntiranProvider>
      <div className="min-h-screen" style={{ background: pal.bg, overflowY: "auto", overflowX: "hidden" }}>
        {/* ── Desktop Sidebar ── */}
        {showSidebar && (
          <aside
            className="fixed left-0 top-0 z-30 h-screen flex flex-col"
            style={{
              width: sidebarWidth,
              background: pal.sidebarBg,
              borderRight: `1px solid ${pal.sidebarBorder}`,
            }}
          >
            {/* Brand */}
            <div className="px-6 pt-8 pb-6">
              <h1
                style={{
                  fontFamily: cormorant,
                  fontSize: 18,
                  fontWeight: 500,
                  color: "#E8C97A",
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
                    color: "rgba(240,237,232,0.25)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {profile.studio_name}
                </p>
              )}
            </div>

            <div className="mx-5 h-px" style={{ background: "rgba(240,237,232,0.06)" }} />

            <nav className="flex-1 px-3 pt-5 space-y-4 overflow-y-auto">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="px-3 mb-1.5" style={{
                    fontFamily: dm, fontSize: 9, fontWeight: 600,
                    color: "rgba(240,237,232,0.2)", letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}>{section.label}</p>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      end={item.end}
                      className="flex items-center gap-2.5 px-3 py-2 transition-colors"
                      style={{ fontFamily: dm, fontSize: 13, borderLeft: "2px solid transparent" }}
                      activeClassName="text-[#E8C97A] !border-l-[#E8C97A] bg-[rgba(232,201,122,0.04)]"
                    >
                      {({ isActive }: { isActive: boolean }) => (
                        <>
                          <item.icon
                            className="h-[15px] w-[15px]"
                            style={{ color: isActive ? "#E8C97A" : "rgba(240,237,232,0.3)" }}
                          />
                          <span style={{ color: isActive ? "#E8C97A" : "rgba(240,237,232,0.3)" }}>{item.title}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>

            <div className="mx-5 h-px" style={{ background: "rgba(240,237,232,0.06)" }} />

            {/* Storage */}
            <div className="px-6 py-4">
              <p
                style={{
                  fontFamily: dm,
                  fontSize: 9,
                  color: "rgba(240,237,232,0.2)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Storage
              </p>
              <p style={{ fontFamily: dm, fontSize: 10, color: "rgba(240,237,232,0.35)" }}>
                {formatBytes(storageUsed)}{" "}
                <span style={{ color: "rgba(240,237,232,0.15)" }}>/ {formatBytes(storageLimit)}</span>
              </p>
              <div className="mt-2 h-px w-full overflow-hidden" style={{ background: "rgba(240,237,232,0.06)" }}>
                <div className="h-full transition-all" style={{ width: `${storagePct}%`, background: "#E8C97A" }} />
              </div>
            </div>

            {/* Sign out */}
            <div className="px-3 pb-6">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-sm transition-colors"
                style={{ fontFamily: dm, fontSize: 13, color: "rgba(240,237,232,0.2)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F0EDE8")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,237,232,0.2)")}
              >
                <LogOut className="h-[15px] w-[15px]" />
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
            background: "rgba(8,8,8,0.9)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(240,237,232,0.05)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {!showSidebar && location.pathname !== "/dashboard" && location.pathname !== "/home" && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center transition-colors"
                style={{ color: "rgba(240,237,232,0.3)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F0EDE8")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,237,232,0.3)")}
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
                color: "rgba(240,237,232,0.7)",
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all"
              style={{
                background: "rgba(240,237,232,0.04)",
                border: "1px solid rgba(240,237,232,0.06)",
              }}
              title={`Accent: ${accent}`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background: accent === "gold" ? "#E8C97A" : "#C0392B",
                  boxShadow: accent === "gold" ? "0 0 6px rgba(232,201,122,0.5)" : "0 0 6px rgba(192,57,43,0.5)",
                }}
              />
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => {
                const idx = THEME_ORDER.indexOf(theme);
                switchTheme(THEME_ORDER[(idx + 1) % THEME_ORDER.length]);
              }}
              className="flex items-center justify-center transition-colors"
              style={{ fontSize: 14, minWidth: 32, minHeight: 32 }}
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
                      style={{
                        background: "rgba(240,237,232,0.06)",
                        fontFamily: dm,
                        fontSize: 10,
                        color: "rgba(240,237,232,0.5)",
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
        <main className="pt-12 pb-24 lg:pb-8" style={{ marginLeft: showSidebar ? sidebarWidth : 0 }}>
          <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>

        {showBottomNav && <MobileBottomNav />}
      </div>
    </EntiranProvider>
  );
}
