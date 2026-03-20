import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DrawerMenu, useDrawerMenu } from '@/components/GlobalDrawerMenu';
import hero1 from '@/assets/hero-1.jpg';
import hero2 from '@/assets/hero-2.jpg';
import hero3 from '@/assets/hero-3.jpg';
import hero4 from '@/assets/hero-4.jpg';
import hero5 from '@/assets/hero-5.jpg';
import hero6 from '@/assets/hero-6.jpg';

const ease = [0.16, 1, 0.3, 1];

const SLIDES = [hero1, hero2, hero3, hero4, hero5, hero6];

const LINES = [
  'Mirror never lies.',
  'Not realtime.\n2 seconds late.',
  'We are not\nartificially intelligent.',
  'Real Intelligence.\nExperience.',
  'Art and technology.\nSmooched.',
  'Hugged. Cuddled.\nWild.',
];

export default function IntelligenceHome() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const drawer = useDrawerMenu();
  const [phase, setPhase] = useState(0); // 0=black, 1=ri-center, 2=ri-moving, 3=ready
  const [current, setCurrent] = useState(0);

  // Intro timeline
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1600);
    const t3 = setTimeout(() => setPhase(3), 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Photo rotation
  useEffect(() => {
    if (phase < 3) return;
    const interval = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 4000);
    return () => clearInterval(interval);
  }, [phase]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="h-[100dvh] w-screen overflow-hidden relative" style={{ background: '#000' }}>
      {/* Film grain — always on top */}
      <svg className="pointer-events-none fixed inset-0 w-full h-full z-[200]" style={{ opacity: 0.035 }}>
        <filter id="ig-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ig-grain)" />
      </svg>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />

      {/* INTRO — RI center then moves up */}
      <AnimatePresence>
        {phase < 3 && (
          <motion.div
            key="intro-bg"
            className="absolute inset-0 z-[300]"
            style={{ background: '#000' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease }}
          />
        )}
      </AnimatePresence>

      {/* RI monogram — animated from center to top */}
      {phase >= 1 && phase < 3 && (
        <motion.span
          className="fixed italic select-none z-[301]"
          style={{ fontFamily: '"Cormorant Garamond", serif', color: '#F5C518' }}
          initial={{
            top: '50%', left: '50%', x: '-50%', y: '-50%',
            fontSize: 48, opacity: 0,
            textShadow: '0 0 24px rgba(245,197,24,0.8)',
            letterSpacing: '0.25em',
          }}
          animate={phase === 1
            ? { opacity: 1 }
            : {
              top: 28, left: '50%', y: '-50%',
              fontSize: 22,
              opacity: 1,
            }
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
        {/* Rotating photos */}
        {SLIDES.map((url, i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            animate={{ opacity: current === i ? 1 : 0 }}
            transition={{ duration: 1.2, ease }}
          >
            <img
              src={`${url}?w=1200&q=80`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </motion.div>
        ))}

        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.55) 100%)',
          }}
        />

        {/* TOP BAR */}
        <div
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between"
          style={{ height: 56, padding: '0 24px' }}
        >
          {/* MENU */}
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

          {/* RI center */}
          <motion.span
            className="italic select-none"
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 22,
              fontWeight: 400,
              color: '#F5C518',
              letterSpacing: '0.25em',
              textShadow: '0 0 24px rgba(245,197,24,0.8)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease }}
          >
            RI
          </motion.span>

          {/* BookOpen */}
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

        {/* Amber pulse dot — top right corner */}
        <motion.div
          className="fixed z-[100]"
          style={{ top: 8, right: 8, width: 5, height: 5, borderRadius: '50%', background: '#E8C97A' }}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* CENTER TEXT */}
        <div
          className="absolute z-[50] text-center"
          style={{
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '78%',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={current}
              className="select-none whitespace-pre-line"
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: isMobile ? 44 : 60,
                fontWeight: 300,
                color: '#F0EDE8',
                lineHeight: 1.25,
                letterSpacing: '0.02em',
                textShadow: '0 2px 35px rgba(0,0,0,0.65)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                enter: { duration: 0.9, delay: 0.3, ease: 'easeInOut' },
                exit: { duration: 0.5, ease: 'easeInOut' },
                duration: 0.9,
                ease: 'easeInOut',
              }}
            >
              {LINES[current]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* BOTTOM RIGHT — counter */}
        <motion.div
          className="absolute z-[100]"
          style={{ bottom: 28, right: 24 }}
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
