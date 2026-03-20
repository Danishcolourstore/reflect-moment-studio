import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { DrawerMenu, useDrawerMenu } from '@/components/GlobalDrawerMenu';
import hero1 from '@/assets/hero-1.jpg';
import hero2 from '@/assets/hero-2.jpg';
import hero3 from '@/assets/hero-3.jpg';
import hero4 from '@/assets/hero-4.jpg';
import hero5 from '@/assets/hero-5.jpg';
import hero6 from '@/assets/hero-6.jpg';
import hero7 from '@/assets/hero-7.jpg';
import hero8 from '@/assets/hero-8.jpg';
import hero9 from '@/assets/hero-9.jpg';

const ease = [0.4, 0, 0.2, 1];
const SLIDES = [hero1, hero2, hero3, hero4, hero5, hero6, hero7, hero8, hero9];
const SLIDE_DURATION = 12000; // 12s per slide
const FADE_DURATION = 4; // 4s ultra-smooth dissolve

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
    const interval = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), SLIDE_DURATION);
    return () => clearInterval(interval);
  }, [phase]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="h-[100dvh] w-screen overflow-hidden relative bg-black">
      {/* Film grain */}
      <svg className="pointer-events-none fixed inset-0 w-full h-full z-[200]" style={{ opacity: 0.03 }}>
        <filter id="ig-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ig-grain)" />
      </svg>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />

      {/* INTRO overlay */}
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

      {/* RI monogram intro */}
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

      {/* PHASE 3 — Full experience */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 3 ? 1 : 0 }}
        transition={{ duration: 1.2, ease }}
      >
        {/* Pure smooth dissolve slideshow */}
        {SLIDES.map((url, i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: current === i ? 1 : 0 }}
            transition={{ duration: FADE_DURATION, ease: [0.4, 0, 0.2, 1] }}
          >
            <img
              src={url}
              alt=""
              loading={i <= 1 ? 'eager' : 'lazy'}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </motion.div>
        ))}

        {/* Dark gradient */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.45) 100%)',
          }}
        />

        {/* TOP BAR */}
        <div
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between"
          style={{ height: 56, padding: '0 20px', paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <motion.button
            onClick={drawer.toggle}
            className="cursor-pointer select-none uppercase"
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              color: '#F0EDE8',
              letterSpacing: '0.3em',
              background: 'none',
              border: 'none',
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
              fontFamily: 'Cinzel, serif',
              fontSize: 20,
              fontWeight: 600,
              color: '#F5C518',
              letterSpacing: '0.3em',
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

        {/* Amber pulse dot */}
        <motion.div
          className="fixed z-[100]"
          style={{ top: 8, right: 8, width: 5, height: 5, borderRadius: '50%', background: '#E8C97A' }}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Counter */}
        <motion.div
          className="absolute z-[100]"
          style={{ bottom: 28, right: 20, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6, ease }}
        >
          <span
            className="select-none"
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 9,
              color: 'rgba(240,237,232,0.28)',
              letterSpacing: '0.2em',
            }}
          >
            {pad(current + 1)} / {pad(SLIDES.length)}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
