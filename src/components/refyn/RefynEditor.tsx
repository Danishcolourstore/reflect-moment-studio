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
    mainCanvasRef,
    layers,
    isLoaded,
    removeLayer,
    toggleLayerVisibility,
    setLayerOpacity,
    exportFullResolution,
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
      {/* FULL-SCREEN PHOTO — fills entire viewport */}
      <div
        className="vsco-photo-layer"
        onPointerDown={() => setIsComparing(true)}
        onPointerUp={() => setIsComparing(false)}
        onPointerLeave={() => setIsComparing(false)}
        style={{ touchAction: 'none' }}
      >
        {isComparing && (
          <img
            src={photoUrl}
            alt="Original"
            className="vsco-img"
            style={{ zIndex: 3 }}
            draggable={false}
          />
        )}
        <canvas
          ref={mainCanvasRef}
          className="vsco-img"
          style={{ opacity: isComparing ? 0 : 1, zIndex: 2 }}
        />
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-6 h-6 border-2 border-[#c9a96e]/30 border-t-[#c9a96e] rounded-full animate-spin" />
            <span className="vsco-loading-text">Preparing editor...</span>
          </div>
        )}
      </div>

      {/* FLOATING TOP BAR — glass, over the photo */}
      <div className="vsco-topbar">
        <button onClick={() => navigate(-1)} className="vsco-back-btn">
          <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => history.undo()}
            disabled={!history.canUndo}
            className="vsco-top-icon"
            style={{ opacity: history.canUndo ? 0.9 : 0.25 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8L8 4M4 8L8 12M4 8H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={() => history.redo()}
            disabled={!history.canRedo}
            className="vsco-top-icon"
            style={{ opacity: history.canRedo ? 0.9 : 0.25 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 8L8 4M12 8L8 12M12 8H3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Edit pencil icon — opens layers */}
          <button onClick={() => setShowLayers(true)} className="vsco-top-icon" style={{ opacity: 0.6 }}>
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <path d="M14.5 3.5L16.5 5.5L6 16H4V14L14.5 3.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* COMPARING BADGE */}
      <AnimatePresence>
        {isComparing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="vsco-compare-badge"
          >
            Original
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING TOOL PANEL — overlays on photo like VSCO recipe rows */}
      <AnimatePresence mode="wait">
        {ActivePanel && (
          <motion.div
            key={activeTool}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="vsco-overlay-panel"
          >
            <ActivePanel onClose={() => setActiveTool(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM TOOLBAR — floating over photo */}
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

      {/* Brush Cursor */}
      <BrushCursor size={brushSize} feather={brushFeather} visible={!!showBrushCursor} />

      <style>{`
        .vsco-root {
          position: relative;
          width: 100%;
          height: 100dvh;
          overflow: hidden;
          background: #000;
        }

        /* Photo fills entire screen */
        .vsco-photo-layer {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .vsco-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 0;
          transition: opacity 0.15s ease;
        }

        .vsco-loading-text {
          font-family: "DM Sans", sans-serif;
          font-size: 11px;
          letter-spacing: 0.06em;
          color: #666;
        }

        /* Floating top bar — transparent glass */
        .vsco-topbar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          padding-top: max(12px, env(safe-area-inset-top, 0px));
          background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%);
        }

        .vsco-back-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: #f5f0eb;
          border: none;
          cursor: pointer;
        }
        .vsco-back-btn:active { transform: scale(0.92); }

        .vsco-top-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f5f0eb;
          background: none;
          border: none;
          cursor: pointer;
        }
        .vsco-top-icon:active { transform: scale(0.9); }

        /* Compare badge */
        .vsco-compare-badge {
          position: absolute;
          top: 70px;
          left: 16px;
          z-index: 30;
          padding: 4px 12px;
          border-radius: 100px;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          font-family: "DM Sans", sans-serif;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(245,240,235,0.7);
        }

        /* Floating overlay panel — VSCO recipe style rows over the photo */
        .vsco-overlay-panel {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 56px;
          z-index: 20;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        /* Bottom toolbar — floating at absolute bottom */
        .vsco-bottom-dock {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 25;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, transparent 100%);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        /* Slider styles */
        .rt-slider {
          -webkit-appearance: none; appearance: none;
          background: transparent; cursor: pointer; height: 20px;
          width: 100%;
        }
        .rt-slider::-webkit-slider-track { height: 1px; border-radius: 0.5px; background: rgba(255,255,255,0.15); }
        .rt-slider::-moz-range-track { height: 1px; border-radius: 0.5px; background: rgba(255,255,255,0.15); }
        .rt-slider::-moz-range-progress { height: 1px; background: rgba(201,169,110,0.6); }
        .rt-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
          background: #c9a96e; box-shadow: 0 0 8px 2px rgba(201,169,110,0.25);
          margin-top: -7px; border: none;
          transition: width 100ms, height 100ms;
        }
        .rt-slider::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%;
          background: #c9a96e; box-shadow: 0 0 8px 2px rgba(201,169,110,0.25); border: none;
        }
        .rt-slider:active::-webkit-slider-thumb {
          width: 18px; height: 18px; margin-top: -9px;
        }
      `}</style>
    </div>
  );
}
