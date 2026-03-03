import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole } from './AdminGate';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  LayoutDashboard, Users, Camera, HardDrive, DollarSign,
  Mail, Activity, Settings, LogOut, Shield, UserCog, Menu, X,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminRole, isSuperAdmin } = useAdminRole();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [counts, setCounts] = useState({ photographers: 0, events: 0 });

  const navLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ...(isSuperAdmin ? [{ to: '/admin/users', label: 'User Management', icon: UserCog, end: false }] : []),
    { to: '/admin/photographers', label: 'Photographers', icon: Users, end: false },
    { to: '/admin/events', label: 'Events', icon: Camera, end: false },
    { to: '/admin/storage', label: 'Storage', icon: HardDrive, end: false },
    { to: '/admin/revenue', label: 'Revenue', icon: DollarSign, end: false },
    { to: '/admin/emails', label: 'Bulk Email', icon: Mail, end: false },
    { to: '/admin/activity', label: 'Activity Log', icon: Activity, end: false },
    { to: '/admin/settings', label: 'Settings', icon: Settings, end: false },
  ];

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

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const currentPage = navLinks.find(l =>
    l.end ? location.pathname === l.to : location.pathname.startsWith(l.to) && l.to !== '/admin'
  ) || navLinks[0];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const roleBadgeStyle = isSuperAdmin
    ? { background: 'linear-gradient(135deg, #D4A855, #B8902E)', color: '#1a1000', fontSize: '9px', padding: '2px 8px', borderRadius: '100px', fontFamily: 'Jost, sans-serif', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const }
    : { background: 'var(--accent)', color: 'var(--bg-primary)', fontSize: '9px', padding: '2px 8px', borderRadius: '100px', fontFamily: 'Jost, sans-serif', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const };

  const sidebarContent = (
    <>
      <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <Shield className="h-5 w-5" style={{ color: isSuperAdmin ? '#D4A855' : 'var(--accent)' }} />
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontStyle: 'italic', color: 'var(--text-primary)' }}>MirrorAI</span>
        <span style={roleBadgeStyle}>{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-auto">
        {navLinks.map((l) => {
          const active = isActive(l.to, l.end);
          return (
            <Link
              key={l.to}
              to={l.to}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded transition-colors min-h-[44px]"
              style={{
                fontSize: '13px',
                fontFamily: 'Jost, sans-serif',
                background: active ? 'var(--accent-light)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: active ? 500 : 400,
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              <l.icon className="h-4 w-4 shrink-0" />
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded transition-colors min-h-[44px]"
          style={{ fontSize: '12px', fontFamily: 'Jost, sans-serif', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-60 flex flex-col shrink-0 sticky top-0 h-screen" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
          {sidebarContent}
        </aside>
      )}

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[280px] p-0 flex flex-col" style={{ background: 'var(--bg-secondary)' }}>
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-20" style={{ borderBottom: '1px solid var(--border)', background: 'var(--card-bg)' }}>
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center"
                style={{ color: 'var(--text-primary)', background: 'transparent', border: 'none' }}
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <h2 className="truncate" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: isMobile ? '16px' : '20px', fontWeight: 400, color: 'var(--text-primary)' }}>{currentPage.label}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline" style={{ fontSize: '10px', fontFamily: 'Jost, sans-serif', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>{counts.photographers} Photographers · {counts.events} Events</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
