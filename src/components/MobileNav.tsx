import { LayoutDashboard, CalendarDays, Upload, BarChart3, Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

const items = [
  { title: 'Home', url: '/', icon: LayoutDashboard },
  { title: 'Events', url: '/events', icon: CalendarDays },
  { title: 'Upload', url: '/upload', icon: Upload },
  { title: 'Stats', url: '/analytics', icon: BarChart3 },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-card py-2 lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.url}
          to={item.url}
          end={item.url === '/'}
          className="flex flex-col items-center gap-1 px-2 py-1 text-muted-foreground"
          activeClassName="text-gold"
        >
          <item.icon className="h-5 w-5" />
          <span className="text-[10px]">{item.title}</span>
        </NavLink>
      ))}
    </nav>
  );
}
