import { ReactNode, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard, Camera, Upload, Users, BarChart2, Palette, User,
  LogOut, Moon, Sun, Bell, ChevronRight, Menu, X,
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

const NAV_ITEMS = [
  { title: 'Overview', url: '/dashboard', icon: LayoutDashboard, end: true },
  { title: 'Events', url: '/dashboard/events', icon: Camera },
  { title: 'Upload', url: '/dashboard/upload', icon: Upload },
  { title: 'Clients', url: '/dashboard/clients', icon: Users },
  { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart2 },
  { title: 'Branding', url: '/dashboard/branding', icon: Palette },
  { title: 'Profile', url: '/dashboard/profile', icon: User },
];

const MOBILE_NAV = NAV_ITEMS.slice(0, 4); // Overview, Events, Upload, Clients
const MORE_NAV = NAV_ITEMS.slice(4); // Analytics, Branding, Profile

interface Profile {
  studio_name: string;
  avatar_url: string | null;
  plan: string;
  email: string | null;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/events': 'Events',
  '/dashboard/upload': 'Upload',
  '/dashboard/clients': 'Clients',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/branding': 'Branding',
  '/dashboard/profile': 'Profile',
};

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase.from('profiles').select('studio_name, avatar_url, plan, email') as any)
      .eq('user_id', user.id)
      .single()
      .then(({ data }: any) => { if (data) setProfile(data); });
  }, [user]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[240px] flex-col bg-sidebar text-sidebar-foreground lg:flex border-r border-sidebar-border">
        {/* Brand */}
        <div className="px-6 pt-7 pb-4">
          <h1 className="font-serif italic text-xl text-sidebar-primary tracking-tight">MirrorAI</h1>
        </div>
        <div className="mx-5 h-px bg-sidebar-border" />

        {/* Profile block */}
        <div className="px-5 py-5 flex flex-col items-center text-center">
          <Avatar className="h-14 w-14 mb-2.5">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-sm font-serif">{initials}</AvatarFallback>
          </Avatar>
          <p className="font-serif text-sm text-sidebar-foreground leading-tight">{user?.user_metadata?.full_name || profile?.email?.split('@')[0] || 'Photographer'}</p>
          <p className="text-[9px] text-sidebar-foreground/30 tracking-[0.14em] uppercase mt-1 truncate max-w-full">{profile?.studio_name || 'My Studio'}</p>
          <Badge
            variant="secondary"
            className={`mt-2 text-[9px] px-2 py-0 ${
              profile?.plan === 'pro'
                ? 'bg-sidebar-primary/20 text-sidebar-primary border-sidebar-primary/30'
                : 'bg-sidebar-accent text-sidebar-foreground/50 border-sidebar-border'
            }`}
          >
            {profile?.plan === 'pro' ? 'Pro' : 'Free'}
          </Badge>
        </div>

        <div className="mx-5 h-px bg-sidebar-border" />

        {/* Nav */}
        <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.end}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground rounded-sm border-l-[3px] border-transparent"
              activeClassName="text-sidebar-foreground bg-sidebar-accent border-l-[3px] !border-sidebar-primary"
            >
              <item.icon className="h-[15px] w-[15px]" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* Upgrade / Pro badge */}
        <div className="px-4 pb-4 pt-2">
          {profile?.plan !== 'pro' ? (
            <div className="bg-sidebar-accent rounded-lg p-3.5">
              <p className="font-serif text-sm text-sidebar-foreground">Upgrade to Pro</p>
              <p className="text-[10px] text-sidebar-foreground/40 mt-0.5">Unlimited events & storage</p>
              <Button size="sm" className="mt-2.5 w-full h-7 text-[10px] uppercase tracking-wider bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/80">
                Upgrade
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-[11px] text-sidebar-foreground/50">Pro Active</span>
            </div>
          )}
        </div>
      </aside>

      {/* Top Header */}
      <header className="fixed top-0 right-0 left-0 lg:left-[240px] z-20 h-16 bg-card border-b border-border flex items-center justify-between px-5 lg:px-8">
        <h2 className="font-serif text-xl font-semibold text-foreground">{currentTitle}</h2>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={toggleDark}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <Bell className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-secondary">{initials}</AvatarFallback>
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
      <main className="lg:ml-[240px] pt-16 pb-20 lg:pb-0">
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur-md py-1.5 lg:hidden safe-area-pb">
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.end}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground transition-colors"
            activeClassName="text-gold"
          >
            <item.icon className="h-[18px] w-[18px]" />
            <span className="text-[9px] font-medium tracking-wide">{item.title}</span>
          </NavLink>
        ))}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground">
              <Menu className="h-[18px] w-[18px]" />
              <span className="text-[9px] font-medium tracking-wide">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl">
            <div className="space-y-1 pt-2 pb-4">
              {MORE_NAV.map((item) => (
                <button
                  key={item.url}
                  onClick={() => { navigate(item.url); setMoreOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-[13px] text-foreground hover:bg-secondary rounded-lg transition-colors"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  {item.title}
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/30" />
                </button>
              ))}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-3 text-[13px] text-destructive hover:bg-destructive/10 rounded-lg transition-colors mt-2"
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
