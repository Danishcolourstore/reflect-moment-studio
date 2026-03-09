import { ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutGrid, Camera, BookOpen, Zap, Users, BarChart2, Palette, User,
  LogOut, Moon, Sparkles, Bell, ChevronRight, Menu,
} from 'lucide-react';
import { RealtimeStatusIndicator } from '@/components/RealtimeStatusIndicator';
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
  { title: 'Storybook', url: '/dashboard/storybook', icon: BookOpen },
  { title: 'Cheetah Live', url: '/dashboard/cheetah-live', icon: Zap },
  { title: 'Clients', url: '/dashboard/clients', icon: Users },
  { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart2 },
  { title: 'Notifications', url: '/dashboard/notifications', icon: Bell },
  { title: 'Branding', url: '/dashboard/branding', icon: Palette },
  { title: 'Profile', url: '/dashboard/profile', icon: User },
];

const MOBILE_NAV = [
  { title: 'Overview', url: '/dashboard', icon: LayoutGrid, end: true },
  { title: 'Events', url: '/dashboard/events', icon: Camera },
  { title: 'Storybook', url: '/dashboard/storybook', icon: BookOpen },
  { title: 'Cheetah', url: '/dashboard/cheetah-live', icon: Zap },
];
const MORE_NAV = NAV_ITEMS.filter(i => !MOBILE_NAV.some(m => m.url === i.url));

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
  '/dashboard/storybook': 'Storybook',
  '/dashboard/album-designer': 'Album Designer',
  '/dashboard/cheetah-live': 'Cheetah Live',
  '/dashboard/clients': 'Clients',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/branding': 'Branding',
  '/dashboard/profile': 'Profile',
  '/dashboard/onboarding': 'Welcome',
};

type ThemeMode = 'dark' | 'classic';

function applyThemeClass(t: ThemeMode) {
  document.documentElement.classList.remove('dark', 'editorial', 'classic');
  document.documentElement.classList.add(t);
  localStorage.setItem('andhakaar-mode', t === 'dark' ? 'on' : 'off');
  localStorage.setItem('theme', t);
}

function normalizeTheme(raw: string): ThemeMode {
  if (raw === 'dark') return 'dark';
  return 'classic'; // editorial or anything else → classic
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('mirrorai-theme') || 'dark';
    const t = normalizeTheme(saved);
    applyThemeClass(t);
    return t;
  });
  const [moreOpen, setMoreOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const storage = useStorageUsage();

  // Load profile + theme preference from DB
  useEffect(() => {
    if (!user) return;
    (supabase.from('profiles').select('studio_name, avatar_url, plan, email, onboarding_completed, theme_preference') as any)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setProfile(data);
          // Sync theme from DB if different from localStorage
          const dbTheme = normalizeTheme(data.theme_preference || 'dark');
          applyThemeClass(dbTheme);
          localStorage.setItem('mirrorai-theme', dbTheme);
          setTheme(dbTheme);
          if (!data.onboarding_completed && !location.pathname.includes('/onboarding')) {
            navigate('/dashboard/onboarding', { replace: true });
          }
        }
      });
  }, [user, location.pathname, navigate]);

  const switchTheme = useCallback((next: ThemeMode) => {
    if (next === theme) return;
    const overlay = overlayRef.current;
    if (overlay) {
      overlay.classList.add('active');
      setTimeout(() => {
        applyThemeClass(next);
        localStorage.setItem('mirrorai-theme', next);
        setTheme(next);
        // Persist to DB
        if (user) {
          (supabase.from('profiles').update({ theme_preference: next } as any) as any).eq('user_id', user.id).then(() => {});
        }
        setTimeout(() => overlay.classList.remove('active'), 100);
      }, 300);
    } else {
      applyThemeClass(next);
      localStorage.setItem('mirrorai-theme', next);
      setTheme(next);
      if (user) {
        (supabase.from('profiles').update({ theme_preference: next } as any) as any).eq('user_id', user.id).then(() => {});
      }
    }
  }, [theme, user]);

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
      <div ref={overlayRef} className="andhakaar-overlay" />

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[260px] flex-col lg:flex border-r border-border bg-background/95 backdrop-blur-xl">
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
              className="flex items-center gap-3.5 px-4 py-2.5 text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-muted/50 rounded-xl border-l-2 border-transparent font-sans"
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
      <header className="fixed top-0 right-0 left-0 lg:left-[260px] z-20 flex items-center justify-between px-5 lg:px-10 bg-background/80 backdrop-blur-xl border-b border-border" style={{ height: '64px' }}>
        <h2 className="text-foreground font-serif lg:hidden" style={{ fontWeight: 700, fontSize: '28px', letterSpacing: '-0.5px' }}>MirrorAI</h2>
        {/* Desktop page title */}
        <h2 className="hidden lg:block text-foreground font-sans" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' as const }}>
          {PAGE_TITLES[location.pathname] || ''}
        </h2>
        <div className="flex items-center gap-3">
          {/* Realtime status indicator */}
          <RealtimeStatusIndicator />
          {/* Theme switcher — Dark / Editorial / Classic */}
          <div className="flex items-center rounded-full border border-border bg-card overflow-hidden">
            {([
              { key: 'dark' as ThemeMode, label: 'Dark', emoji: '🌙' },
              { key: 'classic' as ThemeMode, label: 'Classic', emoji: '✦' },
            ]).map(({ key, label, emoji }) => (
              <button
                key={key}
                onClick={() => switchTheme(key)}
                className={`flex items-center gap-1 px-2.5 py-1.5 transition-all duration-200 font-sans ${
                  theme === key
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}
                aria-label={`Switch to ${label} theme`}
              >
                <span className="text-[11px]">{emoji}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
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
        <div className="mx-auto max-w-[1400px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          {children}

          <div className="mt-16 pb-8 text-center">
            <p className="font-sans text-muted-foreground" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase' }}>
              Colour Store Preset Universe
            </p>
          </div>
        </div>
      </main>

      {/* Mobile bottom nav — 72px, Pixiset style */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch lg:hidden bg-card border-t border-border" style={{ height: '72px', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {MOBILE_NAV.map((item) => {
          const isClassic = theme === 'classic';
          return (
            <NavLink key={item.url} to={item.url} end={item.end}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors relative pt-0.5`}
              activeClassName={isClassic ? 'nav-active-gold [&>.nav-top-bar]:opacity-100' : 'text-foreground [&>.nav-top-bar]:opacity-100'}
            >
              <div className={`nav-top-bar absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-10 opacity-0 transition-opacity ${isClassic ? 'nav-bar-gold' : 'bg-primary'}`} />
              <item.icon className="h-5 w-5" strokeWidth={1.5} />
              <span className="font-sans whitespace-nowrap" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' }}>{item.title}</span>
            </NavLink>
          );
        })}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex-1 flex flex-col items-center justify-center gap-0.5 text-muted-foreground pt-0.5">
              <Menu className="h-5 w-5" strokeWidth={1.5} />
              <span className="font-sans whitespace-nowrap" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' }}>More</span>
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
