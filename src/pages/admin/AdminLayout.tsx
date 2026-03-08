import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard, Users, Camera, HardDrive, DollarSign,
  Mail, Activity, Settings, LogOut,
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border bg-card flex flex-col shrink-0">
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

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Maintenance banner */}
        {maintenance && (
          <div className="bg-destructive text-destructive-foreground text-center text-xs py-1.5 font-medium">
            ⚠️ Maintenance mode is active
          </div>
        )}

        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
          <h2 className="font-serif text-lg font-semibold text-foreground">{currentPage.label}</h2>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px]">{counts.photographers} Photographers</Badge>
            <Badge variant="outline" className="text-[10px]">{counts.events} Events</Badge>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Log Out
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
