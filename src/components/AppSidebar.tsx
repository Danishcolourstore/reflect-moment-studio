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
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col bg-sidebar text-sidebar-foreground lg:flex">
      <div className="px-6 py-6">
        <h1 className="font-serif text-2xl font-semibold text-gold">MirrorAI</h1>
        <p className="mt-1 text-xs text-sidebar-foreground/60 truncate">{studioName}</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === '/'}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            activeClassName="bg-sidebar-accent text-gold border-l-2 border-gold font-medium"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-6">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
