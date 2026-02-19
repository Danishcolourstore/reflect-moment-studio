import { LayoutDashboard, CalendarDays, Upload, BarChart3, Settings, CreditCard, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/lib/auth';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Events', url: '/events', icon: CalendarDays },
  { title: 'Upload', url: '/upload', icon: Upload },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Studio Settings', url: '/settings', icon: Settings },
  { title: 'Plan & Billing', url: '/billing', icon: CreditCard },
];

export function AppSidebar() {
  const { studioName, signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[220px] flex-col bg-sidebar text-sidebar-foreground lg:flex">
      {/* Logo area — generous vertical space like Pixieset */}
      <div className="px-5 pt-7 pb-5 border-b border-sidebar-border">
        <h1 className="font-serif text-xl font-semibold text-gold tracking-tight">MirrorAI</h1>
        <p className="mt-0.5 text-[10px] text-sidebar-foreground/40 tracking-[0.08em] uppercase truncate">{studioName}</p>
      </div>

      <nav className="flex-1 px-2.5 pt-4 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === '/'}
            className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground"
            activeClassName="text-gold bg-sidebar-accent border-l-2 border-gold"
          >
            <item.icon className="h-[15px] w-[15px]" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-2.5 pb-5 border-t border-sidebar-border pt-3">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-sidebar-foreground/40 transition-colors hover:text-sidebar-foreground"
        >
          <LogOut className="h-[15px] w-[15px]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
