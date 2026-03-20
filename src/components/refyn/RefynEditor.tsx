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

// Tools that use brushes
const BRUSH_TOOLS: RetouchToolId[] = ['skinSmooth', 'dodgeBurn', 'blemish', 'liquify', 'sharpen', 'hairCleanup', 'bgCleanup'];

export default function RefynEditor({ photoUrl, onExport, onReset }: Props) {
  const [activeTool, setActiveTool] = useState<RetouchToolId | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [brushSize] = useState(50);
  const [brushFeather] = useState(50);

  const {
    mainCanvasRef,
    layers,
    isLoaded,
    createLayer: _createLayer,
    removeLayer,
    toggleLayerVisibility,
    setLayerOpacity,
    renderComposite,
    exportFullResolution,
  } = useCanvasEngine(photoUrl);

  const history = useUndoHistory();

  // Keyboard shortcuts
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
    <div className="rt-editor-root">
      {/* ===== TOP BAR ===== */}
      <div className="rt-topbar">
        <div className="flex items-center gap-1">
          {/* Undo */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => history.undo()}
            disabled={!history.canUndo}
            className="p-2.5 rounded-full"
            style={{ opacity: history.canUndo ? 1 : 0.25, color: '#f5f0eb' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8L8 4M4 8L8 12M4 8H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
          {/* Redo */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => history.redo()}
            disabled={!history.canRedo}
            className="p-2.5 rounded-full"
            style={{ opacity: history.canRedo ? 1 : 0.25, color: '#f5f0eb' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 8L8 4M12 8L8 12M12 8H3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        </div>

        <div className="flex items-center gap-2">
          {/* Layers button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLayers(true)}
            className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
            style={{
              border: '1px solid rgba(201,169,110,0.2)',
              color: '#c9a96e',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '9px',
              letterSpacing: '0.1em',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="4" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="0.8"/>
              <rect x="3" y="2.5" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="0.6" opacity="0.4"/>
            </svg>
            LAYERS
          </motion.button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="text-[9px] tracking-wider uppercase px-3 py-2"
            style={{ fontFamily: '"DM Sans", sans-serif', color: '#6a6470' }}
          >
            Reset
          </button>

          {/* Export */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="px-4 py-2 rounded-full text-[9px] tracking-wider uppercase font-medium"
            style={{
              fontFamily: '"DM Sans", sans-serif',
              background: '#c9a96e',
              color: '#1a1a1a',
            }}
          >
            Export
          </motion.button>
        </div>
      </div>

      {/* ===== PHOTO VIEWPORT ===== */}
      <div className="rt-viewport">
        <div
          className="relative w-full h-full flex items-center justify-center"
          onPointerDown={() => setIsComparing(true)}
          onPointerUp={() => setIsComparing(false)}
          onPointerLeave={() => setIsComparing(false)}
          style={{ touchAction: 'none' }}
        >
          {/* Original for comparison */}
          {isComparing && (
            <img
              src={photoUrl}
              alt="Original"
              className="rt-photo-layer"
              style={{ zIndex: 3 }}
              draggable={false}
            />
          )}
          {/* Main composited canvas */}
          <canvas
            ref={mainCanvasRef}
            className="rt-photo-layer"
            style={{ opacity: isComparing ? 0 : 1, zIndex: 2 }}
          />
          {/* Loading state */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#c9a96e]/30 border-t-[#c9a96e] rounded-full animate-spin" />
            </div>
          )}
          {/* Compare badge */}
          <AnimatePresence>
            {isComparing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
              >
                <span className="text-[10px] tracking-widest uppercase" style={{ fontFamily: '"DM Sans", sans-serif', color: 'rgba(245,240,235,0.7)' }}>
                  Original
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ===== BOTTOM DOCK ===== */}
      <div className="rt-dock">
        {/* Active tool panel */}
        <AnimatePresence mode="wait">
          {ActivePanel && (
            <ActivePanel key={activeTool} onClose={() => setActiveTool(null)} />
          )}
        </AnimatePresence>

        {/* Toolbar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
        .rt-editor-root {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          width: 100%;
          overflow: hidden;
          background: #1a1a1a;
        }
        .rt-topbar {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          padding-top: max(8px, env(safe-area-inset-top, 0px));
          background: rgba(26,26,26,0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .rt-viewport {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          background: #111;
        }
        .rt-photo-layer {
          position: absolute;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 4px;
          transition: opacity 0.15s ease;
        }
        .rt-dock {
          flex-shrink: 0;
          background: rgba(26,26,26,0.97);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .rt-slider {
          -webkit-appearance: none; appearance: none;
          background: transparent; cursor: pointer; height: 24px;
        }
        .rt-slider::-webkit-slider-track { height: 2px; border-radius: 1px; background: #333; }
        .rt-slider::-moz-range-track { height: 2px; border-radius: 1px; background: #333; }
        .rt-slider::-moz-range-progress { height: 2px; background: #c9a96e; }
        .rt-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
          background: #c9a96e; box-shadow: 0 0 10px 2px rgba(201,169,110,0.25);
          margin-top: -8px; border: none;
        }
        .rt-slider::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: #c9a96e; box-shadow: 0 0 10px 2px rgba(201,169,110,0.25); border: none;
        }
      `}</style>
    </div>
  );
}
