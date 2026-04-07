import { Home, Camera, Globe, BookOpen, Zap, Users, BarChart3, Settings, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";

const navItems = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Events", url: "/dashboard/events", icon: Camera },
  { title: "Website", url: "/dashboard/website-builder", icon: Globe },
  { title: "Storybook", url: "/dashboard/storybook", icon: BookOpen },
  { title: "Cheetah", url: "/dashboard/cheetah-live", icon: Zap },
  { title: "Clients", url: "/dashboard/clients", icon: Users },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Settings", url: "/dashboard/profile", icon: Settings },
];

export function AppSidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[88px] flex-col items-center bg-sidebar border-r border-sidebar-border lg:flex">
      <div className="pt-8 pb-6">
        <span className="text-primary font-serif text-sm tracking-[0.15em]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          M
        </span>
      </div>

      <div className="w-8 h-px bg-sidebar-border" />

      <nav className="flex-1 flex flex-col items-center pt-6 gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end
            className="group flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all text-muted-foreground hover:text-foreground hover:bg-secondary"
            activeClassName="!text-primary !bg-primary/10"
          >
            <item.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
            <span className="text-[9px] mt-1 tracking-wider uppercase opacity-60">
              {item.title}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="w-8 h-px bg-sidebar-border" />
      <div className="pb-8 pt-4">
        <button
          onClick={signOut}
          className="flex flex-col items-center justify-center w-14 h-14 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-[16px] w-[16px]" strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  );
}
