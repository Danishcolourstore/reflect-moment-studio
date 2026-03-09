import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import {
  Crown,
  Users,
  Camera,
  BookOpen,
  Settings,
  BarChart3,
  LogOut,
  Shield,
  Home,
  Layout,
  HardDrive,
  DollarSign,
  Mail,
  Activity,
  Grid3X3,
  Images,
  LayoutDashboard,
  Code,
  Bot,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RealtimeStatusIndicator } from '@/components/RealtimeStatusIndicator';
import { SUPER_ADMIN_ROUTES } from '@/config/super-admin-routes';

const iconMap: Record<string, LucideIcon> = {
  Home,
  Code,
  Bot,
  LayoutDashboard,
  Users,
  Camera,
  HardDrive,
  DollarSign,
  BarChart3,
  Layout,
  BookOpen,
  Grid3X3,
  Images,
  Shield,
  Mail,
  Activity,
  Settings,
};

export default function SuperAdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const navItems = useMemo(
    () =>
      SUPER_ADMIN_ROUTES.filter((route) => route.nav).map((route) => ({
        to: route.path ? `/super-admin/${route.path}` : '/super-admin',
        label: route.label,
        end: route.end,
        Icon: iconMap[route.icon] ?? Settings,
      })),
    []
  );

  const handleLogout = async () => {
    sessionStorage.removeItem('mirrorai_access_verified');
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-56 border-r border-border bg-card/50 flex flex-col sticky top-0 h-screen">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground font-serif">Super Admin</p>
              <Badge className="bg-primary/15 text-primary border-primary/30 text-[8px] px-1.5 py-0 uppercase tracking-widest font-semibold">
                Full Control
              </Badge>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )
              }
            >
              <item.Icon className="h-4 w-4" />
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

        <div className="p-3 border-t border-border space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            <RealtimeStatusIndicator showLabel={false} />
          </div>
          <RealtimeStatusIndicator showLabel className="justify-center" />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
