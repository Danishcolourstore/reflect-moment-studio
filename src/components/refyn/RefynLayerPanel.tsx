import { motion } from 'framer-motion';

interface Props {
  texture: number;
  tone: number;
  onTextureChange: (v: number) => void;
  onToneChange: (v: number) => void;
  onClose: () => void;
}

export default function RefynLayerPanel({ texture, tone, onTextureChange, onToneChange, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-full max-w-lg p-5 rounded-2xl bg-[#141414] border border-[rgba(240,237,232,0.05)]"
    >
      <p className="text-[11px] tracking-wider uppercase text-[#6B6B6B] text-center mb-4" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        Layer
      </p>

      {/* Texture slider */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-[10px] tracking-wider uppercase text-[#6B6B6B]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            Texture
          </span>
          <span className="text-[10px] text-[#E8C97A]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            {texture}%
          </span>
        </div>
        <input
          type="range" min={0} max={100} value={texture}
          onChange={(e) => onTextureChange(Number(e.target.value))}
          className="refyn-slider w-full"
        />
      </div>

      {/* Tone slider */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-[10px] tracking-wider uppercase text-[#6B6B6B]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            Tone
          </span>
          <span className="text-[10px] text-[#E8C97A]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            {tone}%
          </span>
        </div>
        <input
          type="range" min={0} max={100} value={tone}
          onChange={(e) => onToneChange(Number(e.target.value))}
          className="refyn-slider w-full"
        />
      </div>

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
