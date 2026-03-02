import { ReactNode, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard, Camera, Upload, Users, BarChart2, Palette, User,
  LogOut, Moon, Sun, Bell, ChevronRight, Menu,
} from 'lucide-react';
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
  { title: 'Overview', url: '/dashboard', icon: LayoutDashboard, end: true },
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
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
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

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDark(!dark);
  };

  const initials = profile?.studio_name?.slice(0, 2).toUpperCase() || 'MS';
  const currentTitle = Object.entries(PAGE_TITLES).find(([path]) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  })?.[1] || 'Dashboard';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const storageUsed = storage.data?.used ?? 0;
  const storageLimit = storage.data?.limit ?? PLAN_LIMITS.free;
  const storagePct = Math.min((storageUsed / storageLimit) * 100, 100);
  const storageColor = storagePct >= 100 ? 'bg-destructive' : storagePct >= 80 ? 'bg-yellow-500' : '';

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar — editorial luxury */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[260px] flex-col bg-sidebar text-sidebar-foreground lg:flex border-r border-sidebar-border">
        {/* Brand */}
        <div className="px-7 pt-8 pb-5">
          <h1
            className="text-sidebar-foreground/90 tracking-[0.08em]"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: 300 }}
          >
            MirrorAI
          </h1>
          <p className="text-[8px] text-sidebar-foreground/20 tracking-[0.25em] uppercase mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
            Studio Platform
          </p>
        </div>

        <div className="mx-6 h-px bg-sidebar-border" />

        {/* Profile */}
        <div className="px-6 py-6 flex flex-col items-center text-center">
          <Avatar className="h-16 w-16 mb-3 ring-1 ring-sidebar-border">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground/70 text-sm font-serif">{initials}</AvatarFallback>
          </Avatar>
          <p className="font-serif text-sm text-sidebar-foreground/80 leading-tight tracking-wide">{user?.user_metadata?.full_name || profile?.email?.split('@')[0] || 'Photographer'}</p>
          <p className="text-[8px] text-sidebar-foreground/20 tracking-[0.18em] uppercase mt-1.5 truncate max-w-full" style={{ fontFamily: "Inter, sans-serif" }}>
            {profile?.studio_name || 'My Studio'}
          </p>
          <Badge variant="secondary"
            className={`mt-2.5 text-[8px] tracking-[0.12em] uppercase px-2.5 py-0.5 ${
              profile?.plan === 'pro'
                ? 'bg-sidebar-primary/15 text-sidebar-primary border-sidebar-primary/20'
                : 'bg-sidebar-accent text-sidebar-foreground/40 border-sidebar-border'
            }`}>
            {profile?.plan === 'pro' ? 'Pro' : 'Free'}
          </Badge>
        </div>

        <div className="mx-6 h-px bg-sidebar-border" />

        {/* Navigation */}
        <nav className="flex-1 px-4 pt-5 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.url} to={item.url} end={item.end}
              className="flex items-center gap-3 px-3.5 py-2.5 text-[12px] tracking-[0.04em] text-sidebar-foreground/40 transition-all duration-200 hover:text-sidebar-foreground/70 rounded-lg border-l-2 border-transparent"
              activeClassName="text-sidebar-foreground/90 bg-sidebar-accent border-l-2 !border-sidebar-primary"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
            >
              <item.icon className="h-[14px] w-[14px]" strokeWidth={1.5} />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* Upgrade */}
        <div className="px-5 pb-3 pt-3">
          {profile?.plan !== 'pro' ? (
            <div className="bg-sidebar-accent/60 rounded-xl p-4">
              <p className="font-serif text-[13px] text-sidebar-foreground/70 tracking-wide">Upgrade to Pro</p>
              <p className="text-[9px] text-sidebar-foreground/25 mt-1 tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>Unlimited events & storage</p>
              <Button size="sm" className="mt-3 w-full h-8 text-[9px] uppercase tracking-[0.16em] bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/80 rounded-lg">
                Upgrade
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500/70" />
              <span className="text-[10px] text-sidebar-foreground/40 tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>Pro Active</span>
            </div>
          )}
        </div>

        {/* Storage */}
        <div className="px-5 pb-5">
          <p className="text-[8px] uppercase tracking-[0.2em] text-sidebar-foreground/20 font-medium mb-2" style={{ fontFamily: "Inter, sans-serif" }}>Storage</p>
          <p className="text-[10px] text-sidebar-foreground/50" style={{ fontFamily: "Inter, sans-serif" }}>
            {formatBytes(storageUsed)} <span className="text-sidebar-foreground/20">of {formatBytes(storageLimit)}</span>
          </p>
          <div className="mt-2 h-[3px] w-full rounded-full bg-sidebar-border overflow-hidden">
            <div className={`h-full rounded-full transition-all ${storageColor || 'bg-sidebar-primary/60'}`}
              style={{ width: `${storagePct}%` }} />
          </div>
          {storagePct >= 80 && storagePct < 100 && (
            <p className="text-[8px] text-yellow-500/70 mt-1.5">Almost full</p>
          )}
          {profile?.plan !== 'pro' && (
            <button onClick={() => navigate('/dashboard/profile')} className="text-[8px] text-sidebar-primary/70 mt-1.5 hover:underline tracking-wide">Upgrade for more</button>
          )}
        </div>
      </aside>

      {/* Top Header — floating editorial */}
      <header className="fixed top-0 right-0 left-0 lg:left-[260px] z-20 h-16 bg-card/90 backdrop-blur-md border-b border-border/60 flex items-center justify-between px-6 lg:px-10">
        <h2 className="font-serif text-lg text-foreground tracking-wide" style={{ fontWeight: 400 }}>{currentTitle}</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-foreground" onClick={toggleDark}>
            {dark ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />}
          </Button>
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1">
                <Avatar className="h-8 w-8 ring-1 ring-border/40">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[9px] bg-secondary text-muted-foreground">{initials}</AvatarFallback>
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

      {/* Main content — generous spacing */}
      <main className="lg:ml-[260px] pt-16 pb-24 lg:pb-0">
        <div className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8 lg:px-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav — editorial */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border/40 bg-card/95 backdrop-blur-xl py-2 lg:hidden safe-area-pb">
        {MOBILE_NAV.map((item) => (
          <NavLink key={item.url} to={item.url} end={item.end}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground/50 transition-colors"
            activeClassName="text-foreground">
            <item.icon className="h-[17px] w-[17px]" strokeWidth={1.5} />
            <span className="text-[8px] font-medium tracking-[0.1em] uppercase" style={{ fontFamily: "Inter, sans-serif" }}>{item.title}</span>
          </NavLink>
        ))}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground/50">
              <Menu className="h-[17px] w-[17px]" strokeWidth={1.5} />
              <span className="text-[8px] font-medium tracking-[0.1em] uppercase" style={{ fontFamily: "Inter, sans-serif" }}>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <div className="space-y-1 pt-3 pb-5">
              {MORE_NAV.map((item) => (
                <button key={item.url}
                  onClick={() => { navigate(item.url); setMoreOpen(false); }}
                  className="flex items-center gap-3 w-full px-5 py-3.5 text-[12px] tracking-wide text-foreground hover:bg-secondary rounded-xl transition-colors"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground/40" strokeWidth={1.5} />
                  {item.title}
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/20" />
                </button>
              ))}
              <button onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-5 py-3.5 text-[12px] tracking-wide text-destructive hover:bg-destructive/5 rounded-xl transition-colors mt-3"
                style={{ fontFamily: "Inter, sans-serif" }}
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
