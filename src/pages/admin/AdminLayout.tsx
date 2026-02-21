import { useEffect, useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Users, Calendar, LogOut, Menu, X } from 'lucide-react';

export default function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }

    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAuthorized(true);
        } else {
          navigate('/dashboard');
        }
        setChecking(false);
      });
  }, [user, loading, navigate]);

  if (checking || !authorized) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
        <p className="text-sm text-muted-foreground/50 uppercase tracking-widest">Checking access…</p>
      </div>
    );
  }

  const links = [
    { to: '/admin', label: 'Overview', icon: BarChart3 },
    { to: '/admin/photographers', label: 'Photographers', icon: Users },
    { to: '/admin/events', label: 'Events', icon: Calendar },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 border-r border-border bg-card flex-col shrink-0">
        <div className="p-5 border-b border-border">
          <h1 className="font-display italic text-[18px] font-medium text-foreground tracking-tight">MirrorAI</h1>
          <div className="w-8 h-[1.5px] bg-primary mt-1.5 mb-1" />
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-[0.12em]">Admin Panel</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded text-[12px] transition-colors ${
                location.pathname === l.to
                  ? 'bg-foreground/5 text-foreground font-medium'
                  : 'text-muted-foreground/60 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground/40 truncate mb-2 px-3">{user?.email}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 rounded text-[12px] text-muted-foreground/60 hover:bg-foreground/5 hover:text-foreground w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-display italic text-[16px] font-medium text-foreground">MirrorAI</h1>
          <p className="text-[8px] text-muted-foreground/40 uppercase tracking-[0.12em]">Admin</p>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-foreground">
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-card pt-16">
          <nav className="p-4 space-y-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] transition-colors ${
                  location.pathname === l.to
                    ? 'bg-foreground/5 text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-foreground/5'
                }`}
              >
                <l.icon className="h-5 w-5" />
                {l.label}
              </Link>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); signOut(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] text-muted-foreground hover:bg-foreground/5 w-full mt-4 border-t border-border pt-4"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </nav>
        </div>
      )}

      <main className="flex-1 p-5 sm:p-8 overflow-auto md:pt-8 pt-20">
        <Outlet />
      </main>
    </div>
  );
}
