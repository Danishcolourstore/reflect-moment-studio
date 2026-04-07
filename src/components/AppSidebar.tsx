import { CalendarDays, Image, Scissors, Settings, CreditCard, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";

const STUDIO_ITEMS = [
  { title: "Events", url: "/dashboard/events", icon: CalendarDays },
  { title: "Gallery", url: "/home", icon: Image, end: true },
  { title: "Cull", url: "/dashboard/cheetah-live", icon: Scissors },
];

const ACCOUNT_ITEMS = [
  { title: "Settings", url: "/dashboard/profile", icon: Settings },
  { title: "Billing", url: "/dashboard/billing", icon: CreditCard },
];

export function AppSidebar() {
  const { signOut } = useAuth();

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

  return (
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
        display: "none",
        flexDirection: "column",
      }}
      className="lg:!flex"
    >
      <div style={{ padding: "32px 24px 24px" }}>
        <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 400, letterSpacing: "0.05em", color: "#1A1917" }}>
          MirrorAI
        </span>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {sectionLabel("STUDIO")}
        {STUDIO_ITEMS.map((item) => (
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
        ))}

        {sectionLabel("ACCOUNT")}
        {ACCOUNT_ITEMS.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
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
        ))}
      </nav>

      <div style={{ padding: "16px 24px 24px" }}>
        <button
          onClick={signOut}
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
          }}
        >
          <LogOut size={16} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
