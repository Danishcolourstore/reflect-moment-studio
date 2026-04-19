import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import {
  Crown, Users, Camera, BookOpen, Settings, BarChart3, LogOut, Shield,
  Home, Layout, HardDrive, DollarSign, Mail, Activity, Grid3X3, Images,
  LayoutDashboard, Code, Bot, type LucideIcon,
} from 'lucide-react';
import { SUPER_ADMIN_ROUTES } from '@/config/super-admin-routes';

const playfair = '"Playfair Display", serif';
const mont = '"Montserrat", sans-serif';

const iconMap: Record<string, LucideIcon> = {
  Home, Code, Bot, LayoutDashboard, Users, Camera, HardDrive, DollarSign,
  BarChart3, Layout, BookOpen, Grid3X3, Images, Shield, Mail, Activity, Settings,
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

  const cream = '#F5F0EA';
  const ink = '#1A1A1A';
  const gold = '#1A1A1A';
  const border = 'rgba(0,0,0,0.06)';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: cream }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          borderRight: `1px solid ${border}`,
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div style={{ padding: '24px 20px 16px', borderBottom: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `linear-gradient(135deg, ${gold}, #D4B896)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Crown style={{ width: 14, height: 14, color: '#FFFFFF' }} />
            </div>
            <div>
              <p style={{ fontFamily: playfair, fontSize: 15, fontWeight: 600, color: ink, margin: 0 }}>
                Super Admin
              </p>
              <p style={{
                fontFamily: mont, fontSize: 8, fontWeight: 600, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: gold, margin: 0,
              }}>
                Full Control
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 4,
                textDecoration: 'none',
                fontFamily: mont,
                fontSize: 12,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? ink : 'rgba(26,26,26,0.45)',
                background: isActive ? 'rgba(200,169,126,0.08)' : 'transparent',
                borderLeft: isActive ? `2px solid ${gold}` : '2px solid transparent',
                transition: 'all 0.2s',
                marginBottom: 1,
              })}
            >
              <item.Icon style={{ width: 15, height: 15 }} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '8px', borderTop: `1px solid ${border}` }}>
          <button
            onClick={() => navigate('/admin')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '9px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
              background: 'transparent', fontFamily: mont, fontSize: 12, color: 'rgba(26,26,26,0.45)',
            }}
          >
            <Shield style={{ width: 15, height: 15 }} /> Admin Panel
          </button>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '9px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
              background: 'transparent', fontFamily: mont, fontSize: 12, color: '#C0392B',
            }}
          >
            <LogOut style={{ width: 15, height: 15 }} /> Sign Out
          </button>
        </div>

        <div style={{ padding: '12px 16px', borderTop: `1px solid ${border}` }}>
          <p style={{ fontFamily: mont, fontSize: 10, color: 'rgba(26,26,26,0.3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </p>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', background: cream }}>
        <Outlet />
      </main>
    </div>
  );
}
