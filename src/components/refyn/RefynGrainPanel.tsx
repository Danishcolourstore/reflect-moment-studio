import { motion } from 'framer-motion';

interface GrainState {
  style: 'film' | 'texture' | 'noise';
  strength: number;
  shadowsOnly: boolean;
}

interface Props {
  grain: GrainState;
  onChange: (g: GrainState) => void;
  onClose: () => void;
}

const GRAIN_OPTIONS: { key: GrainState['style']; label: string; desc: string }[] = [
  { key: 'film', label: 'Film', desc: 'Classic analog' },
  { key: 'texture', label: 'Texture', desc: 'Soft organic' },
  { key: 'noise', label: 'Noise', desc: 'Digital raw' },
];

export default function RefynGrainPanel({ grain, onChange, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-full max-w-lg p-5 rounded-2xl bg-[#141414] border border-[rgba(240,237,232,0.05)]"
    >
      <p className="text-[11px] tracking-wider uppercase text-[#6B6B6B] text-center mb-4" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        Grain
      </p>

      {/* Style options */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {GRAIN_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onChange({ ...grain, style: opt.key })}
            className="py-3 rounded-xl border flex flex-col items-center gap-1 transition-all duration-300"
            style={{
              backgroundColor: grain.style === opt.key ? 'rgba(232,201,122,0.08)' : '#0A0A0A',
              borderColor: grain.style === opt.key ? 'rgba(232,201,122,0.2)' : 'rgba(240,237,232,0.06)',
            }}
          >
            <span
              className="text-[11px] font-medium"
              style={{
                fontFamily: '"DM Sans", sans-serif',
                color: grain.style === opt.key ? '#E8C97A' : '#F0EDE8',
              }}
            >
              {opt.label}
            </span>
            <span className="text-[9px] text-[#6B6B6B]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
              {opt.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Strength slider */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-[10px] tracking-wider uppercase text-[#6B6B6B]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            Strength
          </span>
          <span className="text-[10px] text-[#E8C97A]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            {grain.strength}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={grain.strength}
          onChange={(e) => onChange({ ...grain, strength: Number(e.target.value) })}
          className="refyn-slider w-full"
        />
      </div>

      {/* Shadows toggle */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] tracking-wider uppercase text-[#6B6B6B]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
          Shadows only
        </span>
        <button
          onClick={() => onChange({ ...grain, shadowsOnly: !grain.shadowsOnly })}
          className="w-10 h-5 rounded-full relative transition-colors duration-300"
          style={{ backgroundColor: grain.shadowsOnly ? '#E8C97A' : '#333' }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-[#0A0A0A] transition-transform duration-300"
            style={{ left: grain.shadowsOnly ? '22px' : '2px' }}
          />
        </button>
      </div>

      {/* Done */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onClose}
        className="w-full py-2.5 rounded-full border border-[rgba(240,237,232,0.08)] text-[10px] tracking-wider uppercase text-[#F0EDE8]/60 hover:text-[#F0EDE8] transition-colors duration-300"
        style={{ fontFamily: '"DM Sans", sans-serif' }}
      >
        Done
      </motion.button>
    </motion.div>
  );
}
