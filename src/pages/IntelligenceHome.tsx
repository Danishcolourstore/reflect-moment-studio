import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { DrawerMenu, useDrawerMenu } from '@/components/GlobalDrawerMenu';
import hero1 from '@/assets/hero-1.jpg';
import hero2 from '@/assets/hero-2.png';
import hero3 from '@/assets/hero-3.jpg';
import hero4 from '@/assets/hero-4.jpg';
import hero5 from '@/assets/hero-5.jpg';
import hero6 from '@/assets/hero-6.webp';

const ease = [0.16, 1, 0.3, 1];

const POETRY = [
  'Every frame.\nA memory that stays.',
  'Not just photographs.\nProof that it happened.',
  'The light. The moment.\nThe people who were there.',
  'Some things deserve\nto be remembered perfectly.',
  'Your work lives here.\nQuietly. Forever.',
];

const SLIDES = [
  { img: hero1 },
  { img: hero2 },
  { img: hero3 },
  { img: hero4 },
  { img: hero5 },
  { img: hero6 },
];

function FilmGrain() {
  return (
    <svg className="pointer-events-none fixed inset-0 w-full h-full z-[200] opacity-[0.03]">
      <filter id="intel-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#intel-grain)" />
    </svg>
  );
}

export default function IntelligenceHome() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const drawer = useDrawerMenu();
  const [phase, setPhase] = useState<1 | 2>(1);
  const [current, setCurrent] = useState(0);
  const poetryIndex = current % POETRY.length;
  useEffect(() => {
    const t = setTimeout(() => setPhase(2), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== 2) return;
    const interval = setInterval(() => {
      setCurrent(c => (c + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [phase]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="h-[100dvh] w-screen overflow-hidden relative" style={{ background: '#000' }}>
      <FilmGrain />
      <DrawerMenu open={drawer.open} onClose={drawer.close} />

      <AnimatePresence mode="wait">
        {phase === 1 && (
          <motion.div
            key="intro"
            className="absolute inset-0 z-[300] flex items-center justify-center"
            style={{ background: '#000' }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease }}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease }}
              className="italic select-none"
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: 48,
                color: '#E8C97A',
                letterSpacing: '0.3em',
              }}
            >
              RI
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 2 — Hero */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 2 ? 1 : 0 }}
        transition={{ duration: 1.2, ease }}
      >
        {/* Rotating background images */}
        {SLIDES.map((slide, i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            animate={{ opacity: current === i ? 1 : 0 }}
            transition={{ duration: 1.2, ease }}
          >
            <img
              src={slide.img}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </motion.div>
        ))}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.75) 100%)',
          }}
        />

        {/* Top bar */}
        <div
          className="absolute top-0 left-0 right-0 z-[100] flex items-center justify-between"
          style={{ height: 56, padding: isMobile ? '0 20px' : '0 28px' }}
        >
          <button
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
          >
            Menu
          </button>

          <span
            className="italic select-none"
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 18,
              color: '#E8C97A',
              letterSpacing: '0.2em',
            }}
          >
            RI
          </span>

          <motion.div
            className="rounded-full"
            style={{ width: 5, height: 5, background: '#E8C97A' }}
            animate={{
              opacity: [0.5, 1, 0.5],
              boxShadow: [
                '0 0 4px 1px rgba(232,201,122,0.2)',
                '0 0 8px 2px rgba(232,201,122,0.5)',
                '0 0 4px 1px rgba(232,201,122,0.2)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Bottom gradient for text readability */}
        <div
          className="absolute bottom-0 left-0 right-0 z-[50] pointer-events-none"
          style={{ height: '60%', background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 100%)' }}
        />

        {/* Editorial poetry overlay — bottom left */}
        <div
          className="absolute bottom-0 left-0 z-[100]"
          style={{ padding: isMobile ? '32px 24px' : '40px 32px' }}
        >
          {/* Poetry text — crossfades with photos */}
          <div className="relative" style={{ minHeight: isMobile ? 90 : 100 }}>
            <AnimatePresence mode="wait">
              <motion.p
                key={poetryIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.8, ease }}
                className="absolute select-none whitespace-pre-line"
                style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: 32,
                  fontWeight: 300,
                  color: '#F0EDE8',
                  lineHeight: 1.2,
                  letterSpacing: '0.01em',
                }}
              >
                {POETRY[poetryIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Amber line */}
          <div style={{ width: 32, height: 1, background: '#E8C97A', marginTop: 16 }} />

          {/* Mirror RI label */}
          <p
            className="uppercase select-none"
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 9,
              color: 'rgba(232,201,122,0.5)',
              letterSpacing: '0.3em',
              marginTop: 12,
            }}
          >
            Mirror RI
          </p>

          {/* CTA Button */}
          <div className="mt-5">
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ borderColor: 'rgba(232,201,122,0.5)' }}
              onClick={() => navigate('/colour-store')}
              className="cursor-pointer uppercase select-none"
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                color: '#E8C97A',
                background: 'rgba(232,201,122,0.08)',
                border: '1px solid rgba(232,201,122,0.25)',
                borderRadius: 100,
                padding: '12px 24px',
                letterSpacing: '0.15em',
              }}
            >
              Colour Store RI
            </motion.button>
          </div>
        </div>

        {/* Bottom right — image counter */}
        <div
          className="absolute bottom-0 right-0 z-[100]"
          style={{ padding: isMobile ? '32px 24px' : '40px 32px' }}
        >
          <span
            className="select-none"
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 9,
              color: 'rgba(240,237,232,0.3)',
              letterSpacing: '0.2em',
            }}
          >
            {pad(current + 1)} / {pad(SLIDES.length)}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
