import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Users, Palette, Settings, UserCircle, LogOut, Briefcase, BarChart2, Globe, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';

const menuItems = [
  { label: 'Business Suite', icon: Briefcase, route: '/dashboard/business' },
  { label: 'Analytics', icon: BarChart2, route: '/dashboard/analytics' },
  { label: 'Website', icon: Globe, route: '/dashboard/website-builder' },
  { label: 'Storybook', icon: BookOpen, route: '/dashboard/storybook' },
  { label: 'Clients', icon: Users, route: '/dashboard/clients' },
  { label: 'Brand Studio', icon: Palette, route: '/dashboard/branding' },
  { label: 'Settings', icon: Settings, route: '/dashboard/profile' },
  { label: 'Account', icon: UserCircle, route: '/dashboard/billing' },
];

const MorePage = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('mirrorai_access_verified');
    window.location.href = '/login';
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1
          className="text-foreground"
          style={{ fontFamily: 'var(--editorial-heading)', fontSize: '28px', fontWeight: 400, letterSpacing: '-0.3px' }}
        >
          More
        </h1>
      </div>

      <div className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.route)}
            className="w-full flex items-center gap-4 bg-card border border-border rounded px-5 py-4 active:scale-[0.98] transition-all hover:border-primary/30"
          >
            <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center">
              <item.icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
            </div>
            <span className="text-[14px] text-foreground font-medium" style={{ fontFamily: 'var(--editorial-body)' }}>
              {item.label}
            </span>
          </button>
        ))}

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 bg-card border border-destructive/20 rounded px-5 py-4 active:scale-[0.98] transition-all mt-4"
        >
          <div className="h-10 w-10 rounded bg-destructive/10 flex items-center justify-center">
            <LogOut className="h-5 w-5 text-destructive" strokeWidth={1.5} />
          </div>
          <span className="text-[14px] text-destructive font-medium" style={{ fontFamily: 'var(--editorial-body)' }}>
            Logout
          </span>
        </button>
      </div>
    </DashboardLayout>
  );
};

export default MorePage;
