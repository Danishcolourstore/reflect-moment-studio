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
    <div className="rt-root">
      {/* TOP BAR — 44px, clean single row */}
      <div className="rt-topbar">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="#F0EDE8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
          </svg>
          <span className="rt-topbar-title">Colour Store</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Undo */}
          <button
            onClick={() => history.undo()}
            disabled={!history.canUndo}
            className="rt-icon-btn"
            style={{ opacity: history.canUndo ? 0.8 : 0.2 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8L8 4M4 8L8 12M4 8H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Redo */}
          <button
            onClick={() => history.redo()}
            disabled={!history.canRedo}
            className="rt-icon-btn"
            style={{ opacity: history.canRedo ? 0.8 : 0.2 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 8L8 4M12 8L8 12M12 8H3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Layer count badge */}
          <button
            onClick={() => setShowLayers(true)}
            className="rt-layer-badge"
          >
            {layers.length || 0}
          </button>
          {/* Export */}
          <button onClick={handleExport} className="rt-export-btn">
            Export
          </button>
        </div>
      </div>

      {/* VIEWPORT — fills all remaining space */}
      <div className="rt-viewport">
        <div
          className="relative w-full h-full flex items-center justify-center"
          onPointerDown={() => setIsComparing(true)}
          onPointerUp={() => setIsComparing(false)}
          onPointerLeave={() => setIsComparing(false)}
          style={{ touchAction: 'none' }}
        >
          {isComparing && (
            <img
              src={photoUrl}
              alt="Original"
              className="rt-photo"
              style={{ zIndex: 3 }}
              draggable={false}
            />
          )}
          <canvas
            ref={mainCanvasRef}
            className="rt-photo"
            style={{ opacity: isComparing ? 0 : 1, zIndex: 2 }}
          />
          {!isLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-[#c9a96e]/30 border-t-[#c9a96e] rounded-full animate-spin" />
              <span className="text-[11px] tracking-wider text-[#666]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                Preparing editor...
              </span>
            </div>
          )}
          <AnimatePresence>
            {isComparing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
              >
                <span className="text-[9px] tracking-widest uppercase" style={{ fontFamily: '"DM Sans", sans-serif', color: 'rgba(245,240,235,0.7)' }}>
                  Original
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* BOTTOM DOCK — tool panel + toolbar */}
      <div className="rt-dock">
        <AnimatePresence mode="wait">
          {ActivePanel && (
            <div className="rt-panel-container">
              <ActivePanel key={activeTool} onClose={() => setActiveTool(null)} />
            </div>
          )}
        </AnimatePresence>

        <div className="rt-toolbar-row">
          <RefynToolbar activeTool={activeTool} onToolTap={handleToolTap} />
        </div>
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
        .rt-root {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          width: 100%;
          overflow: hidden;
          background: #111;
        }

        .rt-topbar {
          flex-shrink: 0;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          padding-top: env(safe-area-inset-top, 0px);
          background: #0a0a0a;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          z-index: 20;
        }

        .rt-topbar-title {
          font-family: "Cormorant Garamond", serif;
          font-size: 13px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(240,237,232,0.7);
          font-weight: 400;
        }

        .rt-icon-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f5f0eb;
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 6px;
        }
        .rt-icon-btn:active { transform: scale(0.92); }

        .rt-layer-badge {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid rgba(201,169,110,0.3);
          color: #c9a96e;
          font-size: 10px;
          font-family: "DM Sans", sans-serif;
          font-weight: 600;
          background: rgba(201,169,110,0.08);
          cursor: pointer;
        }

        .rt-export-btn {
          height: 32px;
          padding: 0 16px;
          border-radius: 100px;
          background: #c9a96e;
          color: #111;
          font-family: "DM Sans", sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
        }
        .rt-export-btn:active { transform: scale(0.95); opacity: 0.85; }

        .rt-viewport {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #111;
          transition: flex 250ms ease-out;
        }

        .rt-photo {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 0;
          transition: opacity 0.15s ease;
        }

        .rt-dock {
          flex-shrink: 0;
          background: #1a1a1a;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        .rt-panel-container {
          max-height: 30vh;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .rt-panel-container::-webkit-scrollbar { display: none; }

        .rt-toolbar-row {
          border-top: 1px solid rgba(255,255,255,0.04);
        }

        .rt-slider {
          -webkit-appearance: none; appearance: none;
          background: transparent; cursor: pointer; height: 20px;
          width: 100%;
        }
        .rt-slider::-webkit-slider-track { height: 2px; border-radius: 1px; background: #333; }
        .rt-slider::-moz-range-track { height: 2px; border-radius: 1px; background: #333; }
        .rt-slider::-moz-range-progress { height: 2px; background: #c9a96e; }
        .rt-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
          background: #c9a96e; box-shadow: 0 0 6px 1px rgba(201,169,110,0.2);
          margin-top: -6px; border: none;
          transition: width 100ms, height 100ms;
        }
        .rt-slider::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%;
          background: #c9a96e; box-shadow: 0 0 6px 1px rgba(201,169,110,0.2); border: none;
        }
        .rt-slider:active::-webkit-slider-thumb {
          width: 18px; height: 18px; margin-top: -8px;
        }
      `}</style>
    </div>
  );
}
