import { LayoutDashboard, CalendarDays, BookOpen, Zap, Users, Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

const items = [
  { title: 'Overview', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Events', url: '/dashboard/events', icon: CalendarDays },
  { title: 'Storybook', url: '/dashboard/storybook', icon: BookOpen },
  { title: 'Cheetah Live', url: '/dashboard/cheetah-live', icon: Zap },
  { title: 'Clients', url: '/dashboard/clients', icon: Users },
  { title: 'More', url: '/dashboard/settings', icon: Settings },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur-md py-1.5 lg:hidden safe-area-pb">
      {items.map((item) => (
        <NavLink
          key={item.url}
          to={item.url}
          end={item.url === '/dashboard'}
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
