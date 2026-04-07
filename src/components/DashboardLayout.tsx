import { ReactNode, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useViewMode } from "@/lib/ViewModeContext";
import {
  CalendarDays, Image, Scissors, Settings, CreditCard, LogOut,
} from "lucide-react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { EntiranProvider } from "@/components/entiran/EntiranProvider";

const STUDIO_ITEMS = [
  { title: "Events", url: "/dashboard/events", icon: CalendarDays },
  { title: "Galleries", url: "/home", icon: Image, end: true },
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

  const sectionLabel = (text: string) => (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 10,
        fontWeight: 400,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "#C4C1BB",
        padding: "0 24px",
        marginTop: 32,
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
      className="flex items-center gap-3 transition-colors duration-200 text-[#94918B] hover:text-[#1A1917]"
      activeClassName="!text-[#1A1917] !border-l-2 !border-l-[#B8953F]"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        textDecoration: "none",
        borderLeft: "2px solid transparent",
      }}
    >
      <item.icon size={18} strokeWidth={1.5} />
      <span>{item.title}</span>
    </NavLink>
  );

  return (
    <EntiranProvider>
      <div className="min-h-screen" style={{ background: "#FAFAF8" }}>
        {/* ── Sidebar (Desktop) ── */}
        {showSidebar && (
          <aside
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              zIndex: 30,
              height: "100vh",
              width: 240,
              background: "#FFFFFF",
              borderRight: "1px solid #E8E6E1",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Wordmark */}
            <div style={{ padding: "32px 24px 24px" }}>
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 20,
                  fontWeight: 400,
                  letterSpacing: "0.05em",
                  color: "#1A1917",
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
            <div style={{ padding: "16px 24px 24px" }}>
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
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#94918B",
                  padding: "8px 0",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1A1917")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94918B")}
              >
                <LogOut size={16} strokeWidth={1.5} />
                Sign Out
              </button>
            </div>
          </aside>
        )}

        {/* ── Main Content ── */}
        <main
          className="min-h-screen"
          style={{
            marginLeft: showSidebar ? 240 : 0,
            paddingBottom: showBottomNav ? 88 : 0,
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: isMobile ? "32px 24px" : "40px 48px",
            }}
          >
            {children}
          </div>
        </main>

        {showBottomNav && <MobileBottomNav />}
      </div>
    </EntiranProvider>
  );
}
