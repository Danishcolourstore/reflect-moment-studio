import { ReactNode, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useViewMode } from "@/lib/ViewModeContext";
import {
  Home, Camera, Globe, BookOpen, Zap,
  Users, BarChart2, Settings, LogOut,
} from "lucide-react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { EntiranProvider } from "@/components/entiran/EntiranProvider";

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
    label: "ACCOUNT",
    items: [
      { title: "Settings", url: "/dashboard/profile", icon: Settings },
    ],
  },
];

interface Profile {
  studio_name: string;
  avatar_url: string | null;
  plan: string;
  email: string | null;
  onboarding_completed: boolean;
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { isDesktop, isMobile } = useViewMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);

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

  const showSidebar = isDesktop;
  const showBottomNav = isMobile;

  return (
    <EntiranProvider>
      <div className="min-h-screen" style={{ background: "#FDFCFB" }}>
        {/* ── Fixed Left Sidebar (Desktop Only) ── */}
        {showSidebar && (
          <aside className="fixed left-0 top-0 z-30 h-screen w-[88px] flex flex-col items-center bg-sidebar border-r border-sidebar-border">
            {/* Logo */}
            <div className="pt-8 pb-6">
              <span
                className="text-primary font-serif text-sm tracking-[0.15em]"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
              >
                M
              </span>
            </div>

            <div className="w-8 h-px bg-sidebar-border" />

            {/* Nav Icons */}
            <nav className="flex-1 flex flex-col items-center pt-6 gap-1 overflow-y-auto">
              {NAV_SECTIONS.map((section) =>
                section.items.map((item) => (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    end={item.end}
                    className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    activeClassName="!text-primary !bg-primary/10"
                  >
                    <item.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                    <span className="text-[9px] mt-1 tracking-wider uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                      {item.title}
                    </span>
                  </NavLink>
                ))
              )}
            </nav>

            <div className="w-8 h-px bg-sidebar-border" />

            {/* Sign Out */}
            <div className="pb-8 pt-4">
              <button
                onClick={handleSignOut}
                className="flex flex-col items-center justify-center w-14 h-14 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="h-[16px] w-[16px]" strokeWidth={1.5} />
              </button>
            </div>
          </aside>
        )}

        {/* ── Main Content (No Top Bar) ── */}
        <main
          className="min-h-screen pb-24 lg:pb-8"
          style={{ marginLeft: showSidebar ? 88 : 0 }}
        >
          <div className="mx-auto max-w-[1300px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
            {children}
          </div>
        </main>

        {showBottomNav && <MobileBottomNav />}
      </div>
    </EntiranProvider>
  );
}
