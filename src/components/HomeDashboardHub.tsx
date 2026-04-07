import { useNavigate } from "react-router-dom";
import {
  Camera, Globe, BookOpen, Zap, Users, ArrowRight, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessInsights, Lead, Booking } from "@/hooks/use-business-suite";
import { useViewMode } from "@/lib/ViewModeContext";

interface HomeDashboardHubProps {
  insights: BusinessInsights;
  leads: Lead[];
  bookings: Booking[];
}

const QUICK_ACTIONS = [
  { title: "Events", icon: Camera, url: "/dashboard/events", desc: "Manage galleries" },
  { title: "Website", icon: Globe, url: "/dashboard/website-builder", desc: "Your website" },
  { title: "Storybook", icon: BookOpen, url: "/dashboard/storybook", desc: "Album design" },
  { title: "Cheetah", icon: Zap, url: "/dashboard/cheetah-live", desc: "AI culling" },
  { title: "Clients", icon: Users, url: "/dashboard/clients", desc: "CRM" },
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
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-2">DASHBOARD</p>
            <h1 className="font-serif text-4xl text-foreground tracking-wide" style={{ fontWeight: 300 }}>
              Your Studio
            </h1>
          </div>
          <Button onClick={() => navigate("/dashboard/events")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {stats.map((stat) => (
            <div key={stat.label} className="p-6 rounded-xl bg-card border border-border">
              <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">{stat.label}</p>
              <p className="font-serif text-3xl text-primary" style={{ fontWeight: 300 }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
          {QUICK_ACTIONS.map((item) => (
            <button
              key={item.url}
              onClick={() => navigate(item.url)}
              className="group text-left p-6 rounded-xl bg-card border border-border transition-all duration-200 hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(212,175,55,0.06)]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <item.icon className="h-[18px] w-[18px] text-primary" strokeWidth={1.5} />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-serif text-lg text-foreground mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Mobile ──
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-1">DASHBOARD</p>
          <h1 className="font-serif text-2xl text-foreground" style={{ fontWeight: 300 }}>Your Studio</h1>
        </div>
        <button
          onClick={() => navigate("/dashboard/events")}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-primary"
        >
          <Plus className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex gap-3 mb-6 overflow-x-auto pb-1 -mx-5 px-5" style={{ scrollbarWidth: "none" }}>
        {stats.map((stat) => (
          <div key={stat.label} className="flex-shrink-0 px-4 py-3 rounded-lg bg-card border border-border min-w-[80px]">
            <p className="text-[9px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-1">{stat.label}</p>
            <p className="font-serif text-xl text-primary" style={{ fontWeight: 300 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {QUICK_ACTIONS.map((item) => (
          <button
            key={item.url}
            onClick={() => navigate(item.url)}
            className="flex items-center gap-4 w-full px-4 py-4 rounded-xl bg-card border border-border transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0">
              <item.icon className="h-[18px] w-[18px] text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <h3 className="font-serif text-[15px] text-foreground">{item.title}</h3>
              <p className="text-[11px] text-muted-foreground truncate">{item.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
