import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import {
  Crown, Users, Camera, BookOpen, Settings, BarChart3,
  LogOut, Shield, Home,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/super-admin', icon: Home, label: 'Overview', end: true },
  { to: '/super-admin/users', icon: Users, label: 'Users' },
  { to: '/super-admin/mirrorai', icon: Camera, label: 'MirrorAI' },
  { to: '/super-admin/storybooks', icon: BookOpen, label: 'Storybooks' },
  { to: '/super-admin/settings', icon: Settings, label: 'Settings' },
];

export default function SuperAdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    sessionStorage.removeItem('mirrorai_access_verified');
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border bg-card/50 flex flex-col sticky top-0 h-screen">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Crown className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground font-serif">Super Admin</p>
              <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[8px] px-1.5 py-0 uppercase tracking-widest font-semibold">
                Full Control
              </Badge>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-amber-500/10 text-amber-500 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-border space-y-0.5">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 w-full"
          >
            <Shield className="h-4 w-4" />
            Admin Panel
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        <div className="p-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
