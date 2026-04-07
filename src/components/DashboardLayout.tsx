import { ReactNode, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useViewMode } from "@/lib/ViewModeContext";
import {
  CalendarDays, Image, Scissors, Settings, CreditCard, LogOut, Menu,
} from "lucide-react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { EntiranProvider } from "@/components/entiran/EntiranProvider";

const STUDIO_ITEMS = [
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
  /** When true on mobile, header becomes a transparent overlay and content goes edge-to-edge */
  immersive?: boolean;
}

export function DashboardLayout({ children, immersive = false }: DashboardLayoutProps) {
  const { user, signOut, studioName: authStudioName } = useAuth();
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

  const showSidebar = isDesktop;
  const showBottomNav = isMobile;

  const sectionLabel = (text: string) => (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 10,
        fontWeight: 400,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "hsl(35, 4%, 56%)",
        padding: "0 20px",
        marginTop: 40,
        marginBottom: 8,
      }}
    >
      {text}
    </div>
  );

  const navItem = (item: typeof STUDIO_ITEMS[0]) => (
    <NavLink
      key={item.url}
      to={item.url}
      end={item.end}
      className="flex items-center gap-3 transition-colors duration-200"
      activeClassName="!border-l-2"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        textDecoration: "none",
        borderLeft: "2px solid transparent",
        color: "hsl(35, 4%, 56%)",
      }}
    >
      <item.icon size={17} strokeWidth={1.5} />
      <span>{item.title}</span>
    </NavLink>
  );

  return (
    <EntiranProvider>
      <div
        className="min-h-screen"
        style={{
          background: isImmersiveMobile ? "#0a0a0b" : "hsl(45, 14%, 97%)",
          margin: 0,
          padding: 0,
          overflowX: "hidden",
        }}
      >
        {/* ── Mobile Top Bar ── */}
        {isMobile && (
          <header
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 50,
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              paddingTop: "env(safe-area-inset-top)",
              background: isImmersiveMobile
                ? (scrolled ? "rgba(10,10,11,0.88)" : "transparent")
                : (scrolled ? "hsla(45, 14%, 97%, 0.92)" : "hsla(45, 14%, 97%, 0.9)"),
              backdropFilter: scrolled ? "blur(16px)" : "none",
              WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
              borderBottom: isImmersiveMobile
                ? "none"
                : (scrolled ? "1px solid hsl(37, 10%, 92%)" : "none"),
              transition: "background 0.4s ease, backdrop-filter 0.4s ease",
            }}
          >
            <button
              onClick={drawer.toggle}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 8, display: "flex", alignItems: "center", justifyContent: "center",
                minWidth: 44, minHeight: 44,
              }}
              aria-label="Menu"
            >
              <Menu style={{
                width: 20, height: 20,
                color: isImmersiveMobile ? "rgba(255,255,255,0.8)" : "hsl(48, 7%, 10%)",
              }} strokeWidth={1.5} />
            </button>

            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.1rem", fontWeight: 400, fontStyle: "italic",
              letterSpacing: "0.04em",
              color: isImmersiveMobile ? "#C8A97E" : "hsl(48, 7%, 10%)",
            }}>
              MirrorAI
            </span>

            <div style={{ width: 44, minHeight: 44 }} />
          </header>
        )}

        {/* ── Sidebar (Desktop) ── */}
        {showSidebar && (
          <aside
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              zIndex: 30,
              height: "100vh",
              width: 200,
              background: "hsl(0, 0%, 100%)",
              borderRight: "1px solid hsl(37, 10%, 92%)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "28px 20px 20px" }}>
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 18, fontWeight: 400, letterSpacing: "0.05em",
                  color: "hsl(48, 7%, 10%)",
                }}
              >
                MirrorAI
              </span>
            </div>
            <nav style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {sectionLabel("STUDIO")}
              {STUDIO_ITEMS.map(navItem)}
              {sectionLabel("ACCOUNT")}
              {ACCOUNT_ITEMS.map(navItem)}
            </nav>
            <div style={{ padding: "16px 20px 24px" }}>
              <button
                onClick={handleSignOut}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "hsl(35, 4%, 56%)", padding: "8px 0",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(48, 7%, 10%)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(35, 4%, 56%)")}
              >
                <LogOut size={15} strokeWidth={1.5} />
                Sign Out
              </button>
            </div>
          </aside>
        )}

        {/* ── Main Content ── */}
        <main
          style={{
            minHeight: isImmersiveMobile ? "100dvh" : "100vh",
            marginLeft: showSidebar ? 200 : 0,
            paddingTop: isImmersiveMobile ? 0 : (isMobile ? 52 : 0),
            paddingBottom: showBottomNav ? (isImmersiveMobile ? 0 : 80) : 0,
          }}
        >
          {isImmersiveMobile ? (
            children
          ) : (
            <div
              style={{
                maxWidth: 1200,
                margin: "0 auto",
                padding: isMobile ? "24px 16px" : "40px 40px",
              }}
            >
              {children}
            </div>
          )}
        </main>

        {showBottomNav && <MobileBottomNav />}
        <DrawerMenu open={drawer.open} onClose={drawer.close} />
      </div>
    </EntiranProvider>
  );
}
