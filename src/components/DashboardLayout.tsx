import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useViewMode } from "@/lib/ViewModeContext";
import { CalendarDays, Image, Scissors, Settings, CreditCard, LogOut, Menu, LayoutDashboard } from "lucide-react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { EntiranProvider } from "@/components/entiran/EntiranProvider";

const SIDEBAR_WIDTH = 240;
const HEADER_HEIGHT = 56;
const BOTTOM_NAV_HEIGHT = 80;

const NAV_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "Events", url: "/dashboard/events", icon: CalendarDays },
  { title: "Gallery", url: "/dashboard/gallery", icon: Image },
  { title: "Cheetah", url: "/dashboard/cull", icon: Scissors },
];

const ACCOUNT_ITEMS = [
  { title: "Settings", url: "/dashboard/profile", icon: Settings },
  { title: "Billing", url: "/dashboard/billing", icon: CreditCard },
];

interface Profile {
  studio_name: string;
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
  const [scrolled, setScrolled] = useState(false);

  const isImmersiveMobile = isMobile && immersive;

  // SCROLL STATE (lightweight)
  useEffect(() => {
    if (!isMobile) return;

    const onScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  // PROFILE (fetch once)
  useEffect(() => {
    if (!user) return;

    (supabase.from("profiles").select("studio_name") as any)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) setProfile(data);
      });
  }, [user]);

  const isActive = (url: string, end?: boolean) => {
    if (end) return location.pathname === url;
    return location.pathname.startsWith(url);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const renderNavItem = (item: (typeof NAV_ITEMS)[0]) => {
    const active = isActive(item.url, item.end);

    return (
      <button
        key={item.url}
        onClick={() => navigate(item.url)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "12px 20px",
          background: active ? "rgba(200,169,126,0.08)" : "transparent",
          border: "none",
          borderLeft: active ? "3px solid #C8A97E" : "3px solid transparent",
          cursor: "pointer",
          fontSize: 12,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: active ? "#C8A97E" : "#44403C",
          textAlign: "left",
        }}
      >
        <item.icon size={16} />
        {item.title}
      </button>
    );
  };

  return (
    <EntiranProvider>
      <div
        style={{
          background: isImmersiveMobile ? "#0a0a0b" : "#FDFCFB",
          minHeight: "100vh",
        }}
      >
        {/* MOBILE HEADER */}
        {isMobile && (
          <header
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              height: HEADER_HEIGHT,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px",
              background: scrolled ? "#FDFCFB" : "transparent",
              borderBottom: scrolled ? "1px solid #E7E5E4" : "none",
            }}
          >
            <button onClick={drawer.toggle}>
              <Menu size={22} />
            </button>

            <span style={{ fontSize: 16, fontWeight: 600 }}>MirrorAI</span>

            <div style={{ width: 32 }} />
          </header>
        )}

        {/* DESKTOP SIDEBAR */}
        {isDesktop && (
          <aside
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              width: SIDEBAR_WIDTH,
              height: "100vh",
              background: "#fff",
              borderRight: "1px solid #E7E5E4",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "24px 20px" }}>
              <div style={{ fontWeight: 600 }}>MirrorAI</div>
              {profile?.studio_name && <div style={{ fontSize: 12, color: "#A8A29E" }}>{profile.studio_name}</div>}
            </div>

            <nav style={{ flex: 1 }}>
              {NAV_ITEMS.map(renderNavItem)}
              {ACCOUNT_ITEMS.map(renderNavItem)}
            </nav>

            <div style={{ padding: 16 }}>
              <button onClick={handleSignOut}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </aside>
        )}

        {/* MAIN */}
        <main
          style={{
            marginLeft: isDesktop ? SIDEBAR_WIDTH : 0,
            paddingTop: isMobile ? HEADER_HEIGHT : 0,
            paddingBottom: isMobile ? BOTTOM_NAV_HEIGHT : 0,
          }}
        >
          {children}
        </main>

        {isMobile && <MobileBottomNav />}
        <DrawerMenu open={drawer.open} onClose={drawer.close} />
      </div>
    </EntiranProvider>
  );
}
