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
    <div className="min-h-screen bg-transparent">
      {/* Minimal top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-lg bg-transparent/95">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <button onClick={() => navigate('/client')} className="focus:outline-none">
              <span
                className="text-[13px] tracking-[0.35em] uppercase font-serif text-ink font-light"
              >
                Mirror AI
              </span>
            </button>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('/client/profile')}
                className="p-2 text-ink/60 hover:text-ink transition-colors"
              >
                <Settings className="h-[18px] w-[18px]" />
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 text-ink/60 hover:text-ink transition-colors"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </div>
        <div className="h-px bg-ink/10" />
      </header>

      {/* Main content */}
      <main>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around py-2 lg:hidden safe-area-pb"
        style={{ background: 'rgba(255,255,255,0.97)', borderTop: '1px solid var(--ink-10)', backdropFilter: 'blur(12px)' }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.end}
            className="flex flex-col items-center gap-0.5 px-3 py-1"
            activeClassName="[&>span]:text-gold [&>svg]:text-gold"
          >
            <item.icon className="h-[18px] w-[18px] text-ink/50" />
            <span className="text-[9px] tracking-[0.1em] uppercase text-ink/50 font-sans">
              {item.title}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <footer className="pb-24 lg:pb-12 pt-16">
        <div className="text-center space-y-2">
          <p className="font-sans text-xs text-ink/30 tracking-widest">
            Delivered with love
          </p>
          <p
            className="font-serif text-xs text-ink/20 tracking-[0.3em] uppercase"
          >
            Mirror AI
          </p>
        </div>
      </footer>
    </div>
  );
}
