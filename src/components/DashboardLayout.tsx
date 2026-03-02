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
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      return true;
    } else if (saved === 'light') {
      document.documentElement.classList.remove('dark');
      return false;
    }
    return document.documentElement.classList.contains('dark');
  });
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
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDark(next);
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
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[260px] flex-col lg:flex border-r border-border bg-sidebar">
        {/* Brand */}
        <div className="px-7 pt-9 pb-6">
          <h1
            className="text-foreground"
            style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 300, letterSpacing: '0.12em' }}
          >
            MirrorAI
          </h1>
          <p className="text-muted-foreground mt-1.5" style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", fontSize: '10px', fontStyle: 'italic', fontWeight: 300, letterSpacing: '0.1em' }}>
            Mirror never lies
          </p>
        </div>

        <div className="mx-6 h-px bg-border" />

        {/* Profile */}
        <div className="px-6 py-7 flex flex-col items-center text-center">
          <Avatar className="h-14 w-14 mb-3.5 ring-1 ring-border">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-accent text-muted-foreground text-xs" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{initials}</AvatarFallback>
          </Avatar>
          <p className="text-sm text-foreground leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.04em' }}>
            {user?.user_metadata?.full_name || profile?.email?.split('@')[0] || 'Photographer'}
          </p>
          <p className="mt-1.5 truncate max-w-full" style={{ fontFamily: "Inter, sans-serif", fontSize: '7px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#9A948A' }}>
            {profile?.studio_name || 'My Studio'}
          </p>
          <Badge variant="secondary"
            className={`mt-3 px-3 py-0.5 ${
              profile?.plan === 'pro'
                ? 'bg-foreground/8 text-foreground border-foreground/12'
                : 'bg-accent text-muted-foreground border-border'
            }`}
            style={{ fontSize: '7px', letterSpacing: '0.16em', textTransform: 'uppercase' }}
          >
            {profile?.plan === 'pro' ? 'Pro' : 'Free'}
          </Badge>
        </div>

        <div className="mx-6 h-px bg-border" />

        {/* Navigation */}
        <nav className="flex-1 px-4 pt-6 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.url} to={item.url} end={item.end}
              className="flex items-center gap-3.5 px-4 py-2.5 text-muted-foreground transition-all duration-200 hover:text-foreground rounded-xl border-l-2 border-transparent"
              activeClassName="text-foreground bg-accent/60 border-l-2 !border-foreground"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}
            >
              <item.icon className="h-[14px] w-[14px]" strokeWidth={1.3} style={{ color: '#9A948A' }} />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* Upgrade */}
        <div className="px-5 pb-3 pt-4">
          {profile?.plan !== 'pro' ? (
            <div className="bg-accent/40 rounded-xl p-5">
              <p className="text-[12px] text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.04em' }}>Upgrade to Pro</p>
              <p className="mt-1.5" style={{ fontFamily: "Inter, sans-serif", fontSize: '8px', letterSpacing: '0.14em', color: '#9A948A' }}>Unlimited events & storage</p>
              <Button size="sm" className="mt-3.5 w-full h-8 bg-foreground text-primary-foreground hover:bg-[#1A1A1A] rounded-lg" style={{ fontSize: '8px', letterSpacing: '0.2em' }}>
                Upgrade
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500/50" />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: '9px', letterSpacing: '0.12em', color: '#7A7A7A' }}>Pro Active</span>
            </div>
          )}
        </div>

        {/* Storage */}
        <div className="px-5 pb-6">
          <p className="mb-2.5" style={{ fontFamily: "Inter, sans-serif", fontSize: '7px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#9A948A', fontWeight: 300 }}>Storage</p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: '10px', color: '#7A7A7A' }}>
            {formatBytes(storageUsed)} <span style={{ color: '#9A948A' }}>of {formatBytes(storageLimit)}</span>
          </p>
          <div className="mt-2.5 h-[2px] w-full rounded-full bg-border overflow-hidden">
            <div className={`h-full rounded-full transition-all ${storageColor || 'bg-foreground/30'}`}
              style={{ width: `${storagePct}%` }} />
          </div>
          {storagePct >= 80 && storagePct < 100 && (
            <p className="mt-1.5" style={{ fontSize: '7px', color: 'hsl(45 90% 55% / 0.5)' }}>Almost full</p>
          )}
          {profile?.plan !== 'pro' && (
            <button onClick={() => navigate('/dashboard/profile')} className="mt-1.5 hover:underline" style={{ fontSize: '7px', color: '#7A7A7A', letterSpacing: '0.08em' }}>Upgrade for more</button>
          )}
        </div>
      </aside>

      {/* Floating Header — translucent, minimal */}
      <header className="fixed top-0 right-0 left-0 lg:left-[260px] z-20 h-14 flex items-center justify-between px-6 lg:px-10 bg-card border-b border-border">
        <h2 className="text-foreground font-serif" style={{ fontWeight: 300, fontSize: '22px', letterSpacing: '0.04em' }}>{currentTitle}</h2>
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/30 hover:text-foreground" onClick={toggleDark}>
            {dark ? <Sun className="h-4 w-4" strokeWidth={1.3} /> : <Moon className="h-4 w-4" strokeWidth={1.3} />}
          </Button>
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1">
                <Avatar className="h-8 w-8 ring-1 ring-border/20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[9px] bg-secondary text-muted-foreground/50">{initials}</AvatarFallback>
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
      <main className="lg:ml-[260px] pt-14 pb-28 lg:pb-0">
        <div className="mx-auto max-w-[1100px] px-5 py-12 sm:px-8 lg:px-10">
          {children}

          {/* Dashboard footer branding */}
          <div className="mt-16 pb-8 text-center">
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.45em",
                textTransform: "uppercase",
                color: "#9A948A",
              }}
            >
              Colour Store Preset Universe
            </p>
          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around py-2.5 lg:hidden safe-area-pb"
        style={{
          background: 'hsl(var(--background) / 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid hsl(var(--border) / 0.2)',
        }}>
        {MOBILE_NAV.map((item) => (
          <NavLink key={item.url} to={item.url} end={item.end}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground/30 transition-colors"
            activeClassName="text-foreground">
            <item.icon className="h-[17px] w-[17px]" strokeWidth={1.3} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: '7px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{item.title}</span>
          </NavLink>
        ))}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground/30">
              <Menu className="h-[17px] w-[17px]" strokeWidth={1.3} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: '7px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' }}>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <div className="space-y-1 pt-4 pb-6">
              {MORE_NAV.map((item) => (
                <button key={item.url}
                  onClick={() => { navigate(item.url); setMoreOpen(false); }}
                  className="flex items-center gap-3.5 w-full px-5 py-4 text-foreground hover:bg-secondary/50 rounded-xl transition-colors"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: '12px', letterSpacing: '0.04em' }}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground/30" strokeWidth={1.3} />
                  {item.title}
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/15" />
                </button>
              ))}
              <button onClick={handleSignOut}
                className="flex items-center gap-3.5 w-full px-5 py-4 text-destructive hover:bg-destructive/5 rounded-xl transition-colors mt-4"
                style={{ fontFamily: "Inter, sans-serif", fontSize: '12px', letterSpacing: '0.04em' }}
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
