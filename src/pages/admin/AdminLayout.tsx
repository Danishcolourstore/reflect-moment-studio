import { useEffect, useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Users, Calendar, LogOut } from 'lucide-react';

export default function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) {
      console.log('[AdminLayout] Auth still loading, waiting...');
      return;
    }
    if (!user) {
      console.log('[AdminLayout] No user, redirecting to /login');
      navigate('/login');
      return;
    }

    console.log('[AdminLayout] Checking admin role for user:', user.id, user.email);

    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .then(({ data, error }) => {
        console.log('[AdminLayout] user_roles query result:', { data, error });
        if (data && data.length > 0) {
          console.log('[AdminLayout] Admin role confirmed');
          setAuthorized(true);
        } else {
          console.log('[AdminLayout] No admin role found, redirecting to /dashboard');
          navigate('/dashboard');
        }
        setChecking(false);
      });
  }, [user, loading, navigate]);

  if (checking || !authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </div>
    );
  }

  const links = [
    { to: '/admin', label: 'Overview', icon: BarChart3 },
    { to: '/admin/photographers', label: 'Photographers', icon: Users },
    { to: '/admin/events', label: 'Events', icon: Calendar },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h1 className="text-sm font-bold tracking-tight">Admin Panel</h1>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-2 px-3 py-2 rounded text-[13px] transition-colors ${
                location.pathname === l.to
                  ? 'bg-secondary text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-secondary/50'
              }`}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-border">
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 rounded text-[13px] text-muted-foreground hover:bg-secondary/50 w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
