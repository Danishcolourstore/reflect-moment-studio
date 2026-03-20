import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard, Users, Camera, HardDrive, DollarSign,
  Mail, Activity, Settings, LogOut, Menu, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSettingFlag } from '@/hooks/use-platform-settings';

const navLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/photographers', label: 'Photographers', icon: Users },
  { to: '/admin/events', label: 'Events', icon: Camera },
  { to: '/admin/storage', label: 'Storage', icon: HardDrive },
  { to: '/admin/revenue', label: 'Revenue', icon: DollarSign },
  { to: '/admin/emails', label: 'Bulk Email', icon: Mail },
  { to: '/admin/activity', label: 'Activity Log', icon: Activity },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ photographers: 0, events: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const maintenance = useSettingFlag('maintenanceMode', false);

  useEffect(() => {
    Promise.all([
      (supabase.from('profiles').select('id', { count: 'exact', head: true }) as any),
      (supabase.from('events').select('id', { count: 'exact', head: true }) as any),
    ]).then(([p, e]) => {
      setCounts({
        photographers: (p as any).count ?? 0,
        events: (e as any).count ?? 0,
      });
    });
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const currentPage = navLinks.find(l =>
    l.end ? location.pathname === l.to : location.pathname.startsWith(l.to) && l.to !== '/admin'
  ) || navLinks[0];

  const handleLogout = () => {
    localStorage.removeItem('mirrorai_admin_session');
    navigate('/admin');
    window.location.reload();
  };

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 border-r border-border bg-card flex-col shrink-0">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <span className="font-display text-lg italic text-foreground">MirrorAI</span>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Admin</Badge>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] transition-colors ${
                isActive(l.to, l.end)
                  ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                  : 'text-muted-foreground hover:bg-secondary/50 border-l-2 border-transparent'
              }`}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg italic text-foreground">MirrorAI</span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Admin</Badge>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`flex items-center gap-2.5 px-3 py-3 rounded text-sm transition-colors min-h-[44px] ${
                    isActive(l.to, l.end)
                      ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                      : 'text-muted-foreground hover:bg-secondary/50 border-l-2 border-transparent'
                  }`}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="p-3 border-t border-border">
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-muted-foreground w-full px-3 py-3 min-h-[44px]">
                <LogOut className="h-4 w-4" /> Log Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {maintenance && (
          <div className="bg-destructive text-destructive-foreground text-center text-xs py-1.5 font-medium">
            ⚠️ Maintenance mode is active
          </div>
        )}

        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            <h2 className="font-serif text-base sm:text-lg font-semibold text-foreground">{currentPage.label}</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">{counts.photographers} Photographers</Badge>
            <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">{counts.events} Events</Badge>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hidden md:flex" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Log Out
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
