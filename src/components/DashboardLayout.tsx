import { ReactNode, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutGrid, Camera, Upload, Users, BarChart2, Palette, User,
  LogOut, Bell, ChevronRight, Menu,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetTrigger,
} from '@/components/ui/sheet';
import { NotificationBell } from '@/components/NotificationBell';
import { useStorageUsage, formatBytes, PLAN_LIMITS } from '@/hooks/use-storage-usage';

const NAV_ITEMS = [
  { title: 'Overview', url: '/dashboard', icon: LayoutGrid, end: true },
  { title: 'Events', url: '/dashboard/events', icon: Camera },
  { title: 'Upload', url: '/dashboard/upload', icon: Upload },
  { title: 'Clients', url: '/dashboard/clients', icon: Users },
  { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart2 },
  { title: 'Notifications', url: '/dashboard/notifications', icon: Bell },
  { title: 'Branding', url: '/dashboard/branding', icon: Palette },
  { title: 'Profile', url: '/dashboard/profile', icon: User },
];

const MOBILE_NAV = NAV_ITEMS.slice(0, 4);
const MORE_NAV = NAV_ITEMS.slice(4);

interface Profile {
  studio_name: string;
  avatar_url: string | null;
  plan: string;
  email: string | null;
  onboarding_completed: boolean;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/events': 'Events',
  '/dashboard/upload': 'Upload',
  '/dashboard/clients': 'Clients',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/branding': 'Branding',
  '/dashboard/profile': 'Profile',
  '/dashboard/onboarding': 'Welcome',
};

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const storage = useStorageUsage();

  useEffect(() => {
    if (!user) return;
    (supabase.from('profiles').select('studio_name, avatar_url, plan, email, onboarding_completed') as any)
      .eq('user_id', user.id)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setProfile(data);
          if (!data.onboarding_completed && !location.pathname.includes('/onboarding')) {
            navigate('/dashboard/onboarding', { replace: true });
          }
        }
      });
  }, [user, location.pathname, navigate]);



  const initials = profile?.studio_name?.slice(0, 2).toUpperCase() || 'MS';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const storageUsed = storage.data?.used ?? 0;
  const storageLimit = storage.data?.limit ?? PLAN_LIMITS.free;
  const storagePct = Math.min((storageUsed / storageLimit) * 100, 100);
  const storageColor = storagePct >= 100 ? 'bg-destructive' : storagePct >= 80 ? 'bg-gold-hover' : '';

  return (
    <div className="min-h-screen bg-background">
      

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[260px] flex-col lg:flex border-r border-border bg-background">
        <div className="px-7 pt-9 pb-6">
          <h1 className="text-foreground font-serif" style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>
            MirrorAI
          </h1>
          <p className="text-muted-foreground mt-1.5 font-serif" style={{ fontSize: '11px', fontStyle: 'italic', fontWeight: 300 }}>
            Mirror never lies
          </p>
        </div>

        <div className="mx-6 h-px bg-border" />

        <div className="px-6 py-7 flex flex-col items-center text-center">
          <Avatar className="h-14 w-14 mb-3.5 ring-1 ring-border">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-sans font-semibold" style={{ letterSpacing: '1px' }}>{initials}</AvatarFallback>
          </Avatar>
          <p className="text-sm text-foreground leading-tight font-serif" style={{ letterSpacing: '0.04em' }}>
            {user?.user_metadata?.full_name || profile?.email?.split('@')[0] || 'Photographer'}
          </p>
          <p className="mt-1.5 truncate max-w-full font-sans text-muted-foreground" style={{ fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
            {profile?.studio_name || 'My Studio'}
          </p>
          <Badge variant="secondary"
            className={`mt-3 px-3 py-0.5 font-sans ${profile?.plan === 'pro' ? 'bg-primary/15 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}
            style={{ fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}
          >
            {profile?.plan === 'pro' ? 'Pro' : 'Free'}
          </Badge>
        </div>

        <div className="mx-6 h-px bg-border" />

        <nav className="flex-1 px-4 pt-6 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.url} to={item.url} end={item.end}
              className="flex items-center gap-3.5 px-4 py-2.5 text-muted-foreground transition-all duration-200 hover:text-foreground rounded-xl border-l-2 border-transparent font-sans"
              activeClassName="text-foreground bg-muted border-l-2 !border-primary"
              style={{ fontWeight: 500, fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase' as const }}
            >
              <item.icon className="h-[15px] w-[15px] text-muted-foreground" strokeWidth={1.5} />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-5 pb-3 pt-4">
          {profile?.plan !== 'pro' ? (
            <div className="bg-secondary rounded-xl p-5">
              <p className="text-[13px] text-foreground font-serif" style={{ fontWeight: 500 }}>Upgrade to Pro</p>
              <p className="mt-1.5 font-sans text-muted-foreground" style={{ fontSize: '10px', letterSpacing: '1px' }}>Unlimited events & storage</p>
              <Button size="sm" className="mt-3.5 w-full h-9" style={{ fontSize: '10px', letterSpacing: '1.5px' }}>
                Upgrade
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
              <span className="font-sans text-muted-foreground" style={{ fontSize: '10px', letterSpacing: '1px' }}>Pro Active</span>
            </div>
          )}
        </div>

        <div className="px-5 pb-6">
          <p className="mb-2.5 font-sans text-muted-foreground" style={{ fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Storage</p>
          <p className="font-sans text-muted-foreground" style={{ fontSize: '11px' }}>
            {formatBytes(storageUsed)} <span className="text-muted-foreground/60">of {formatBytes(storageLimit)}</span>
          </p>
          <div className="mt-2.5 h-[2px] w-full rounded-full bg-border overflow-hidden">
            <div className={`h-full rounded-full transition-all ${storageColor || 'bg-primary/40'}`} style={{ width: `${storagePct}%` }} />
          </div>
          {profile?.plan !== 'pro' && (
            <button onClick={() => navigate('/dashboard/profile')} className="mt-1.5 hover:underline font-sans text-muted-foreground" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>Upgrade for more</button>
          )}
        </div>
      </aside>

      {/* Fixed Header — 64px */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] lg:left-auto lg:translate-x-0 lg:right-0 lg:max-w-none lg:left-[260px] z-20 flex items-center justify-between px-5 lg:px-10 bg-background border-b border-border" style={{ height: '64px' }}>
        <h2 className="text-foreground font-serif lg:hidden" style={{ fontWeight: 700, fontSize: '28px', letterSpacing: '-0.5px' }}>MirrorAI</h2>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-0.5">
                <Avatar className="h-9 w-9 ring-1 ring-border">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="font-sans text-muted-foreground bg-muted" style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                <User className="mr-2 h-3.5 w-3.5" /> Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <main className="lg:ml-[260px] pb-24 lg:pb-0" style={{ paddingTop: '64px' }}>
        <div className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 lg:px-10">
          {children}

          <div className="mt-16 pb-8 text-center">
            <p className="font-sans text-muted-foreground" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase' }}>
              Colour Store Preset Universe
            </p>
          </div>
        </div>
      </main>

      {/* Mobile bottom nav — 72px, Pixiset style */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 flex items-stretch lg:hidden bg-card border-t border-border w-full max-w-[480px]" style={{ height: '72px', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {MOBILE_NAV.map((item) => (
          <NavLink key={item.url} to={item.url} end={item.end}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors relative pt-0.5"
            activeClassName="text-foreground [&>.nav-top-bar]:opacity-100"
          >
            <div className="nav-top-bar absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-10 bg-primary opacity-0 transition-opacity" />
            <item.icon className="h-6 w-6" strokeWidth={1.5} />
            <span className="font-sans" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{item.title}</span>
          </NavLink>
        ))}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex-1 flex flex-col items-center justify-center gap-1 text-muted-foreground pt-0.5">
              <Menu className="h-6 w-6" strokeWidth={1.5} />
              <span className="font-sans" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <div className="space-y-1 pt-4 pb-6">
              {MORE_NAV.map((item) => (
                <button key={item.url}
                  onClick={() => { navigate(item.url); setMoreOpen(false); }}
                  className="flex items-center gap-3.5 w-full px-5 py-4 text-foreground hover:bg-secondary rounded-xl transition-colors font-sans"
                  style={{ fontSize: '13px', letterSpacing: '0.5px' }}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                  {item.title}
                  <ChevronRight className="ml-auto h-4 w-4 text-primary/40" />
                </button>
              ))}
              <button onClick={handleSignOut}
                className="flex items-center gap-3.5 w-full px-5 py-4 text-destructive hover:bg-destructive/5 rounded-xl transition-colors mt-4 font-sans"
                style={{ fontSize: '13px', letterSpacing: '0.5px' }}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
