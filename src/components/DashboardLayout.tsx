import { ReactNode, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useViewMode } from "@/lib/ViewModeContext";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { ScrollChromeProvider } from "@/lib/ScrollChromeContext";
import { Settings, CreditCard, LogOut } from "lucide-react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { EntiranProvider } from "@/components/entiran/EntiranProvider";
import { STUDIO_NAV_ITEMS } from "@/components/studio/Sidebar";
import { cn } from "@/lib/utils";

const STUDIO_ITEMS = STUDIO_NAV_ITEMS.map((item) => ({
  title: item.title,
  url: item.url,
  icon: item.icon,
  ...(item.end ? { end: true } : {}),
}));

const ACCOUNT_ITEMS = [
  { title: "Settings", url: "/dashboard/profile", icon: Settings },
  { title: "Billing", url: "/dashboard/billing", icon: CreditCard },
];

interface Profile {
  studio_name: string;
  avatar_url: string | null;
  plan: string;
  email: string | null;
  onboarding_completed: boolean;
}

interface DashboardLayoutProps {
  children: ReactNode;
  immersive?: boolean;
}

export function DashboardLayout({ children, immersive = false }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const { isDesktop, isMobile } = useViewMode();
  const navigate = useNavigate();
  const location = useLocation();
  const drawer = useDrawerMenu();
  const [profile, setProfile] = useState<Profile | null>(null);

  const isImmersiveMobile = isMobile && immersive;
  const scrollChrome = useScrollDirection(isMobile && !isImmersiveMobile);
  const headerHidden = scrollChrome.headerState === "hidden";
  const atTop = scrollChrome.scrollY < 16;

  useEffect(() => {
    if (!user) return;
    (supabase.from("profiles").select("studio_name, avatar_url, plan, email, onboarding_completed") as any)
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <EntiranProvider>
      <ScrollChromeProvider value={{ headerState: scrollChrome.headerState, navState: scrollChrome.navState }}>
        <div
          className={cn(
            "min-h-screen overflow-x-hidden",
            isImmersiveMobile ? "bg-[#0a0a0b]" : "bg-paper",
          )}
        >
          {/* ── Mobile top bar ── */}
          {isMobile && !isImmersiveMobile && (
            <header
              className={cn(
                "sticky top-0 z-50 flex h-12 items-center justify-center px-4 safe-area-pt",
                "transition-[transform,background-color,border-color,backdrop-filter] duration-200 ease-out",
                "will-change-transform",
                headerHidden ? "-translate-y-full" : "translate-y-0",
                !atTop && !headerHidden
                  ? "border-b border-rule bg-paper/92 backdrop-blur-xl"
                  : "bg-paper",
              )}
            >
              <span className="font-serif text-lg text-ink">
                Mirror
              </span>
            </header>
          )}

          {/* ── Desktop sidebar ── */}
          {isDesktop && (
            <aside className="fixed inset-y-0 left-0 z-30 flex w-[220px] flex-col border-r border-rule bg-surface">
              <div className="px-6 pb-4 pt-7">
                <span className="font-serif text-xl text-ink">
                  Mirror
                </span>
              </div>

              <nav className="flex flex-1 flex-col overflow-y-auto">
                <SectionLabel>Studio</SectionLabel>
                {STUDIO_ITEMS.map((item) => (
                  <SidebarNavItem key={item.url} item={item} />
                ))}
                <SectionLabel className="mt-8">Account</SectionLabel>
                {ACCOUNT_ITEMS.map((item) => (
                  <SidebarNavItem key={item.url} item={item} />
                ))}
              </nav>

              <div className="border-t border-rule px-6 py-4">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
                >
                  <LogOut size={14} strokeWidth={1.5} />
                  Sign out
                </button>
              </div>
            </aside>
          )}

          {/* ── Main content ── */}
          <main
            className={cn(
              "min-h-screen",
              isDesktop && "ml-[220px]",
              !isImmersiveMobile && isMobile && "pb-24",
            )}
          >
            {isImmersiveMobile ? children : (
              <div className={cn(
                "mx-auto max-w-[1200px]",
                isMobile ? "px-4 pb-6 pt-4" : "px-10 py-10",
              )}>
                {children}
              </div>
            )}
          </main>

          {isMobile && <MobileBottomNav />}
          <FloatingActionButton />
          {!isMobile && <DrawerMenu open={drawer.open} onClose={drawer.close} />}
        </div>
      </ScrollChromeProvider>
    </EntiranProvider>
  );
}

/* ── Subcomponents ── */

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn(
      "px-6 pb-2 pt-6 text-2xs font-medium tracking-wide text-ink-tertiary",
      className,
    )}>
      {children}
    </p>
  );
}

function SidebarNavItem({ item }: { item: typeof STUDIO_ITEMS[0] }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.url}
      end={item.end}
      className={cn(
        "mx-3 flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-normal text-ink-muted",
        "transition-colors duration-fast",
        "hover:bg-wash hover:text-ink",
      )}
      activeClassName="!bg-wash-strong !text-ink font-medium"
    >
      <Icon size={16} strokeWidth={1.5} />
      <span>{item.title}</span>
    </NavLink>
  );
}
