import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

export default function IntelligenceHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [dotHover, setDotHover] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase.from('profiles').select('studio_name') as any)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.studio_name) setName(data.studio_name);
    })();
  }, [user]);

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] text-[#F0EDE8] overflow-hidden relative flex flex-col items-center justify-center px-6">
      {/* Film grain */}
      <svg className="pointer-events-none fixed inset-0 w-full h-full z-50 opacity-[0.03]">
        <filter id="intel-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#intel-grain)" />
      </svg>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-4 mb-10"
      >
        {/* Amber hexagon */}
        <motion.div
          animate={{ rotate: [0, 60, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
            <path d="M14 1L26.5 8.5V23.5L14 31L1.5 23.5V8.5L14 1Z" stroke="#E8C97A" strokeWidth="1.5" fill="rgba(232,201,122,0.06)" />
          </svg>
        </motion.div>

        <h1
          className="text-[11px] tracking-[0.4em] uppercase font-light text-[#F0EDE8]/60"
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          Colour Store Intelligence
        </h1>
      </motion.div>

      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex flex-col items-center gap-1.5 mb-12"
      >
        <p
          className="text-[20px] font-light"
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          Welcome back{name ? `, ${name}` : ''}
        </p>
        <p
          className="text-[11px] text-[#6B6B6B]"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          Last session: Mirror · 12 photos retouched
        </p>
      </motion.div>

      {/* Product cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="grid grid-cols-2 gap-4 w-full max-w-lg"
      >
        {/* Colour Store card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/colour-store')}
          className="group relative flex flex-col rounded-2xl bg-[#141414] border border-[rgba(240,237,232,0.04)] overflow-hidden text-left transition-all duration-400 hover:border-[rgba(232,201,122,0.12)]"
        >
          {/* Glow on hover */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: 'inset 0 0 40px 5px rgba(232,201,122,0.04)' }} />

          {/* Abstract visual */}
          <div className="h-28 w-full relative overflow-hidden">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(232,201,122,0.08) 0%, rgba(180,140,80,0.04) 50%, transparent 100%)' }} />
            <div className="absolute bottom-0 left-0 right-0 h-12" style={{ background: 'linear-gradient(to top, #141414, transparent)' }} />
            {/* Skin texture hint circles */}
            <motion.div
              animate={{ opacity: [0.15, 0.25, 0.15] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-8 left-1/2 -translate-x-1/2"
            >
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="25" cy="30" r="18" stroke="#E8C97A" strokeWidth="0.5" opacity="0.4" />
                <circle cx="35" cy="30" r="18" stroke="#E8C97A" strokeWidth="0.5" opacity="0.3" />
              </svg>
            </motion.div>
          </div>

          <div className="p-4 flex flex-col gap-1.5">
            <h2 className="text-[14px] font-light" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              Colour Store
            </h2>
            <p className="text-[10px] text-[#6B6B6B]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
              Retouch · Enhance · Export
            </p>
            <span className="mt-2 self-start px-2.5 py-1 rounded-full text-[8px] tracking-wider uppercase bg-[rgba(232,201,122,0.1)] text-[#E8C97A]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
              6 AI Tools
            </span>
          </div>
        </motion.button>

        {/* Mirror card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/dashboard')}
          className="group relative flex flex-col rounded-2xl bg-[#141414] border border-[rgba(240,237,232,0.04)] overflow-hidden text-left transition-all duration-400 hover:border-[rgba(232,201,122,0.12)]"
        >
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: 'inset 0 0 40px 5px rgba(232,201,122,0.04)' }} />

          <div className="h-28 w-full relative overflow-hidden">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(240,237,232,0.04) 0%, rgba(200,200,200,0.02) 50%, transparent 100%)' }} />
            <div className="absolute bottom-0 left-0 right-0 h-12" style={{ background: 'linear-gradient(to top, #141414, transparent)' }} />
            {/* Grid visual hint */}
            <motion.div
              animate={{ opacity: [0.12, 0.22, 0.12] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              className="absolute top-6 left-1/2 -translate-x-1/2"
            >
              <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                <rect x="4" y="4" width="18" height="18" rx="2" stroke="#F0EDE8" strokeWidth="0.5" opacity="0.3" />
                <rect x="28" y="4" width="18" height="18" rx="2" stroke="#F0EDE8" strokeWidth="0.5" opacity="0.25" />
                <rect x="4" y="28" width="18" height="18" rx="2" stroke="#F0EDE8" strokeWidth="0.5" opacity="0.25" />
                <rect x="28" y="28" width="18" height="18" rx="2" stroke="#F0EDE8" strokeWidth="0.5" opacity="0.2" />
              </svg>
            </motion.div>
          </div>

          <div className="p-4 flex flex-col gap-1.5">
            <h2 className="text-[14px] font-light" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              Mirror
            </h2>
            <p className="text-[10px] text-[#6B6B6B]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
              Gallery · Albums · Events · Grid
            </p>
            <span className="mt-2 self-start px-2.5 py-1 rounded-full text-[8px] tracking-wider uppercase bg-[rgba(240,237,232,0.06)] text-[#F0EDE8]/50" style={{ fontFamily: '"DM Sans", sans-serif' }}>
              Smart Gallery
            </span>
          </div>
        </motion.button>
      </motion.div>

      {/* Intelligence dot */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 cursor-default"
        onMouseEnter={() => setDotHover(true)}
        onMouseLeave={() => setDotHover(false)}
      >
        <motion.div
          animate={{
            boxShadow: [
              '0 0 4px 1px rgba(232,201,122,0.3)',
              '0 0 10px 3px rgba(232,201,122,0.5)',
              '0 0 4px 1px rgba(232,201,122,0.3)',
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-2 h-2 rounded-full bg-[#E8C97A]"
        />
        <motion.span
          initial={false}
          animate={{ opacity: dotHover ? 1 : 0, x: dotHover ? 0 : 4 }}
          className="text-[9px] tracking-wider text-[#6B6B6B] whitespace-nowrap"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          Colour Store Intelligence · Active
        </motion.span>
      </motion.div>
    </div>
  );
}
