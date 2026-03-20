import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const ease = [0.16, 1, 0.3, 1];

function FloatingOrbs({ color, speed = 10 }: { color: string; speed?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${220 + i * 80}px`,
            height: `${220 + i * 80}px`,
            background: `radial-gradient(circle, ${color}, transparent 70%)`,
            left: `${15 + i * 25}%`,
            top: `${20 + i * 20}%`,
          }}
          animate={{
            x: [0, 30 - i * 15, -20 + i * 10, 0],
            y: [0, -20 + i * 12, 25 - i * 8, 0],
            scale: [1, 1.08, 0.95, 1],
          }}
          transition={{
            duration: speed + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function IntelligenceHome() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [hoverLeft, setHoverLeft] = useState(false);
  const [hoverRight, setHoverRight] = useState(false);

  return (
    <div className="h-[100dvh] bg-[#080808] overflow-hidden relative flex flex-col">
      {/* Film grain */}
      <svg className="pointer-events-none fixed inset-0 w-full h-full z-50 opacity-[0.03]">
        <filter id="intel-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#intel-grain)" />
      </svg>

      {/* Top bar */}
      <motion.div
        className="relative z-10 flex items-center justify-between px-6 h-12 shrink-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <div className="w-4 h-4">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="rgba(232,201,122,0.15)" strokeWidth="0.8" />
          </svg>
        </div>
        <motion.div
          className="w-8 h-[3px] rounded-full"
          style={{ background: 'linear-gradient(90deg, rgba(232,201,122,0.4), rgba(232,201,122,0.15))' }}
          animate={{
            opacity: [0.5, 0.9, 0.5],
            boxShadow: [
              '0 0 6px 1px rgba(232,201,122,0.15)',
              '0 0 12px 3px rgba(232,201,122,0.3)',
              '0 0 6px 1px rgba(232,201,122,0.15)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
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
          {/* Background gradients */}
          <div
            className="absolute inset-0 transition-all duration-700"
            style={{
              background: `radial-gradient(ellipse at 40% 60%, #1F1608 0%, #080808 70%)`,
              opacity: hoverLeft ? 1.1 : 1,
            }}
          />
          <FloatingOrbs
            color="rgba(232,201,122,0.07)"
            speed={hoverLeft ? 6 : 10}
          />

          {/* Bottom glow on hover */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
            animate={{ opacity: hoverLeft ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: 'linear-gradient(to top, rgba(232,201,122,0.06), transparent)',
            }}
          />

          {/* Text block */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 z-10">
            <div className="flex items-end justify-between">
              <div>
                <h2
                  className="text-[28px] md:text-[42px] font-light leading-none"
                  style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    color: '#F0EDE8',
                    letterSpacing: '0.04em',
                  }}
                >
                  Colour Store
                </h2>
                <p
                  className="text-[28px] md:text-[42px] font-light italic leading-none mt-0.5"
                  style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    color: '#E8C97A',
                    letterSpacing: '0.15em',
                  }}
                >
                  RI
                </p>
                <p
                  className="mt-3 text-[11px] uppercase tracking-[0.2em]"
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    color: 'rgba(232,201,122,0.5)',
                  }}
                >
                  Real Intelligence
                </p>
              </div>
              <motion.div
                animate={{ opacity: hoverLeft ? 1 : 0, x: hoverLeft ? 0 : -6 }}
                transition={{ duration: 0.3 }}
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
            style={{ background: 'rgba(240,237,232,0.06)' }}
            initial={{ scaleY: isMobile ? 1 : 0, scaleX: isMobile ? 0 : 1 }}
            animate={{ scaleY: 1, scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.5, ease }}
            {...(!isMobile && { style: { background: 'rgba(240,237,232,0.06)', transformOrigin: 'top' } })}
          />
          <div
            className="absolute z-10"
            style={{
              width: 6,
              height: 6,
              background: 'rgba(232,201,122,0.2)',
              transform: 'rotate(45deg)',
            }}
          />
        </div>

        {/* RIGHT — Mirror AI */}
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
            style={{
              background: `radial-gradient(ellipse at 60% 60%, #0C0C14 0%, #080808 70%)`,
            }}
          />
          <FloatingOrbs
            color="rgba(240,237,232,0.04)"
            speed={hoverRight ? 6 : 10}
          />

          <motion.div
            className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
            animate={{ opacity: hoverRight ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: 'linear-gradient(to top, rgba(240,237,232,0.04), transparent)',
            }}
          />

          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 z-10">
            <div className="flex items-end justify-between">
              <div>
                <h2
                  className="text-[28px] md:text-[42px] font-light leading-none"
                  style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    color: '#F0EDE8',
                    letterSpacing: '0.04em',
                  }}
                >
                  Mirror
                </h2>
                <p
                  className="text-[28px] md:text-[42px] font-light italic leading-none mt-0.5"
                  style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    color: '#F0EDE8',
                    letterSpacing: '0.15em',
                  }}
                >
                  AI
                </p>
                <p
                  className="mt-3 text-[11px] uppercase tracking-[0.2em]"
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    color: 'rgba(240,237,232,0.3)',
                  }}
                >
                  Artificial Intelligence
                </p>
              </div>
              <motion.div
                animate={{ opacity: hoverRight ? 1 : 0, x: hoverRight ? 0 : -6 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowRight size={20} style={{ color: 'rgba(240,237,232,0.3)' }} />
              </motion.div>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Bottom text */}
      <motion.p
        className="absolute bottom-5 left-0 right-0 text-center z-30 text-[10px] uppercase tracking-[0.2em]"
        style={{ fontFamily: '"DM Sans", sans-serif', color: '#2A2A2A' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.8 }}
      >
        Where do you want to go?
      </motion.p>
    </div>
  );
}
