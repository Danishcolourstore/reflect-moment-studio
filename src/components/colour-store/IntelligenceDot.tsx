import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  active?: boolean;
}

export default function IntelligenceDot({ active = false }: Props) {
  const [hover, setHover] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 cursor-default"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <motion.div
        animate={{
          boxShadow: [
            '0 0 4px 1px rgba(232,201,122,0.3)',
            `0 0 ${active ? '14px 4px' : '10px 3px'} rgba(232,201,122,0.5)`,
            '0 0 4px 1px rgba(232,201,122,0.3)',
          ],
        }}
        transition={{ duration: active ? 1.2 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="w-2 h-2 rounded-full bg-[#E8C97A]"
      />
      <motion.span
        initial={false}
        animate={{ opacity: hover ? 1 : 0, x: hover ? 0 : 4 }}
        transition={{ duration: 0.2 }}
        className="text-[9px] tracking-wider text-[#6B6B6B] whitespace-nowrap"
        style={{ fontFamily: '"DM Sans", sans-serif' }}
      >
        Colour Store Intelligence · {active ? 'Analysing' : 'Active'}
      </motion.span>
    </motion.div>
  );
}
