import { ReactNode, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useViewMode } from "@/lib/ViewModeContext";
import { CalendarDays, Image, Scissors, Settings, CreditCard, LogOut, Menu } from "lucide-react";
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

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  const sectionLabel = (text: string) => (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 10,
        fontWeight: 300,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "var(--ink-whisper)",
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
      activeClassName="!border-l-[#B8953F] !text-[var(--ink)]"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11,
        fontWeight: 300,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        textDecoration: "none",
        borderLeft: "1px solid transparent",
        color: "var(--ink-muted)",
      }}
    >
      <item.icon size={15} strokeWidth={1.5} />
      <span>{item.title}</span>
    </NavLink>
  );

  return (
    <EntiranProvider>
      <div
        style={{
          background: isImmersiveMobile ? "#0a0a0b" : "var(--paper, #FAFAF8)",
          minHeight: "100vh",
          margin: 0,
          padding: 0,
          overflowX: "hidden",
        }}
      >
        {/* Mobile Top Bar */}
        {isMobile && (
          <header
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 50,
              height: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              paddingTop: "env(safe-area-inset-top)",
              background: isImmersiveMobile
                ? (scrolled ? "rgba(10,10,11,0.88)" : "transparent")
                : (scrolled ? "rgba(250,250,248,0.92)" : "rgba(250,250,248,0.9)"),
              backdropFilter: scrolled ? "blur(16px)" : "none",
              WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
              borderBottom: isImmersiveMobile ? "none" : (scrolled ? "1px solid var(--rule)" : "none"),
              transition: "background 0.4s ease",
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
              <Menu size={22} strokeWidth={1.5} style={{ color: "var(--ink)" }} />
            </button>

            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 18,
                fontWeight: 300,
                fontStyle: "italic",
                color: "var(--ink)",
              }}
            >
              Mirror
            </span>

            <div style={{ width: 44 }} />
          </header>
        )}

        {/* Sidebar (Desktop) */}
        {isDesktop && (
          <aside
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              zIndex: 30,
              height: "100vh",
              width: 200,
              background: "var(--surface)",
              borderRight: "1px solid var(--rule)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "28px 20px 20px" }}>
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 20,
                  fontWeight: 300,
                  fontStyle: "italic",
                  color: "var(--ink)",
                }}
              >
                Mirror
              </span>
            </div>
            <nav style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {sectionLabel("Studio")}
              {STUDIO_ITEMS.map(navItem)}
              {sectionLabel("Account")}
              {ACCOUNT_ITEMS.map(navItem)}
            </nav>
            <div style={{ padding: "16px 20px 24px" }}>
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
                  fontWeight: 300,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--ink-muted)",
                  padding: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-muted)")}
              >
                <LogOut size={14} strokeWidth={1.5} />
                Sign Out
              </button>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main
          style={{
            minHeight: isImmersiveMobile ? "100dvh" : "100vh",
            marginLeft: isDesktop ? 200 : 0,
            paddingTop: isImmersiveMobile ? 0 : (isMobile ? 52 : 0),
            paddingBottom: isMobile ? (isImmersiveMobile ? 0 : 80) : 0,
          }}
        >
          {isImmersiveMobile ? children : (
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

        {isMobile && <MobileBottomNav />}
        <DrawerMenu open={drawer.open} onClose={drawer.close} />
      </div>
    </EntiranProvider>
  );
}
