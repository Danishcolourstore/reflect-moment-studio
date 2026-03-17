import { ReactNode, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useDeviceDetect } from '@/hooks/use-device-detect';
import {
  LayoutGrid, Camera, BookOpen, Zap, Users, BarChart2, Palette, User,
  LogOut, Bell, ChevronRight, Menu, Globe, Compass, Bot,
} from 'lucide-react';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { EntiranProvider, useEntiranOpen } from '@/components/entiran/EntiranProvider';
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
  { title: 'Website', url: '/dashboard/website-editor', icon: Globe },
  { title: 'Domains', url: '/dashboard/domains', icon: Globe },
  { title: 'Storybook', url: '/dashboard/storybook', icon: BookOpen },
  { title: 'Cheetah', url: '/dashboard/cheetah-live', icon: Zap },
  { title: 'Clients', url: '/dashboard/clients', icon: Users },
  { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart2 },
  { title: 'Notifications', url: '/dashboard/notifications', icon: Bell },
  { title: 'Profile', url: '/dashboard/profile', icon: User },
];

const MOBILE_NAV = [
  { title: 'Home', url: '/dashboard', icon: LayoutGrid, end: true },
  { title: 'Cheetah', url: '/dashboard/cheetah-live', icon: Zap },
  { title: 'Reflections', url: '/dashboard/reflections', icon: Compass },
];
const MORE_NAV = NAV_ITEMS.filter(i => !MOBILE_NAV.some(m => m.url === i.url));

interface Profile {
  studio_name: string;
  avatar_url: string | null;
  plan: string;
  email: string | null;
  onboarding_completed: boolean;
}

function useDomainNudge(userId: string | undefined) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!userId) return;
    (supabase.from('domains').select('id, custom_domain').eq('user_id', userId) as any)
      .then(({ data }: any) => {
        const hasCustom = (data || []).some((d: any) => !!d.custom_domain);
        setShow(!hasCustom);
      });
  }, [userId]);
  return show;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/events': 'Events',
  '/dashboard/website-editor': 'Website Builder',
  '/dashboard/domains': 'Website Domains',
  '/dashboard/storybook': 'Storybook',
  '/dashboard/album-designer': 'Album Designer',
  '/dashboard/cheetah-live': 'Cheetah',
  '/dashboard/clients': 'Clients',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/branding': 'Branding',
  '/dashboard/profile': 'Profile',
  '/dashboard/onboarding': 'Welcome',
};

type ThemeMode = 'dark' | 'versace' | 'classic' | 'darkroom';
type AccentMode = 'gold' | 'red';

const THEME_ORDER: ThemeMode[] = ['dark', 'versace', 'classic', 'darkroom'];
const THEME_ICONS: Record<ThemeMode, string> = { dark: '🌙', versace: '👑', classic: '☀️', darkroom: '🎞️' };

function applyThemeClass(t: ThemeMode) {
  document.documentElement.classList.remove('dark', 'editorial', 'classic', 'versace', 'darkroom');
  if (t !== 'dark') document.documentElement.classList.add(t);
  localStorage.setItem('theme', t);
}

function applyAccentClass(a: AccentMode) {
  if (a === 'red') {
    document.documentElement.classList.add('accent-red');
  } else {
    document.documentElement.classList.remove('accent-red');
  }
  localStorage.setItem('accent', a);
}

function BotNavTab() {
  const { openBot } = useEntiranOpen();
  return (
    <button
      onClick={openBot}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors min-h-[44px]"
    >
      <Bot className="h-5 w-5" strokeWidth={1.8} />
      <span className="text-[10px] font-medium">Bot</span>
    </button>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const device = useDeviceDetect();
  const showDomainNudge = useDomainNudge(user?.id);
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    const t: ThemeMode = THEME_ORDER.includes(saved as ThemeMode) ? (saved as ThemeMode) : 'dark';
    applyThemeClass(t);
    return t;
  });
  const [accent, setAccent] = useState<AccentMode>(() => {
    const saved = localStorage.getItem('accent') || 'gold';
    const a: AccentMode = saved === 'red' ? 'red' : 'gold';
    applyAccentClass(a);
    return a;
  });
  const [moreOpen, setMoreOpen] = useState(false);
  const storage = useStorageUsage();

  useEffect(() => {
    if (!user) return;
    (supabase.from('profiles').select('studio_name, avatar_url, plan, email, onboarding_completed, theme_preference, accent_preference') as any)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setProfile(data);
          const dbTheme: ThemeMode = THEME_ORDER.includes(data.theme_preference as ThemeMode) ? (data.theme_preference as ThemeMode) : 'dark';
          applyThemeClass(dbTheme);
          setTheme(dbTheme);
          const dbAccent: AccentMode = data.accent_preference === 'red' ? 'red' : 'gold';
          applyAccentClass(dbAccent);
          setAccent(dbAccent);
          if (!data.onboarding_completed && !location.pathname.includes('/onboarding')) {
            navigate('/dashboard/onboarding', { replace: true });
          }
        }
      });
  }, [user, location.pathname, navigate]);

  const switchTheme = useCallback((next: ThemeMode) => {
    if (next === theme) return;
    applyThemeClass(next);
    setTheme(next);
    if (user) {
      (supabase.from('profiles').update({ theme_preference: next } as any) as any).eq('user_id', user.id).then(() => {});
    }
  }, [theme, user]);

  const switchAccent = useCallback((next: AccentMode) => {
    if (next === accent) return;
    applyAccentClass(next);
    setAccent(next);
    if (user) {
      (supabase.from('profiles').update({ accent_preference: next } as any) as any).eq('user_id', user.id).then(() => {});
    }
  }, [accent, user]);

  const initials = profile?.studio_name?.slice(0, 2).toUpperCase() || 'MA';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const storageUsed = storage.data?.used ?? 0;
  const storageLimit = storage.data?.limit ?? PLAN_LIMITS.free;
  const storagePct = Math.min((storageUsed / storageLimit) * 100, 100);

  // Tablet: use sidebar + wider content; Phone: bottom nav; Desktop: sidebar
  const showSidebar = device.isDesktop || device.isTablet;
  const showBottomNav = device.isPhone;
  const sidebarWidth = device.isTablet ? 200 : 240;

  return (
    <EntiranProvider>
    <div className="min-h-screen bg-background">
      {/* Sidebar — desktop and tablet */}
      {showSidebar && (
      <aside className="fixed left-0 top-0 z-30 h-screen flex-col flex border-r border-border bg-card" style={{ width: sidebarWidth }}>
        <div className="px-6 pt-7 pb-5">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Mirror AI</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Photography Platform</p>
        </div>

        <div className="mx-5 h-px bg-border" />

        {/* User info */}
        <div className="px-5 py-5 flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-muted-foreground text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.studio_name || 'My Studio'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email || ''}</p>
          </div>
        </div>

        <div className="mx-5 h-px bg-border" />

        <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.url} to={item.url} end={item.end}
              className="flex items-center gap-3 px-3 py-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary rounded-lg text-sm"
              activeClassName="text-foreground bg-secondary font-medium"
            >
              <item.icon className="h-4 w-4" strokeWidth={1.8} />
              <span>{item.title}</span>
              {item.title === 'Domains' && showDomainNudge && (
                <span className="ml-auto h-2 w-2 rounded-full" style={{ backgroundColor: '#C9A96E' }} />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Storage */}
        <div className="px-5 pb-5 pt-3">
          <p className="text-xs text-muted-foreground mb-2">Storage</p>
          <p className="text-xs text-foreground">
            {formatBytes(storageUsed)} <span className="text-muted-foreground">/ {formatBytes(storageLimit)}</span>
          </p>
          <div className="mt-2 h-1 w-full rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-foreground/20 transition-all" style={{ width: `${storagePct}%` }} />
          </div>
        </div>
      </aside>
      )}

      {/* Header */}
      <header
        className="fixed top-0 right-0 z-20 flex items-center justify-between px-4 lg:px-8 bg-card/80 backdrop-blur-xl border-b border-border h-14"
        style={{ left: showSidebar ? sidebarWidth : 0 }}
      >
        {!showSidebar && <h2 className="text-foreground font-semibold text-lg tracking-tight">Mirror AI</h2>}
        {showSidebar && (
          <h2 className="text-sm font-medium text-foreground">
            {PAGE_TITLES[location.pathname] || ''}
          </h2>
        )}
        <div className="flex items-center gap-1.5">
          {/* Accent toggle: Red ↔ Gold */}
          <button
            onClick={() => switchAccent(accent === 'gold' ? 'red' : 'gold')}
            className="relative flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-secondary/80 border border-border/60 hover:bg-secondary transition-all duration-300 group"
            title={`Accent: ${accent === 'gold' ? 'Gold' : 'Red'}`}
          >
            <span
              className="h-3 w-3 rounded-full transition-all duration-300 shadow-sm"
              style={{
                background: accent === 'gold'
                  ? 'hsl(43 76% 53%)'
                  : 'hsl(0 65% 42%)',
                boxShadow: accent === 'gold'
                  ? '0 0 8px hsl(43 76% 53% / 0.5)'
                  : '0 0 8px hsl(0 65% 42% / 0.5)',
              }}
            />
            <span className="text-[9px] font-semibold tracking-wider uppercase text-muted-foreground group-hover:text-foreground transition-colors">
              {accent === 'gold' ? 'Gold' : 'Red'}
            </span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => {
              const idx = THEME_ORDER.indexOf(theme);
              switchTheme(THEME_ORDER[(idx + 1) % THEME_ORDER.length]);
            }}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={`Theme: ${theme}`}
          >
            {THEME_ICONS[theme]}
          </button>
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-muted-foreground text-xs font-medium">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main */}
      <main
        className="pb-24 lg:pb-0 pt-14"
        style={{ marginLeft: showSidebar ? sidebarWidth : 0 }}
      >
        <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>

      {!showBottomNav && <FloatingActionButton />}

      {/* Mobile bottom nav — phones only */}
      {showBottomNav && (
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch bg-card border-t border-border safe-area-pb h-16">
        {MOBILE_NAV.map((item) => (
          <NavLink key={item.url} to={item.url} end={item.end}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors min-h-[44px]"
            activeClassName="text-foreground"
          >
            <item.icon className="h-5 w-5" strokeWidth={1.8} />
            <span className="text-[10px] font-medium">{item.title}</span>
          </NavLink>
        ))}
        <BotNavTab />
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex-1 flex flex-col items-center justify-center gap-0.5 text-muted-foreground min-h-[44px]">
              <Menu className="h-5 w-5" strokeWidth={1.8} />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl safe-area-pb">
            <div className="space-y-1 pt-4 pb-6">
              {MORE_NAV.map((item) => (
                <button key={item.url}
                  onClick={() => { navigate(item.url); setMoreOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-foreground hover:bg-secondary rounded-lg transition-colors text-sm min-h-[44px]"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                  {item.title}
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/40" />
                </button>
              ))}
              <button onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-3 text-destructive hover:bg-destructive/5 rounded-lg transition-colors mt-3 text-sm min-h-[44px]"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
      )}
    </div>
    </EntiranProvider>
  );
}
