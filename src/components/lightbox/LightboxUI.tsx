import { ArrowLeft, Heart, Download, Share2, Sparkles, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LightboxPhoto } from './CinematicLightbox';

interface LightboxUIProps {
  visible: boolean;
  currentIndex: number;
  total: number;
  photo: LightboxPhoto;
  isFav: boolean;
  onClose: () => void;
  onToggleFav: () => void;
  onDownload: () => void;
  onShare: () => void;
  onAIFind: () => void;
  canDownload?: boolean;
}

export function LightboxUI({
  visible, currentIndex, total, photo, isFav,
  onClose, onToggleFav, onDownload, onShare, onAIFind, canDownload,
}: LightboxUIProps) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between pointer-events-auto"
        style={{
          padding: 'env(safe-area-inset-top, 12px) 20px 20px',
          background: 'linear-gradient(to bottom, rgba(10,10,11,0.75) 0%, transparent 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
        >
          <ArrowLeft style={{ width: 24, height: 24, color: 'rgba(255,255,255,0.85)' }} />
        </button>

        {/* Counter */}
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.7rem',
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.5)',
        }}>
          {currentIndex + 1} / {total}
        </span>

        {/* Overflow */}
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
        >
          <MoreHorizontal style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.6)' }} />
        </button>
      </div>

      {/* Bottom bar */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col pointer-events-auto"
        style={{
          padding: '24px 20px env(safe-area-inset-bottom, 12px)',
          background: 'linear-gradient(to top, rgba(10,10,11,0.85) 0%, transparent 100%)',
          gap: 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Metadata */}
        {photo.chapter && (
          <div>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1rem',
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.45)',
              margin: 0,
            }}>
              {photo.chapter}
            </p>
            {photo.captured_at && (
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.25)',
                margin: '2px 0 0',
              }}>
                {new Date(photo.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        )}

        {/* Action row */}
        <div className="flex justify-around items-center">
          <ActionButton
            icon={<Heart style={{
              width: 22, height: 22,
              color: isFav ? '#B8953F' : 'rgba(255,255,255,0.7)',
              fill: isFav ? '#B8953F' : 'none',
              transition: 'all 0.2s',
              ...(isFav ? { animation: 'heartPop 0.4s ease' } : {}),
            }} />}
            label="Favourite"
            onClick={onToggleFav}
          />
          {canDownload && (
            <ActionButton
              icon={<Download style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.7)' }} />}
              label="Download"
              onClick={onDownload}
            />
          )}
          <ActionButton
            icon={<Sparkles style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.7)' }} />}
            label="AI Find"
            onClick={onAIFind}
          />
          <ActionButton
            icon={<Share2 style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.7)' }} />}
            label="Share"
            onClick={onShare}
          />
        </div>
      </div>

      <style>{`
        @keyframes heartPop {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.4); }
          60%  { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
      `}</style>
    </motion.div>
  );
}

function ActionButton({ icon, label, onClick }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px' }}
    >
      {icon}
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.6rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.45)',
      }}>
        {label}
      </span>
    </button>
  );
}
