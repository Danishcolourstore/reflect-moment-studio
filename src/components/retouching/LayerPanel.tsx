import { motion, AnimatePresence } from 'framer-motion';
import type { CanvasLayer } from '@/hooks/useCanvasEngine';

interface Props {
  layers: CanvasLayer[];
  onToggleVisibility: (id: string) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  onRemove: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function LayerPanel({ layers, onToggleVisibility, onOpacityChange, onRemove, isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-[280px] overflow-y-auto"
            style={{ background: '#1a1a1a', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] tracking-widest uppercase font-medium" style={{ fontFamily: '"DM Sans", sans-serif', color: '#c9a96e' }}>
                  Layers
                </h3>
                <button onClick={onClose} className="text-[#6a6470] text-[18px] leading-none">&times;</button>
              </div>

              {layers.length === 0 ? (
                <p className="text-[11px] text-[#6a6470] text-center py-8" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                  No retouching layers yet
                </p>
              ) : (
                <div className="space-y-2">
                  {[...layers].reverse().map(layer => (
                    <div
                      key={layer.id}
                      className="p-3 rounded-xl"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => onToggleVisibility(layer.id)}
                          className="text-[12px] w-5 h-5 flex items-center justify-center rounded"
                          style={{
                            color: layer.visible ? '#c9a96e' : '#6a6470',
                            background: layer.visible ? 'rgba(201,169,110,0.1)' : 'transparent',
                          }}
                        >
                          {layer.visible ? '👁' : '○'}
                        </button>
                        <span className="text-[10px] text-[#f5f0eb] flex-1 truncate" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                          {layer.name}
                        </span>
                        <button
                          onClick={() => onRemove(layer.id)}
                          className="text-[10px] text-[#6a6470] hover:text-red-400 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-[#6a6470] uppercase tracking-wide" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                          Opacity
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(layer.opacity * 100)}
                          onChange={(e) => onOpacityChange(layer.id, Number(e.target.value) / 100)}
                          className="rt-slider flex-1"
                        />
                        <span className="text-[9px] tabular-nums text-[#a09890] min-w-[24px] text-right" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                          {Math.round(layer.opacity * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
