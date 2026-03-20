import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

const ease = [0.16, 1, 0.3, 1] as const;

const PRODUCTS = [
  { label: 'Mirror RI', path: '/dashboard' },
  { label: 'Colour Store RI', path: '/colour-store' },
];

const FEATURES = [
  { label: 'Reflections', path: '/dashboard/reflections' },
  { label: 'Events', path: '/dashboard/events' },
  { label: 'Albums', path: '/dashboard/album-designer' },
  { label: 'Grid Builder', path: '/dashboard/storybook' },
  { label: 'Website Builder', path: '/dashboard/website-editor' },
  { label: 'Analytics', path: '/dashboard/analytics' },
  { label: 'Storybook', path: '/dashboard/storybook' },
];

const ALL_ITEMS = [...PRODUCTS, 'divider' as const, ...FEATURES];

const PAGE_NAMES: Record<string, string> = {
  '/home': 'Intelligence Home',
  '/dashboard': 'Mirror RI',
  '/colour-store': 'Colour Store RI',
  '/dashboard/events': 'Events',
  '/dashboard/album-designer': 'Albums',
  '/dashboard/storybook': 'Grid Builder',
  '/dashboard/website-editor': 'Website Builder',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/reflections': 'Reflections',
  '/dashboard/clients': 'Clients',
  '/dashboard/profile': 'Profile',
  '/dashboard/notifications': 'Notifications',
};

export function useDrawerMenu() {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen(o => !o), []);
  const close = useCallback(() => setOpen(false), []);
  return { open, toggle, close, setOpen };
}

export function HamburgerButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col justify-center items-start gap-[5px] p-4 cursor-pointer z-50"
      aria-label="Menu"
    >
      <span className="block h-[1.5px] w-5 transition-all duration-300" style={{ background: '#F0EDE8' }} />
      <motion.span
        className="block h-[1.5px] w-5"
        style={{ background: '#F0EDE8' }}
        animate={{ x: hovered ? 4 : 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
      <span className="block h-[1.5px] w-5 transition-all duration-300" style={{ background: '#F0EDE8' }} />
    </button>
  );
}

export function DrawerMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [studioName, setStudioName] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    (supabase.from('profiles').select('studio_name') as any)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.studio_name) setStudioName(data.studio_name);
      });
  }, [user]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const currentPage = PAGE_NAMES[location.pathname] || 'Mirror RI';

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate('/login');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[9998]"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            className="fixed top-0 left-0 z-[9999] h-[100dvh] w-[85%] max-w-[340px] overflow-y-auto"
            style={{ background: '#080808', borderRight: '1px solid rgba(240,237,232,0.04)' }}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.5, ease }}
          >
            {/* Film grain */}
            <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.025]">
              <svg width="100%" height="100%">
                <filter id="drawer-grain">
                  <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch" />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#drawer-grain)" />
              </svg>
            </div>

            <div className="relative z-20 p-8 flex flex-col min-h-full">
              {/* Top row */}
              <div className="flex items-center justify-between">
                <span
                  className="text-[13px] italic"
                  style={{ fontFamily: '"Cormorant Garamond", serif', color: '#E8C97A' }}
                >
                  RI
                </span>
                <button
                  onClick={onClose}
                  className="text-[20px] transition-colors duration-200"
                  style={{ color: '#3A3A3A' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#F0EDE8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#3A3A3A')}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Current location tag */}
              <div className="mt-8">
                <span
                  className="inline-block px-3 py-1 rounded-full text-[9px] uppercase tracking-[0.2em]"
                  style={{
                    background: '#111111',
                    border: '1px solid rgba(240,237,232,0.06)',
                    color: '#3A3A3A',
                    fontFamily: '"DM Sans", sans-serif',
                  }}
                >
                  {currentPage}
                </span>
              </div>

              {/* Nav items */}
              <nav className="mt-10 flex-1">
                {ALL_ITEMS.map((item, i) => {
                  if (item === 'divider') {
                    return (
                      <motion.div
                        key="divider"
                        className="my-4 h-px"
                        style={{ background: 'rgba(240,237,232,0.04)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 + i * 0.05, duration: 0.4 }}
                      />
                    );
                  }
                  return (
                    <motion.button
                      key={item.path}
                      className="group flex items-center justify-between w-full py-2 text-left transition-all duration-250"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.05, duration: 0.4, ease }}
                      onClick={() => handleNav(item.path)}
                      style={{ fontFamily: '"Cormorant Garamond", serif' }}
                    >
                      <span
                        className="text-[28px] md:text-[32px] font-light transition-colors duration-250 group-hover:translate-x-1.5 transform"
                        style={{ color: '#F0EDE8', letterSpacing: '0.01em' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#E8C97A')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#F0EDE8')}
                      >
                        {item.label}
                      </span>
                      <span
                        className="text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-250"
                        style={{ color: 'rgba(232,201,122,0.5)' }}
                      >
                        →
                      </span>
                    </motion.button>
                  );
                })}
              </nav>

              {/* Bottom */}
              <div className="mt-auto pt-8">
                {studioName && (
                  <p className="text-[11px] mb-1" style={{ fontFamily: '"DM Sans", sans-serif', color: '#F0EDE8' }}>
                    {studioName}
                  </p>
                )}
                <div className="flex items-center gap-1.5" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                  <button
                    onClick={() => handleNav('/dashboard/profile')}
                    className="text-[10px] transition-colors duration-200 hover:text-[#F0EDE8]"
                    style={{ color: '#3A3A3A' }}
                  >
                    Settings
                  </button>
                  <span className="text-[10px]" style={{ color: '#3A3A3A' }}>·</span>
                  <button
                    onClick={handleSignOut}
                    className="text-[10px] transition-colors duration-200 hover:text-[#F0EDE8]"
                    style={{ color: '#3A3A3A' }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
