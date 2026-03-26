import { useNavigate } from "react-router-dom";
import {
  Camera, Image, Palette, BookOpen, Zap, PenTool,
  Users, BarChart3, Globe, Settings, User, CreditCard,
  ChevronRight,
} from "lucide-react";
import { BusinessDashboard } from "@/components/business/BusinessDashboard";
import { BusinessInsights, Lead, Booking } from "@/hooks/use-business-suite";

interface HomeDashboardHubProps {
  insights: BusinessInsights;
  leads: Lead[];
  bookings: Booking[];
}

const SECTIONS = [
  {
    label: "Studio",
    items: [
      { title: "Events", icon: Camera, url: "/dashboard/events", desc: "Manage galleries" },
      { title: "Portfolio", icon: Image, url: "/dashboard/portfolio", desc: "Public website" },
      { title: "Branding", icon: Palette, url: "/dashboard/branding", desc: "Brand studio" },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "Storybook", icon: BookOpen, url: "/dashboard/storybook", desc: "Albums & stories" },
      { title: "Cheetah", icon: Zap, url: "/dashboard/cheetah-live", desc: "AI culling" },
      { title: "Retouch", icon: PenTool, url: "/colour-store", desc: "Photo editing" },
    ],
  },
  {
    label: "Business",
    items: [
      { title: "Clients", icon: Users, url: "/dashboard/clients", desc: "CRM & leads" },
      { title: "Analytics", icon: BarChart3, url: "/dashboard/analytics", desc: "Performance" },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Settings", icon: Settings, url: "/dashboard/studio-settings", desc: "Preferences" },
      { title: "Profile", icon: User, url: "/dashboard/profile", desc: "Your profile" },
      { title: "Billing", icon: CreditCard, url: "/dashboard/billing", desc: "Plans & usage" },
    ],
  },
];

export function HomeDashboardHub({ insights, leads, bookings }: HomeDashboardHubProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Business Metrics */}
      <BusinessDashboard
        insights={insights}
        leads={leads}
        bookings={bookings}
        onTabChange={() => navigate("/dashboard/business")}
      />

      {/* Feature Hub */}
      <div className="space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mb-2.5 px-1">
              {section.label}
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {section.items.map((item) => (
                <button
                  key={item.url}
                  onClick={() => navigate(item.url)}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-secondary/50 active:bg-secondary group"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 shrink-0">
                    <item.icon className="h-[18px] w-[18px] text-primary" strokeWidth={1.6} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
