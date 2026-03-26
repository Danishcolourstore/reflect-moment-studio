import { useNavigate } from "react-router-dom";
import {
  Camera, Image, Palette, BookOpen, Zap, PenTool,
  Users, BarChart3, Settings, User, CreditCard, Plus,
} from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { BusinessInsights, Lead, Booking } from "@/hooks/use-business-suite";

interface HomeDashboardHubProps {
  insights: BusinessInsights;
  leads: Lead[];
  bookings: Booking[];
}

const FEATURES = [
  {
    title: "Events",
    icon: Camera,
    url: "/dashboard/events",
    desc: "Manage galleries",
    meta: "Photo delivery",
    gradient: "from-amber-900/40 to-stone-900/60",
  },
  {
    title: "Portfolio",
    icon: Image,
    url: "/dashboard/website-editor",
    desc: "Public website",
    meta: "Brand presence",
    gradient: "from-stone-800/50 to-neutral-900/60",
  },
  {
    title: "Branding",
    icon: Palette,
    url: "/dashboard/branding",
    desc: "Brand studio",
    meta: "Visual identity",
    gradient: "from-rose-900/30 to-stone-900/60",
  },
  {
    title: "Storybook",
    icon: BookOpen,
    url: "/dashboard/storybook",
    desc: "Albums & stories",
    meta: "Print design",
    gradient: "from-indigo-900/30 to-stone-900/60",
  },
  {
    title: "Cheetah",
    icon: Zap,
    url: "/dashboard/cheetah-live",
    desc: "AI culling",
    meta: "Smart selection",
    gradient: "from-emerald-900/30 to-stone-900/60",
  },
  {
    title: "Retouch",
    icon: PenTool,
    url: "/colour-store",
    desc: "Photo editing",
    meta: "Color grading",
    gradient: "from-violet-900/30 to-stone-900/60",
  },
  {
    title: "Clients",
    icon: Users,
    url: "/dashboard/clients",
    desc: "CRM & leads",
    meta: "Relationships",
    gradient: "from-sky-900/30 to-stone-900/60",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    url: "/dashboard/analytics",
    desc: "Performance",
    meta: "Business insights",
    gradient: "from-orange-900/30 to-stone-900/60",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/dashboard/settings",
    desc: "Preferences",
    meta: "Configuration",
    gradient: "from-zinc-800/40 to-stone-900/60",
  },
  {
    title: "Profile",
    icon: User,
    url: "/dashboard/profile",
    desc: "Your profile",
    meta: "Account",
    gradient: "from-teal-900/30 to-stone-900/60",
  },
];

export function HomeDashboardHub({ insights, leads, bookings }: HomeDashboardHubProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            Dashboard
          </p>
          <h1 className="text-2xl sm:text-[32px] font-light tracking-wide text-foreground" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            Your Studio
          </h1>
        </div>
        <Button
          size="sm"
          onClick={() => navigate("/dashboard/events")}
          className="h-10 px-4 gap-1.5 rounded-lg"
        >
          <Plus className="h-4 w-4" />
          <span className="text-xs font-medium">New Event</span>
        </Button>
      </div>

      {/* 2-Column Card Grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5">
        {FEATURES.map((item) => (
          <button
            key={item.url}
            onClick={() => navigate(item.url)}
            className="group text-left rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
          >
            {/* Square image area */}
            <AspectRatio ratio={1}>
              <div className={`h-full w-full bg-gradient-to-br ${item.gradient} flex items-center justify-center transition-all group-hover:opacity-90`}>
                <item.icon
                  className="h-8 w-8 sm:h-10 sm:w-10 text-foreground/50 group-hover:text-primary/80 transition-colors"
                  strokeWidth={1.2}
                />
              </div>
            </AspectRatio>

            {/* Text content */}
            <div className="p-3 sm:p-4 space-y-0.5">
              <h3 className="text-sm sm:text-base font-semibold text-foreground leading-tight" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                {item.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
                {item.desc}
              </p>
              <p className="text-[10px] text-muted-foreground/50 pt-0.5" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                {item.meta}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
