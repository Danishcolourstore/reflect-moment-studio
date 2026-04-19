import { ReactNode, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard, Camera, Heart, Download, User,
  LogOut, Share2, Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { title: 'Gallery', url: '/client', icon: LayoutDashboard, end: true },
  { title: 'Events', url: '/client/events', icon: Camera },
  { title: 'Favorites', url: '/client/favorites', icon: Heart },
  { title: 'Downloads', url: '/client/downloads', icon: Download },
];

export function ClientDashboardLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    if (!user) return;
    (supabase.from('clients').select('name') as any)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) setClientName(data.name);
      });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      {/* Minimal top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-lg" style={{ background: 'rgba(255,255,255,0.95)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <button onClick={() => navigate('/client')} className="focus:outline-none">
              <span
                className="text-[13px] tracking-[0.35em] uppercase"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1A1A1A', fontWeight: 500 }}
              >
                Mirror AI
              </span>
            </button>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('/client/profile')}
                className="p-2 rounded-full transition-colors"
                style={{ color: '#999' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#1A1A1A')}
                onMouseLeave={e => (e.currentTarget.style.color = '#999')}
              >
                <Settings className="h-[18px] w-[18px]" />
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-full transition-colors"
                style={{ color: '#999' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#1A1A1A')}
                onMouseLeave={e => (e.currentTarget.style.color = '#999')}
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: '#F0EDE8' }} />
      </header>

      {/* Main content */}
      <main>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around py-2 lg:hidden safe-area-pb"
        style={{ background: 'rgba(255,255,255,0.97)', borderTop: '1px solid #F0EDE8', backdropFilter: 'blur(12px)' }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.end}
            className="flex flex-col items-center gap-0.5 px-3 py-1"
            activeClassName="[&>span]:text-[#1A1A1A] [&>svg]:text-[#1A1A1A]"
          >
            <item.icon className="h-[18px] w-[18px]" style={{ color: '#AAAAAA' }} />
            <span className="text-[9px] tracking-[0.1em] uppercase" style={{ color: '#AAAAAA', fontFamily: "'DM Sans', sans-serif" }}>
              {item.title}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <footer className="pb-24 lg:pb-12 pt-16">
        <div className="text-center space-y-2">
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#CCCCCC', letterSpacing: '0.08em' }}>
            Delivered with love
          </p>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 10,
              color: '#DDDDDD',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}
          >
            Mirror AI
          </p>
        </div>
      </footer>
    </div>
  );
}
