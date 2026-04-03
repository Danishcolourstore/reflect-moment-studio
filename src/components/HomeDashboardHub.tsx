import { useNavigate } from "react-router-dom";
import {
  Camera, Image, Palette, BookOpen, Zap, PenTool,
  Users, BarChart3, Settings, User, CreditCard, Plus, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessInsights, Lead, Booking } from "@/hooks/use-business-suite";
import { useViewMode } from "@/lib/ViewModeContext";

import { colors, fonts, fragments } from "@/styles/design-tokens";

interface HomeDashboardHubProps {
  insights: BusinessInsights;
  leads: Lead[];
  bookings: Booking[];
}

const QUICK_ACTIONS = [
  { title: "Events", icon: Camera, url: "/dashboard/events", desc: "Manage galleries & delivery" },
  { title: "Portfolio", icon: Image, url: "/dashboard/website-editor", desc: "Public website & brand" },
  { title: "Storybook", icon: BookOpen, url: "/dashboard/storybook", desc: "Albums & print design" },
  { title: "Cheetah", icon: Zap, url: "/dashboard/cheetah-live", desc: "AI-powered culling" },
  { title: "Retouch", icon: PenTool, url: "/colour-store", desc: "Color grading & editing" },
  { title: "Clients", icon: Users, url: "/dashboard/clients", desc: "CRM & relationships" },
];

const SECONDARY = [
  { title: "Analytics", icon: BarChart3, url: "/dashboard/analytics" },
  { title: "Branding", icon: Palette, url: "/dashboard/branding" },
  { title: "Settings", icon: Settings, url: "/dashboard/settings" },
  { title: "Profile", icon: User, url: "/dashboard/profile" },
];

export function HomeDashboardHub({ insights, leads, bookings }: HomeDashboardHubProps) {
  const navigate = useNavigate();
  
  const { isDesktop: isDesktopView } = useViewMode();

  // ── Desktop / Landscape layout ──
  if (isDesktopView) {
    return (
      <div style={{ fontFamily: fonts.body }}>
        <div className="flex items-end justify-between mb-10">
          <div>
            <p style={{ ...fragments.label, marginBottom: 8 }}>DASHBOARD</p>
            <h1 style={{ fontFamily: fonts.display, fontSize: 36, fontWeight: 300, color: colors.text, letterSpacing: "0.04em" }}>
              Your Studio
            </h1>
          </div>
          <Button
            onClick={() => navigate("/dashboard/events")}
            className="h-11 px-5 gap-2 rounded-xl"
            style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600 }}
          >
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: "Gallery Views", value: (insights.totalBookings + insights.totalLeads).toString() },
            { label: "Active Leads", value: leads.length.toString() },
            { label: "Bookings", value: bookings.length.toString() },
            { label: "Conversion", value: `${insights.conversionRate || 0}%` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-xl"
              style={{ background: "#FFFFFF", border: "1px solid #EEEEEE", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}
            >
              <p style={{ ...fragments.label, fontSize: 9, marginBottom: 10 }}>{stat.label}</p>
              <p style={{ fontFamily: fonts.display, fontSize: 28, fontWeight: 300, color: colors.gold, letterSpacing: "0.02em" }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5 mb-8">
          {QUICK_ACTIONS.map((item) => (
            <button
              key={item.url}
              onClick={() => navigate(item.url)}
              className="group text-left p-6 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: "#FFFFFF",
                border: "1px solid #EEEEEE",
                boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(201,169,110,0.3)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(201,169,110,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#EEEEEE";
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.03)";
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{ width: 44, height: 44, background: "rgba(201,169,110,0.08)" }}
                >
                  <item.icon className="h-5 w-5" style={{ color: colors.gold }} strokeWidth={1.5} />
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: "#999999" }} />
              </div>
              <h3 style={{ fontFamily: fonts.display, fontSize: 18, fontWeight: 500, color: colors.text, marginBottom: 4 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 12, color: "#666666", lineHeight: 1.5 }}>{item.desc}</p>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {SECONDARY.map((item) => (
            <button
              key={item.url}
              onClick={() => navigate(item.url)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all hover:opacity-80"
              style={{ background: "#F8F8F8", border: "1px solid #EEEEEE", fontSize: 12, color: "#666666" }}
            >
              <item.icon className="h-3.5 w-3.5" style={{ color: "#999999" }} strokeWidth={1.5} />
              {item.title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Mobile (Portrait) layout ──
  return (
    <div style={{ fontFamily: fonts.body }}>
      <div className="mb-6">
        <p style={{ ...fragments.label, fontSize: 9, marginBottom: 6 }}>DASHBOARD</p>
        <div className="flex items-center justify-between">
          <h1 style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 300, color: colors.text, letterSpacing: "0.04em" }}>
            Your Studio
          </h1>
          <button
            onClick={() => navigate("/dashboard/events")}
            className="flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36, background: colors.gold }}
          >
            <Plus className="h-4 w-4" style={{ color: "#FFFFFF" }} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
        {[
          { label: "Activity", value: (insights.totalBookings + insights.totalLeads).toString() },
          { label: "Leads", value: leads.length.toString() },
          { label: "Bookings", value: bookings.length.toString() },
          { label: "Conv.", value: `${insights.conversionRate || 0}%` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex-shrink-0 px-4 py-3 rounded-lg"
            style={{ background: "#FFFFFF", border: "1px solid #EEEEEE", boxShadow: "0 1px 4px rgba(0,0,0,0.03)", minWidth: 80 }}
          >
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#999999", marginBottom: 4 }}>
              {stat.label}
            </p>
            <p style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 300, color: colors.gold }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2 mb-6">
        {QUICK_ACTIONS.map((item) => (
          <button
            key={item.url}
            onClick={() => navigate(item.url)}
            className="flex items-center gap-4 w-full px-4 py-4 rounded-xl transition-all active:scale-[0.98]"
            style={{ background: "#FFFFFF", border: "1px solid #EEEEEE", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}
          >
            <div
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ width: 40, height: 40, background: "rgba(201,169,110,0.08)" }}
            >
              <item.icon className="h-[18px] w-[18px]" style={{ color: colors.gold }} strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <h3 style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 500, color: colors.text }}>{item.title}</h3>
              <p className="truncate" style={{ fontSize: 11, color: "#666666", marginTop: 1 }}>{item.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: "#CCCCCC" }} />
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {SECONDARY.map((item) => (
          <button
            key={item.url}
            onClick={() => navigate(item.url)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all active:scale-[0.97]"
            style={{ background: "#F8F8F8", border: "1px solid #EEEEEE", fontSize: 11, color: "#666666" }}
          >
            <item.icon className="h-3 w-3" style={{ color: "#999999" }} strokeWidth={1.5} />
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}
