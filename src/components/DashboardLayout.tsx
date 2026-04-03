import { ReactNode, useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useViewMode } from "@/lib/ViewModeContext";
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
  Smartphone,
  Monitor,
  RotateCw,
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
      { title: "Retouch", url: "/colour-store", icon: Palette },
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
    label: "ACCOUNT",
    items: [
      { title: "Settings", url: "/dashboard/settings", icon: Compass },
      { title: "Profile", url: "/dashboard/profile", icon: User },
      { title: "Billing", url: "/dashboard/billing", icon: BarChart2 },
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
  "/dashboard/storybook": "Storybook",
  "/dashboard/album-designer": "Storybook · Albums",
  "/dashboard/cheetah-live": "Cheetah",
  "/dashboard/clients": "Clients",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
  "/dashboard/domains": "Settings · Domains",
  "/dashboard/branding": "Branding",
  "/dashboard/profile": "Profile",
  "/dashboard/billing": "Billing",
  "/dashboard/notifications": "Notifications",
  "/dashboard/onboarding": "Welcome",
  "/colour-store": "Retouch",
};

function BotNavTab() {
  const { openBot } = useEntiranOpen();
  return (
    <button
      onClick={openBot}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-h-[44px]"
      style={{ color: "#AAAAAA" }}
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
  const { viewMode, isDesktop, isMobile, setViewMode, cycleViewMode } = useViewMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const storage = useStorageUsage();

  useEffect(() => {
    if (!user) return;
    (
      supabase
        .from("profiles")
        .select(
          "studio_name, avatar_url, plan, email, onboarding_completed",
        ) as any
    )
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setProfile(data);
          if (!data.onboarding_completed && !location.pathname.includes("/onboarding")) {
            navigate("/dashboard/onboarding", { replace: true });
          }
        }
      });
  }, [user, location.pathname, navigate]);

  const initials = profile?.studio_name?.slice(0, 2).toUpperCase() || "MA";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const storageUsed = storage.data?.used ?? 0;
  const storageLimit = storage.data?.limit ?? PLAN_LIMITS.free;
  const storagePct = Math.min((storageUsed / storageLimit) * 100, 100);

  const showSidebar = isDesktop;
  const showBottomNav = isMobile;
  const sidebarWidth = 200;

  const pageTitle = PAGE_TITLES[location.pathname] || "MirrorAI";

  // White editorial palette
  const pal = {
    bg: "#FFFFFF",
    sidebarBg: "#FFFFFF",
    sidebarBorder: "rgba(0,0,0,0.06)",
    brandColor: "#C9A96E",
    textPrimary: "#1A1A1A",
    textMuted: "rgba(0,0,0,0.4)",
    textFaint: "rgba(0,0,0,0.2)",
    textSubtle: "rgba(0,0,0,0.55)",
    navActive: "#C9A96E",
    navActiveBg: "rgba(201,169,110,0.08)",
    headerBg: "rgba(255,255,255,0.96)",
    headerBorder: "rgba(0,0,0,0.06)",
    storageBg: "rgba(0,0,0,0.04)",
    accentDotBg: "rgba(0,0,0,0.03)",
    accentDotBorder: "rgba(0,0,0,0.06)",
    avatarBg: "rgba(0,0,0,0.05)",
    avatarText: "rgba(0,0,0,0.4)",
  };

  const ViewModeIcon = viewMode === 'desktop' ? Monitor : viewMode === 'mobile' ? Smartphone : RotateCw;
  const viewModeLabel = viewMode === 'desktop' ? 'Desktop' : viewMode === 'mobile' ? 'Mobile' : 'Auto';

  return (
    <EntiranProvider>
      <div
        className="min-h-screen transition-all duration-300"
        style={{
          background: pal.bg,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
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
            <div className="px-6 pt-8 pb-6">
              <h1
                style={{
                  fontFamily: cormorant,
                  fontSize: 18,
                  fontWeight: 500,
                  color: pal.brandColor,
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
                    color: pal.textFaint,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {profile.studio_name}
                </p>
              )}
            </div>

            <div className="mx-5 h-px" style={{ background: pal.sidebarBorder }} />

            <nav className="flex-1 px-3 pt-5 space-y-4 overflow-y-auto">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="px-3 mb-1.5" style={{
                    fontFamily: dm, fontSize: 9, fontWeight: 600,
                    color: pal.textFaint, letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}>{section.label}</p>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      end={item.end}
                      className="flex items-center gap-2.5 px-3 py-2 transition-colors"
                      style={{ fontFamily: dm, fontSize: 13, borderLeft: "2px solid transparent" }}
                      activeClassName="nav-active-highlight"
                    >
                      {({ isActive }: { isActive: boolean }) => (
                        <>
                          <item.icon
                            className="h-[15px] w-[15px]"
                            style={{ color: isActive ? pal.navActive : pal.textMuted }}
                          />
                          <span style={{ color: isActive ? pal.navActive : pal.textMuted }}>{item.title}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>

            <div className="mx-5 h-px" style={{ background: pal.sidebarBorder }} />

            <div className="px-6 py-4">
              <p
                style={{
                  fontFamily: dm,
                  fontSize: 9,
                  color: pal.textFaint,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Storage
              </p>
              <p style={{ fontFamily: dm, fontSize: 10, color: pal.textMuted }}>
                {formatBytes(storageUsed)}{" "}
                <span style={{ color: pal.textFaint }}>/ {formatBytes(storageLimit)}</span>
              </p>
              <div className="mt-2 h-px w-full overflow-hidden" style={{ background: pal.storageBg }}>
                <div className="h-full transition-all" style={{ width: `${storagePct}%`, background: pal.brandColor }} />
              </div>
            </div>

            <div className="px-3 pb-6">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-sm transition-colors"
                style={{ fontFamily: dm, fontSize: 13, color: pal.textFaint }}
                onMouseEnter={(e) => (e.currentTarget.style.color = pal.textPrimary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = pal.textFaint)}
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
            height: showBottomNav ? 52 : 48,
            padding: showBottomNav ? "0 16px" : "0 20px",
            background: pal.headerBg,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: `1px solid ${pal.headerBorder}`,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {showBottomNav && location.pathname === "/home" ? (
              <h2
                style={{
                  fontFamily: cormorant,
                  fontSize: 17,
                  fontWeight: 500,
                  color: pal.brandColor,
                  letterSpacing: "0.12em",
                }}
              >
                MirrorAI
              </h2>
            ) : (
              <>
                {!showSidebar && location.pathname !== "/dashboard" && location.pathname !== "/home" && (
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center transition-colors min-w-[32px] min-h-[32px]"
                    style={{ color: pal.textMuted }}
                  >
                    <ChevronRight className="h-5 w-5 rotate-180" />
                  </button>
                )}
                <h2
                  className="truncate"
                  style={{
                    fontFamily: cormorant,
                    fontSize: showBottomNav ? 15 : 16,
                    fontWeight: 400,
                    color: pal.textSubtle,
                    letterSpacing: "0.08em",
                  }}
                >
                  {pageTitle}
                </h2>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View mode toggle */}
            <button
              onClick={cycleViewMode}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all"
              style={{
                minHeight: 32,
                background: pal.accentDotBg,
                border: `1px solid ${pal.accentDotBorder}`,
                fontFamily: dm,
                fontSize: 10,
                color: pal.textMuted,
                fontWeight: 500,
              }}
              title={`View: ${viewModeLabel}`}
            >
              <ViewModeIcon className="h-3.5 w-3.5" style={{ color: pal.textMuted }} />
              <span className="hidden sm:inline">{viewModeLabel}</span>
            </button>

            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback
                      style={{
                        background: pal.avatarBg,
                        fontFamily: dm,
                        fontSize: 10,
                        color: pal.avatarText,
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
        <main className="pt-[52px] pb-24 lg:pb-8" style={{ marginLeft: showSidebar ? sidebarWidth : 0 }}>
          <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>

        {showBottomNav && <MobileBottomNav />}

      </div>
    </EntiranProvider>
  );
}
