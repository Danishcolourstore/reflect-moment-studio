import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Camera, Globe, LayoutGrid, Menu as MenuIcon } from 'lucide-react';
import { DrawerMenu, useDrawerMenu } from '@/components/GlobalDrawerMenu';
import { NavLink } from '@/components/NavLink';
const ease = [0.4, 0, 0.2, 1];

const GRADIENTS = [
  'radial-gradient(ellipse at 30% 50%, #1a1510 0%, #0a0a0a 70%)',
  'radial-gradient(ellipse at 70% 40%, #1c1412 0%, #0a0a0a 70%)',
  'radial-gradient(ellipse at 50% 60%, #14130f 0%, #0a0a0a 70%)',
  'radial-gradient(ellipse at 40% 30%, #181410 0%, #0a0a0a 70%)',
  'radial-gradient(ellipse at 60% 70%, #1a1612 0%, #0a0a0a 70%)',
  'radial-gradient(ellipse at 50% 40%, #161210 0%, #0a0a0a 70%)',
];
const SLIDE_DURATION = 12000;
const FADE_DURATION = 4;

const LINES: string[] = [];

export default function IntelligenceHome() {
  const navigate = useNavigate();
  const drawer = useDrawerMenu();
  const [phase, setPhase] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1600);
    const t3 = setTimeout(() => setPhase(3), 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (phase < 3) return;
    const interval = setInterval(() => setCurrent(c => (c + 1) % LINES.length), SLIDE_DURATION);
    return () => clearInterval(interval);
  }, [phase]);


  return (
    <div className="h-[100dvh] w-screen overflow-hidden relative bg-black">
      <svg className="pointer-events-none fixed inset-0 w-full h-full z-[200]" style={{ opacity: 0.03 }}>
        <filter id="ig-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ig-grain)" />
      </svg>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />

      <AnimatePresence>
        {phase < 3 && (
          <motion.div
            key="intro-bg"
            className="absolute inset-0 z-[300] bg-black"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease }}
          />
        )}
      </AnimatePresence>

      {phase >= 1 && phase < 3 && (
        <motion.span
          className="fixed select-none z-[301]"
          style={{ fontFamily: 'Cinzel, serif', color: '#F5C518' }}
          initial={{
            top: '50%', left: '50%', x: '-50%', y: '-50%',
            fontSize: 48, opacity: 0,
            textShadow: '0 0 24px rgba(245,197,24,0.8)',
            letterSpacing: '0.3em',
          }}
          animate={phase === 1
            ? { opacity: 1 }
            : { top: 28, left: '50%', y: '-50%', fontSize: 20, opacity: 1 }
          }
          transition={{ duration: phase === 1 ? 0.6 : 0.7, ease }}
        >
          RI
        </motion.span>
      )}

      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 3 ? 1 : 0 }}
        transition={{ duration: 1.2, ease }}
      >
        <img
          src="/images/home-hero.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.10) 40%, rgba(0,0,0,0.55) 100%)',
          }}
        />


        <div
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between"
          style={{ height: 56, padding: '0 20px', paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <motion.button
            onClick={drawer.toggle}
            className="cursor-pointer select-none uppercase"
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11, color: '#F0EDE8',
              letterSpacing: '0.3em', background: 'none', border: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease }}
          >
            Menu
          </motion.button>

          <motion.span
            className="select-none"
            style={{
              fontFamily: 'Cinzel, serif', fontSize: 20, fontWeight: 600,
              color: '#F5C518', letterSpacing: '0.3em',
              textShadow: '0 0 24px rgba(245,197,24,0.8)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease }}
          >
            RI
          </motion.span>

          <motion.button
            onClick={() => navigate('/dashboard')}
            className="cursor-pointer"
            style={{ background: 'none', border: 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6, ease }}
          >
            <BookOpen size={18} color="rgba(240,237,232,0.55)" />
          </motion.button>
        </div>

        <motion.div
          className="fixed z-[100]"
          style={{ top: 8, right: 8, width: 5, height: 5, borderRadius: '50%', background: '#E8C97A' }}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />


        {/* Bottom Tab Bar */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-[100] flex items-stretch border-t border-white/[0.06]"
          style={{
            height: 56,
            background: 'rgba(10,10,10,0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {[
            { title: 'Home', url: '/home', icon: LayoutGrid, end: true },
            { title: 'Events', url: '/dashboard/events', icon: Camera },
            { title: 'Albums', url: '/dashboard/album-designer', icon: BookOpen },
            { title: 'Website', url: '/dashboard/website-editor', icon: Globe },
          ].map((item) => (
            <NavLink key={item.url} to={item.url} end={item.end}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px]"
              activeClassName="[&>svg]:text-[#C8A97E] [&>span]:text-[#C8A97E]"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              <item.icon className="h-[22px] w-[22px] transition-colors" strokeWidth={1.6} />
              <span className="text-[10px] font-medium tracking-wide transition-colors">{item.title}</span>
            </NavLink>
          ))}
          <button
            onClick={drawer.toggle}
            className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px]"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            <MenuIcon className="h-[22px] w-[22px]" strokeWidth={1.6} />
            <span className="text-[10px] font-medium tracking-wide">More</span>
          </button>
        </nav>
      </motion.div>
    </div>
  );
}