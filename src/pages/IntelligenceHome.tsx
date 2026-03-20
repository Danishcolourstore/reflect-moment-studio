import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { HamburgerButton, DrawerMenu, useDrawerMenu } from '@/components/GlobalDrawerMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const ease = [0.16, 1, 0.3, 1];

function FloatingOrbs({ color, fast = false }: { color: string; fast?: boolean }) {
  const baseSpeed = fast ? 7 : 10;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${280 + i * 100}px`,
            height: `${280 + i * 100}px`,
            background: `radial-gradient(circle, ${color}, transparent 70%)`,
            left: `${10 + i * 35}%`,
            top: `${25 + i * 25}%`,
          }}
          animate={{
            x: [0, 25 - i * 20, -15 + i * 10, 0],
            y: [0, -18 + i * 14, 20 - i * 8, 0],
            scale: [1, 1.06, 0.96, 1],
          }}
          transition={{
            duration: baseSpeed + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function FilmGrain() {
  return (
    <svg className="pointer-events-none fixed inset-0 w-full h-full z-50 opacity-[0.025]">
      <filter id="home-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#home-grain)" />
    </svg>
  );
}

export default function IntelligenceHome() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [hoverLeft, setHoverLeft] = useState(false);
  const [hoverRight, setHoverRight] = useState(false);
  const drawer = useDrawerMenu();

  return (
    <div className="h-[100dvh] overflow-hidden relative flex flex-col" style={{ background: '#080808' }}>
      <FilmGrain />
      <DrawerMenu open={drawer.open} onClose={drawer.close} />

      {/* Top bar — 48px */}
      <motion.div
        className="relative z-10 flex items-center justify-between px-2 shrink-0"
        style={{ height: 48 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <HamburgerButton onClick={drawer.toggle} />

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className="mr-4 rounded-full"
              style={{ width: 5, height: 5, background: '#E8C97A' }}
              animate={{
                opacity: [0.5, 1, 0.5],
                boxShadow: [
                  '0 0 4px 1px rgba(232,201,122,0.2)',
                  '0 0 8px 2px rgba(232,201,122,0.4)',
                  '0 0 4px 1px rgba(232,201,122,0.2)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </TooltipTrigger>
          <TooltipContent side="left" className="text-[10px] bg-[#111] border-[rgba(240,237,232,0.06)]">
            RI · Active
          </TooltipContent>
        </Tooltip>
      </motion.div>

      {/* Cards container */}
      <div className={`flex-1 relative flex ${isMobile ? 'flex-col' : 'flex-row'}`}>
        {/* LEFT — Colour Store RI */}
        <motion.button
          className="relative flex-1 overflow-hidden cursor-pointer text-left focus:outline-none"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease }}
          onClick={() => navigate('/colour-store')}
          onMouseEnter={() => setHoverLeft(true)}
          onMouseLeave={() => setHoverLeft(false)}
        >
          <div
            className="absolute inset-0 transition-all duration-700"
            style={{ background: 'radial-gradient(ellipse at 40% 60%, #1F1608 0%, #080808 70%)' }}
          />
          <FloatingOrbs color="rgba(232,201,122,0.06)" fast={hoverLeft} />

          {/* Bottom glow on hover */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
            animate={{ opacity: hoverLeft ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            style={{ background: 'linear-gradient(to top, rgba(232,201,122,0.05), transparent)' }}
          />

          {/* Hover border */}
          <motion.div
            className="absolute top-0 right-0 bottom-0 w-px pointer-events-none"
            animate={{ opacity: hoverLeft ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            style={{ background: 'rgba(232,201,122,0.1)' }}
          />

          {/* Text block */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 z-10">
            <div className="flex items-end justify-between">
              <div>
                <h2
                  className="text-[32px] md:text-[48px] font-light leading-none"
                  style={{ fontFamily: '"Cormorant Garamond", serif', color: '#F0EDE8', letterSpacing: '0.02em' }}
                >
                  Colour Store
                </h2>
                <p
                  className="text-[32px] md:text-[48px] font-light italic leading-none mt-0.5"
                  style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    color: '#E8C97A',
                    letterSpacing: '0.15em',
                    textShadow: '0 0 20px rgba(232,201,122,0.3)',
                  }}
                >
                  RI
                </p>
                <p
                  className="mt-3 uppercase"
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 10,
                    color: 'rgba(232,201,122,0.4)',
                    letterSpacing: '0.25em',
                  }}
                >
                  Real Intelligence
                </p>
              </div>
              <motion.div
                animate={{ opacity: hoverLeft ? 1 : 0, x: hoverLeft ? 0 : -6 }}
                transition={{ duration: 0.3 }}
                className="mb-2"
              >
                <ArrowRight size={20} style={{ color: 'rgba(232,201,122,0.4)' }} />
              </motion.div>
            </div>
          </div>
        </motion.button>

        {/* Divider */}
        <div className={`relative z-20 flex items-center justify-center ${isMobile ? 'h-px w-full' : 'w-px'}`}>
          <motion.div
            className={isMobile ? 'h-px w-full' : 'w-px h-full'}
            style={{
              background: 'rgba(240,237,232,0.05)',
              ...(isMobile ? {} : { transformOrigin: 'top' }),
            }}
            initial={isMobile ? { scaleX: 0 } : { scaleY: 0 }}
            animate={{ scaleX: 1, scaleY: 1 }}
            transition={{ delay: 0.8, duration: 0.5, ease }}
          />
          <div
            className="absolute z-10"
            style={{
              width: 5,
              height: 5,
              background: 'rgba(232,201,122,0.15)',
              transform: 'rotate(45deg)',
            }}
          />
        </div>

        {/* RIGHT — Mirror RI */}
        <motion.button
          className="relative flex-1 overflow-hidden cursor-pointer text-left focus:outline-none"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease }}
          onClick={() => navigate('/dashboard')}
          onMouseEnter={() => setHoverRight(true)}
          onMouseLeave={() => setHoverRight(false)}
        >
          <div
            className="absolute inset-0 transition-all duration-700"
            style={{ background: 'radial-gradient(ellipse at 60% 60%, #0C0C14 0%, #080808 70%)' }}
          />
          <FloatingOrbs color="rgba(240,237,232,0.03)" fast={hoverRight} />

          <motion.div
            className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
            animate={{ opacity: hoverRight ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            style={{ background: 'linear-gradient(to top, rgba(240,237,232,0.03), transparent)' }}
          />

          <motion.div
            className="absolute top-0 left-0 bottom-0 w-px pointer-events-none"
            animate={{ opacity: hoverRight ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            style={{ background: 'rgba(240,237,232,0.06)' }}
          />

          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 z-10">
            <div className="flex items-end justify-between">
              <div>
                <h2
                  className="text-[32px] md:text-[48px] font-light leading-none"
                  style={{ fontFamily: '"Cormorant Garamond", serif', color: '#F0EDE8', letterSpacing: '0.02em' }}
                >
                  Mirror
                </h2>
                <p
                  className="text-[32px] md:text-[48px] font-light italic leading-none mt-0.5"
                  style={{ fontFamily: '"Cormorant Garamond", serif', color: '#F0EDE8', letterSpacing: '0.15em' }}
                >
                  RI
                </p>
                <p
                  className="mt-3 uppercase"
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 10,
                    color: 'rgba(240,237,232,0.25)',
                    letterSpacing: '0.25em',
                  }}
                >
                  Real Intelligence
                </p>
              </div>
              <motion.div
                animate={{ opacity: hoverRight ? 1 : 0, x: hoverRight ? 0 : -6 }}
                transition={{ duration: 0.3 }}
                className="mb-2"
              >
                <ArrowRight size={20} style={{ color: 'rgba(240,237,232,0.3)' }} />
              </motion.div>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Bottom text */}
      <motion.p
        className="absolute bottom-4 left-0 right-0 text-center z-30 uppercase"
        style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 9, color: '#222222', letterSpacing: '0.25em' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.8 }}
      >
        Where do you want to go?
      </motion.p>
    </div>
  );
}
