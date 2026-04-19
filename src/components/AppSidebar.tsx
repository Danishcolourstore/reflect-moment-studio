import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";

/**
 * AppSidebar — Pixieset-Minimal.
 * 200px fixed. Text-only. No icons. Active row gets --wash-strong + ink + 500.
 */

const STUDIO_ITEMS = [
  { title: "Events", url: "/dashboard/events" },
  { title: "Gallery", url: "/home", end: true },
  { title: "Cull", url: "/dashboard/cheetah-live" },
];

const ACCOUNT_ITEMS = [
  { title: "Settings", url: "/dashboard/profile" },
  { title: "Billing", url: "/dashboard/billing" },
];

export function AppSidebar() {
  const { signOut } = useAuth();

  const sectionLabel = (text: string) => (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--ink-whisper)",
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
        width: 200,
        background: "var(--surface)",
        borderRight: "1px solid var(--rule)",
        display: "none",
        flexDirection: "column",
      }}
      className="lg:!flex"
    >
      <div style={{ padding: "24px 24px 20px" }}>
        <span
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: "0",
            color: "var(--ink)",
          }}
        >
          Mirror
        </span>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {sectionLabel("Studio")}
        {STUDIO_ITEMS.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.end}
            className="transition-colors duration-150"
            activeClassName="!bg-[var(--wash-strong)] !text-[var(--ink)] !font-medium"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 400,
              padding: "10px 24px",
              color: "var(--ink-muted)",
              textDecoration: "none",
              display: "block",
            }}
          >
            {item.title}
          </NavLink>
        ))}

        {sectionLabel("Account")}
        {ACCOUNT_ITEMS.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className="transition-colors duration-150"
            activeClassName="!bg-[var(--wash-strong)] !text-[var(--ink)] !font-medium"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 400,
              padding: "10px 24px",
              color: "var(--ink-muted)",
              textDecoration: "none",
              display: "block",
            }}
          >
            {item.title}
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
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 400,
            color: "var(--ink-muted)",
            padding: 0,
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
