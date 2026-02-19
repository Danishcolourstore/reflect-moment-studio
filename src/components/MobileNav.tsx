import { LayoutDashboard, CalendarDays, Upload, BarChart3, Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

const items = [
  { title: 'Home', url: '/', icon: LayoutDashboard },
  { title: 'Events', url: '/events', icon: CalendarDays },
  { title: 'Upload', url: '/upload', icon: Upload },
  { title: 'Stats', url: '/analytics', icon: BarChart3 },
  { title: 'More', url: '/settings', icon: Settings },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur-md py-1.5 lg:hidden safe-area-pb">
      {items.map((item) => (
        <NavLink
          key={item.url}
          to={item.url}
          end={item.url === '/'}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground transition-colors"
          activeClassName="text-gold"
        >
          <item.icon className="h-[18px] w-[18px]" />
          <span className="text-[9px] font-medium tracking-wide">{item.title}</span>
        </NavLink>
      ))}
    </nav>
  );
}
