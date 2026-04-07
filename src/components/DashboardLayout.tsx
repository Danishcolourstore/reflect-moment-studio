import { ReactNode, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useViewMode } from "@/lib/ViewModeContext";
import {
  CalendarDays, Image, Scissors, Settings, CreditCard, LogOut, Menu, Plus,
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

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, signOut, studioName: authStudioName } = useAuth();
  const { isDesktop, isMobile } = useViewMode();
  const navigate = useNavigate();
  const location = useLocation();
  const drawer = useDrawerMenu();
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
  const displayName = profile?.studio_name || authStudioName || "Studio";

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
      <div className="min-h-screen" style={{ background: "hsl(45, 14%, 97%)" }}>
        {/* ── Mobile Top Bar ── */}
        {isMobile && (
          <header
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 40,
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px",
              background: "hsla(45, 14%, 97%, 0.9)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderBottom: "1px solid hsl(37, 10%, 92%)",
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
              <Menu style={{ width: 20, height: 20, color: "hsl(48, 7%, 10%)" }} strokeWidth={1.5} />
            </button>

            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 16, fontWeight: 400, letterSpacing: "0.04em",
              color: "hsl(48, 7%, 10%)",
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
            {/* Wordmark */}
            <div style={{ padding: "28px 20px 20px" }}>
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 18,
                  fontWeight: 400,
                  letterSpacing: "0.05em",
                  color: "hsl(48, 7%, 10%)",
                }}
              >
                MirrorAI
              </span>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {sectionLabel("STUDIO")}
              {STUDIO_ITEMS.map(navItem)}

              {sectionLabel("ACCOUNT")}
              {ACCOUNT_ITEMS.map(navItem)}
            </nav>

            {/* Sign Out */}
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
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "hsl(35, 4%, 56%)",
                  padding: "8px 0",
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
          className="min-h-screen"
          style={{
            marginLeft: showSidebar ? 200 : 0,
            paddingTop: isMobile ? 52 : 0,
            paddingBottom: showBottomNav ? 80 : 0,
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: isMobile ? "24px 16px" : "40px 40px",
            }}
          >
            {children}
          </div>
        </main>

        {showBottomNav && <MobileBottomNav />}
        <DrawerMenu open={drawer.open} onClose={drawer.close} />
      </div>
    </EntiranProvider>
  );
}
