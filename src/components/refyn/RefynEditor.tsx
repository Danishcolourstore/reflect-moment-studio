import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RefynToolbar, { type RetouchToolId } from './RefynToolbar';
import FrequencySeparation from '../retouching/FrequencySeparation';
import SkinSmoothing from '../retouching/SkinSmoothing';
import DodgeBurn from '../retouching/DodgeBurn';
import BlemishRemoval from '../retouching/BlemishRemoval';
import Liquify from '../retouching/Liquify';
import Sharpening from '../retouching/Sharpening';
import HairCleanup from '../retouching/HairCleanup';
import EyeEnhancement from '../retouching/EyeEnhancement';
import TeethWhitening from '../retouching/TeethWhitening';
import BackgroundCleanup from '../retouching/BackgroundCleanup';
import LayerPanel from '../retouching/LayerPanel';
import BrushCursor from '../retouching/BrushCursor';
import { useCanvasEngine } from '@/hooks/useCanvasEngine';
import { useUndoHistory } from '@/hooks/useUndoHistory';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Props {
  photoUrl: string;
  onExport: () => void;
  onReset: () => void;
}

const TOOL_PANELS: Record<RetouchToolId, React.ComponentType<{ onClose: () => void }>> = {
  freqSep: FrequencySeparation,
  skinSmooth: SkinSmoothing,
  dodgeBurn: DodgeBurn,
  blemish: BlemishRemoval,
  liquify: Liquify,
  sharpen: Sharpening,
  hairCleanup: HairCleanup,
  eyeEnhance: EyeEnhancement,
  teethWhiten: TeethWhitening,
  bgCleanup: BackgroundCleanup,
};

const BRUSH_TOOLS: RetouchToolId[] = ['skinSmooth', 'dodgeBurn', 'blemish', 'liquify', 'sharpen', 'hairCleanup', 'bgCleanup'];

export default function RefynEditor({ photoUrl, onExport, onReset }: Props) {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<RetouchToolId | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [brushSize] = useState(50);
  const [brushFeather] = useState(50);

  const {
    mainCanvasRef, layers, isLoaded,
    removeLayer, toggleLayerVisibility, setLayerOpacity, exportFullResolution,
  } = useCanvasEngine(photoUrl);

  const history = useUndoHistory();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); history.undo(); }
      else if (mod && e.key === 'z' && e.shiftKey) { e.preventDefault(); history.redo(); }
      else if (mod && e.key === 'y') { e.preventDefault(); history.redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [history]);

  const handleToolTap = useCallback((id: RetouchToolId) => {
    setActiveTool(prev => prev === id ? null : id);
  }, []);

  const handleExport = useCallback(async () => {
    const blob = await exportFullResolution(0.95);
    if (!blob) { toast.error('Export failed'); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retouched_${Date.now()}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported at full resolution');
  }, [exportFullResolution]);

  const showBrushCursor = activeTool && BRUSH_TOOLS.includes(activeTool);
  const ActivePanel = activeTool ? TOOL_PANELS[activeTool] : null;

  return (
    <div className="vsco-root">
      {/* FULL-SCREEN PHOTO */}
      <div
        className="vsco-photo-layer"
        onPointerDown={() => setIsComparing(true)}
        onPointerUp={() => setIsComparing(false)}
        onPointerLeave={() => setIsComparing(false)}
        style={{ touchAction: 'none' }}
      >
        {isComparing && (
          <img src={photoUrl} alt="Original" className="vsco-img" style={{ zIndex: 3 }} draggable={false} />
        )}
        <canvas ref={mainCanvasRef} className="vsco-img" style={{ opacity: isComparing ? 0 : 1, zIndex: 2 }} />
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-6 h-6 border-2 border-[#c9a96e]/30 border-t-[#c9a96e] rounded-full animate-spin" />
            <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: '#666', letterSpacing: '0.06em' }}>
              Preparing editor...
            </span>
          </div>
        )}
      </div>

      {/* TOP — back button only, floating over gradient */}
      <div className="vsco-topbar">
        <button onClick={() => navigate(-1)} className="vsco-back-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowLayers(true)} className="vsco-top-icon" aria-label="Layers">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </button>
          <button onClick={handleExport} className="vsco-export-btn">Export</button>
        </div>
      </div>

      {/* COMPARING BADGE */}
      <AnimatePresence>
        {isComparing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="vsco-compare-badge"
          >
            Original
          </motion.div>
        )}
      </AnimatePresence>

      {/* RECIPE CARD PANEL — floats over photo like VSCO */}
      <AnimatePresence mode="wait">
        {ActivePanel && (
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="vsco-recipe-area"
          >
            <ActivePanel onClose={() => setActiveTool(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM TOOLBAR */}
      <div className="vsco-bottom-dock">
        <RefynToolbar activeTool={activeTool} onToolTap={handleToolTap} />
      </div>

      {/* Layer Panel */}
      <LayerPanel
        layers={layers}
        onToggleVisibility={toggleLayerVisibility}
        onOpacityChange={setLayerOpacity}
        onRemove={removeLayer}
        isOpen={showLayers}
        onClose={() => setShowLayers(false)}
      />

      <BrushCursor size={brushSize} feather={brushFeather} visible={!!showBrushCursor} />

      <style>{`
        .vsco-root {
          position: relative;
          width: 100%; height: 100dvh;
          overflow: hidden; background: #000;
        }

        .vsco-photo-layer {
          position: absolute; inset: 0; z-index: 1;
        }

        .vsco-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: contain;
          border-radius: 0;
        }

        /* ── Top bar ── */
        .vsco-topbar {
          position: absolute; top: 0; left: 0; right: 0; z-index: 30;
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 12px;
          padding-top: max(8px, env(safe-area-inset-top, 0px));
          background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%);
          height: 44px;
        }

        .vsco-back-btn {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          background: rgba(60,60,60,0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #fff; border: none; cursor: pointer;
        }
        .vsco-back-btn:active { transform: scale(0.92); }

        .vsco-top-icon {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.6);
          background: none; border: none; cursor: pointer;
        }
        .vsco-top-icon:active { transform: scale(0.9); }

        .vsco-export-btn {
          padding: 5px 14px;
          border-radius: 6px;
          background: rgba(201,169,110,0.15);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #c9a96e;
          font-family: "DM Sans", sans-serif;
          font-size: 12px; font-weight: 500;
          letter-spacing: 0.04em;
          border: 1px solid rgba(201,169,110,0.2);
          cursor: pointer;
        }
        .vsco-export-btn:active { transform: scale(0.95); opacity: 0.8; }

        .vsco-compare-badge {
          position: absolute; top: 56px; left: 16px; z-index: 30;
          padding: 3px 10px; border-radius: 100px;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(8px);
          font-family: "DM Sans", sans-serif;
          font-size: 9px; letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(245,240,235,0.7);
        }

        /* ── Recipe area — glass card floating above dock ── */
        .vsco-recipe-area {
          position: absolute;
          left: 8px; right: 8px;
          bottom: 56px;
          z-index: 20;
          max-height: 30vh;
          overflow-y: auto;
          scrollbar-width: none;
          border-radius: 12px;
          background: rgba(18,18,18,0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.06);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .vsco-recipe-area::-webkit-scrollbar { display: none; }

        /* ── Recipe panel styles ── */
        .recipe-panel { }

        .recipe-title-row {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .recipe-badge {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 1px 6px;
          background: rgba(201,169,110,0.2);
          border-radius: 3px;
          font-family: "DM Sans", sans-serif;
          font-size: 9px; font-weight: 600;
          color: #c9a96e;
          letter-spacing: 0.04em;
        }

        .recipe-title {
          flex: 1;
          font-family: "DM Sans", sans-serif;
          font-size: 12px; font-weight: 500;
          color: rgba(240,237,232,0.8);
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .recipe-title-value {
          font-family: "DM Sans", sans-serif;
          font-size: 12px; font-weight: 500;
          color: #c9a96e;
          cursor: pointer;
          padding: 4px 8px;
          letter-spacing: 0.02em;
        }

        /* ── Individual recipe row — compact ── */
        .recipe-row {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          border: none; background: none;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          cursor: pointer;
          text-align: left;
          min-height: 36px;
        }
        .recipe-row:active { background: rgba(255,255,255,0.03); }

        .recipe-icon {
          width: 20px; height: 20px;
          display: flex; align-items: center; justify-content: center;
          color: rgba(240,237,232,0.5);
          flex-shrink: 0;
        }
        .recipe-icon svg { width: 16px; height: 16px; }

        .recipe-label {
          flex: 1;
          font-family: "DM Sans", sans-serif;
          font-size: 12px; font-weight: 400;
          color: rgba(240,237,232,0.75);
          letter-spacing: 0.01em;
        }

        .recipe-value {
          font-family: "DM Sans", sans-serif;
          font-size: 12px; font-weight: 400;
          color: rgba(240,237,232,0.4);
          letter-spacing: 0.01em;
          font-variant-numeric: tabular-nums;
          min-width: 40px; text-align: right;
        }

        /* ── Inline slider (shown on tap) — compact ── */
        .recipe-slider-row {
          padding: 2px 16px 6px 44px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .recipe-slider {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 20px;
          background: transparent; cursor: pointer;
        }
        .recipe-slider::-webkit-slider-track {
          height: 1.5px; border-radius: 1px;
          background: rgba(255,255,255,0.1);
        }
        .recipe-slider::-moz-range-track {
          height: 1.5px; border-radius: 1px;
          background: rgba(255,255,255,0.1);
        }
        .recipe-slider::-moz-range-progress {
          height: 1.5px; background: rgba(201,169,110,0.5);
        }
        .recipe-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px; border-radius: 50%;
          background: #c9a96e;
          box-shadow: 0 0 6px 1px rgba(201,169,110,0.3);
          margin-top: -6px; border: none;
        }
        .recipe-slider::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%;
          background: #c9a96e;
          box-shadow: 0 0 6px 1px rgba(201,169,110,0.3);
          border: none;
        }
        .recipe-slider:active::-webkit-slider-thumb {
          width: 18px; height: 18px; margin-top: -8px;
          transition: width 0.1s, height 0.1s;
        }

        /* ── Segment row — compact ── */
        .recipe-segment-row {
          display: flex; gap: 0; padding: 0 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .recipe-segment-btn {
          flex: 1; padding: 7px 0;
          background: none; border: none;
          font-family: "DM Sans", sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          text-align: center;
          transition: color 0.15s;
        }

        /* ── Bottom dock — Lightroom-style ── */
        .vsco-bottom-dock {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          z-index: 25;
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 70%, transparent 100%);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </div>
  );
}
