import { ReactNode, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useViewMode } from "@/lib/ViewModeContext";
import { CalendarDays, Image, Scissors, Settings, CreditCard, LogOut, Menu, LayoutDashboard } from "lucide-react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { EntiranProvider } from "@/components/entiran/EntiranProvider";

const STUDIO_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "Events", url: "/dashboard/events", icon: CalendarDays },
  { title: "Gallery", url: "/home", icon: Image, end: true },
  { title: "Cull", url: "/dashboard/cheetah-live", icon: Scissors },
];

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
  const [scrolled, setScrolled] = useState(false);

  const isImmersiveMobile = isMobile && immersive;

  useEffect(() => {
    if (!isMobile) return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile]);

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

  const isActive = (url: string, end?: boolean) => {
    if (end) return location.pathname === url;
    return location.pathname.startsWith(url);
  };

  const sectionLabel = (text: string) => (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "#A8A29E",
        padding: "0 20px",
        marginTop: 32,
        marginBottom: 4,
      }}
    >
      {text}
    </div>
  );

  const navItem = (item: (typeof STUDIO_ITEMS)[0]) => {
    const active = isActive(item.url, item.end);
    return (
      <button
        key={item.url}
        onClick={() => navigate(item.url)}
        style={{
          background: active ? "rgba(200,169,126,0.08)" : "transparent",
          border: "none",
          borderLeft: active ? "3px solid #C8A97E" : "3px solid transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "11px 20px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          fontWeight: active ? 500 : 400,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: active ? "#C8A97E" : "#44403C",
          transition: "all 0.2s ease",
          textAlign: "left",
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = "rgba(200,169,126,0.06)";
            e.currentTarget.style.color = "#1C1917";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#44403C";
          }
        }}
      >
        <item.icon size={17} strokeWidth={1.5} style={{ color: active ? "#C8A97E" : "inherit", flexShrink: 0 }} />
        <span>{item.title}</span>
      </button>
    );
  };

  return (
    <EntiranProvider>
      <div
        style={{
          background: isImmersiveMobile ? "#0a0a0b" : "#FDFCFB",
          minHeight: "100vh",
          margin: 0,
          padding: 0,
          overflowX: "hidden",
        }}
      >
        {isMobile && (
          <header
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 50,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              background: isImmersiveMobile
                ? scrolled
                  ? "rgba(10,10,11,0.88)"
                  : "transparent"
                : scrolled
                  ? "rgba(253,252,251,0.95)"
                  : "#FDFCFB",
              backdropFilter: scrolled ? "blur(16px)" : "none",
              WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
              borderBottom: isImmersiveMobile ? "none" : "1px solid #E7E5E4",
              transition: "background 0.3s ease",
            }}
          >
            <button
              onClick={drawer.toggle}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 44,
                minHeight: 44,
              }}
              aria-label="Menu"
            >
              <Menu size={22} strokeWidth={1.5} style={{ color: isImmersiveMobile ? "#FDFCFB" : "#1C1917" }} />
            </button>

            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: isImmersiveMobile ? "#FDFCFB" : "#1C1917",
              }}
            >
              MirrorAI
            </span>

            <div style={{ width: 44, minHeight: 44 }} />
          </header>
        )}

        {isDesktop && (
          <aside
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              zIndex: 30,
              height: "100vh",
              width: 240,
              background: "#FFFFFF",
              borderRight: "1px solid #E7E5E4",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "32px 20px 24px",
                borderBottom: "1px solid #E7E5E4",
              }}
            >
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#1C1917",
                }}
              >
                MirrorAI
              </span>
              {profile?.studio_name && (
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    color: "#A8A29E",
                    margin: "6px 0 0 0",
                    letterSpacing: "0.04em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {profile.studio_name}
                </p>
              )}
            </div>

            <nav style={{ flex: 1, paddingTop: 8, overflowY: "auto" }}>
              {sectionLabel("Studio")}
              {STUDIO_ITEMS.map(navItem)}
              {sectionLabel("Account")}
              {ACCOUNT_ITEMS.map(navItem)}
            </nav>

            <div
              style={{
                padding: "16px 20px 28px",
                borderTop: "1px solid #E7E5E4",
              }}
            >
              <button
                onClick={handleSignOut}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#A8A29E",
                  padding: "8px 0",
                  transition: "color 0.2s ease",
                  width: "100%",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1C1917")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#A8A29E")}
              >
                <LogOut size={15} strokeWidth={1.5} />
                Sign Out
              </button>
            </div>
          </aside>
        )}

        <main
          style={{
            minHeight: "100vh",
            marginLeft: isDesktop ? 240 : 0,
            paddingTop: isMobile && !isImmersiveMobile ? 56 : 0,
            paddingBottom: isMobile ? 80 : 0,
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
