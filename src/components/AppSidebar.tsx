import { CalendarDays, BookOpen, BarChart3, Settings, CreditCard, LogOut, Home, Globe, Zap, Users, Palette } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";

const navItems = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Events", url: "/dashboard/events", icon: CalendarDays },
  { title: "Portfolio", url: "/dashboard/website-editor", icon: Globe },
  { title: "Storybook", url: "/dashboard/storybook", icon: BookOpen },
  { title: "Cheetah", url: "/dashboard/cheetah-live", icon: Zap },
  { title: "Retouch", url: "/colour-store", icon: Palette },
  { title: "Clients", url: "/dashboard/clients", icon: Users },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Settings", url: "/dashboard/profile", icon: Settings },
  { title: "Billing", url: "/dashboard/billing", icon: CreditCard },
];

export function AppSidebar() {
  const { studioName, signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[220px] flex-col bg-sidebar text-sidebar-foreground lg:flex border-r border-sidebar-border">
      <div className="px-6 pt-8 pb-6">
        <h1 className="font-serif text-[22px] font-semibold text-primary tracking-tight leading-none">MirrorAI</h1>
        <p className="mt-1.5 text-[9px] text-sidebar-foreground/30 tracking-[0.12em] uppercase truncate font-medium">
          {studioName}
        </p>
      </div>

      <div className="mx-5 h-px bg-sidebar-border" />

      <nav className="flex-1 px-3 pt-5 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end
            className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground rounded-sm"
            activeClassName="text-sidebar-foreground bg-sidebar-accent"
          >
            <item.icon className="h-[15px] w-[15px]" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mx-5 h-px bg-sidebar-border" />
      <div className="px-3 pb-6 pt-3">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-sidebar-foreground/30 transition-colors hover:text-sidebar-foreground rounded-sm"
        >
          <LogOut className="h-[15px] w-[15px]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
