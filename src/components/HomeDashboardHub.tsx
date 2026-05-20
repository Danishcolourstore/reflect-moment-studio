import { useNavigate } from "react-router-dom";
import { Camera, Globe, BookOpen, Zap, Users, ArrowRight, Plus } from "lucide-react";
import { BusinessInsights, Lead, Booking } from "@/hooks/use-business-suite";
import { useViewMode } from "@/lib/ViewModeContext";

interface HomeDashboardHubProps {
  insights: BusinessInsights;
  leads: Lead[];
  bookings: Booking[];
}

const QUICK_ACTIONS = [
  { title: "Events", icon: Camera, url: "/dashboard/events", desc: "Your galleries" },
  { title: "Website", icon: Globe, url: "/dashboard/website-builder", desc: "Your presence" },
  { title: "Storybook", icon: BookOpen, url: "/dashboard/storybook", desc: "Album design" },
  { title: "Cheetah", icon: Zap, url: "/dashboard/cheetah-live", desc: "Smart culling" },
  { title: "Clients", icon: Users, url: "/dashboard/clients", desc: "Relationships" },
];

export function HomeDashboardHub({ insights, leads, bookings }: HomeDashboardHubProps) {
  const navigate = useNavigate();
  const { isDesktop } = useViewMode();

  const stats = [
    { label: "Views", value: (insights.totalBookings + insights.totalLeads).toString() },
    { label: "Leads", value: leads.length.toString() },
    { label: "Bookings", value: bookings.length.toString() },
  ];

  if (isDesktop) {
    return (
      <div>
        <div className="flex items-end justify-between mb-12">
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 300, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 8 }}>
              Studio
            </p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 300, fontStyle: "italic", color: "var(--ink)", margin: 0 }}>
              Welcome back
            </h1>
          </div>
          <button
            onClick={() => navigate("/dashboard/events")}
            style={{
              border: "1px solid rgba(17,17,17,0.2)",
              background: "transparent",
              color: "#111111",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 300,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "8px 20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Plus size={14} />
            New Event
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 48 }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ padding: 24, border: "1px solid var(--rule)", background: "var(--surface)" }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 300, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 12 }}>
                {stat.label}
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 44, fontWeight: 300, fontStyle: "italic", color: "var(--ink)", margin: 0, lineHeight: 1 }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {QUICK_ACTIONS.map((item) => (
            <button
              key={item.url}
              onClick={() => navigate(item.url)}
              style={{
                textAlign: "left",
                padding: 24,
                border: "1px solid var(--rule)",
                background: "var(--surface)",
                cursor: "pointer",
                transition: "border-color 200ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#B8953F")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--rule)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <item.icon size={18} strokeWidth={1.5} style={{ color: "var(--ink)" }} />
                <ArrowRight size={14} style={{ color: "var(--ink-muted)" }} />
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 300, fontStyle: "italic", color: "var(--ink)", margin: "0 0 4px" }}>
                {item.title}
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 300, color: "var(--ink-muted)", margin: 0 }}>
                {item.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 300, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 4 }}>
            Studio
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 300, fontStyle: "italic", color: "var(--ink)", margin: 0 }}>
            Welcome back
          </h1>
        </div>
        <button
          onClick={() => navigate("/dashboard/events")}
          style={{
            width: 36,
            height: 36,
            border: "1px solid rgba(17,17,17,0.2)",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Plus size={16} strokeWidth={1.75} style={{ color: "var(--ink)" }} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ flexShrink: 0, padding: "12px 16px", border: "1px solid var(--rule)", background: "var(--surface)", minWidth: 80 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 300, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 4 }}>
              {stat.label}
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 300, fontStyle: "italic", color: "var(--ink)", margin: 0 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {QUICK_ACTIONS.map((item) => (
          <button
            key={item.url}
            onClick={() => navigate(item.url)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              width: "100%",
              padding: "16px",
              border: "1px solid var(--rule)",
              background: "var(--surface)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <item.icon size={18} strokeWidth={1.5} style={{ color: "var(--ink)", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 300, fontStyle: "italic", color: "var(--ink)", margin: 0 }}>
                {item.title}
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 300, color: "var(--ink-muted)", margin: 0 }}>
                {item.desc}
              </p>
            </div>
            <ArrowRight size={14} style={{ color: "var(--ink-muted)", flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
}
