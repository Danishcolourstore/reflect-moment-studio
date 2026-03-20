import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { Camera, BookOpen, Globe, Menu, ChevronRight, LogOut, LayoutGrid } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useDeviceDetect } from '@/hooks/use-device-detect';
import { useAuth } from '@/lib/auth';

const MOBILE_NAV = [
  { title: 'Home', url: '/home', icon: LayoutGrid, end: true },
  { title: 'Events', url: '/dashboard/events', icon: Camera },
  { title: 'Albums', url: '/dashboard/album-designer', icon: BookOpen },
  { title: 'Website', url: '/dashboard/website-editor', icon: Globe },
];

const MORE_NAV = [
  { title: 'Cheetah', url: '/dashboard/cheetah-live', icon: Camera },
  { title: 'Clients', url: '/dashboard/clients', icon: Camera },
  { title: 'Analytics', url: '/dashboard/analytics', icon: Camera },
  { title: 'Profile', url: '/dashboard/profile', icon: Camera },
  { title: 'Notifications', url: '/dashboard/notifications', icon: Camera },
];

export function MobileBottomNav() {
  const device = useDeviceDetect();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!device.isPhone) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-border"
      style={{
        height: 56,
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {MOBILE_NAV.map((item) => (
        <NavLink key={item.url} to={item.url} end={item.end}
          className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px]"
          activeClassName="[&>svg]:text-[#C8A97E] [&>span]:text-[#C8A97E]"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          <item.icon className="h-[22px] w-[22px] transition-colors" strokeWidth={1.6} />
          <span className="text-[10px] font-medium tracking-wide transition-colors">{item.title}</span>
        </NavLink>
      ))}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger asChild>
          <button
            className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px]"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            <Menu className="h-[22px] w-[22px]" strokeWidth={1.6} />
            <span className="text-[10px] font-medium tracking-wide">More</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-[20px]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
          <div className="space-y-1 pt-4 pb-4">
            {MORE_NAV.map((item) => (
              <button key={item.url}
                onClick={() => { navigate(item.url); setMoreOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-foreground hover:bg-secondary rounded-lg transition-colors text-sm min-h-[48px]"
              >
                {item.title}
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/40" />
              </button>
            ))}
            <div className="mx-4 my-2 h-px bg-border" />
            <button
              onClick={async () => { await signOut(); navigate('/login'); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-destructive hover:bg-destructive/5 rounded-lg transition-colors text-sm min-h-[48px]"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
