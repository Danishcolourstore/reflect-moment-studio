import { useState, useCallback, useEffect, useRef, PointerEvent as RPointerEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveAs } from 'file-saver';
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

/* ── Pinch-to-zoom hook ── */
function usePinchZoom() {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastDist = useRef(0);
  const lastCenter = useRef({ x: 0, y: 0 });
  const baseTransform = useRef({ scale: 1, x: 0, y: 0 });

  const onPointerDown = useCallback((e: RPointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      lastDist.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      lastCenter.current = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      baseTransform.current = { ...transform };
    }
  }, [transform]);

  const onPointerMove = useCallback((e: RPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const center = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      const ratio = dist / lastDist.current;
      const newScale = Math.min(Math.max(baseTransform.current.scale * ratio, 0.5), 5);
      const dx = center.x - lastCenter.current.x;
      const dy = center.y - lastCenter.current.y;
      setTransform({
        scale: newScale,
        x: baseTransform.current.x + dx,
        y: baseTransform.current.y + dy,
      });
    } else if (pointers.current.size === 1 && transform.scale > 1.05) {
      // Single finger pan when zoomed
      const prev = pointers.current.get(e.pointerId);
      if (prev) {
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;
        setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
    }
  }, [transform.scale]);

  const onPointerUp = useCallback((e: RPointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      // Snap back if nearly 1x
      setTransform(t => {
        if (t.scale < 1.05) return { scale: 1, x: 0, y: 0 };
        return t;
      });
    }
  }, []);

  const resetZoom = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 });
  }, []);

  return { transform, onPointerDown, onPointerMove, onPointerUp, resetZoom };
}

export default function RefynEditor({ photoUrl, onExport, onReset }: Props) {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<RetouchToolId | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

  const {
    mainCanvasRef, layers, isLoaded,
    removeLayer, toggleLayerVisibility, setLayerOpacity, exportFullResolution,
  } = useCanvasEngine(photoUrl);

  const { } = useUndoHistory();

  const { transform, onPointerDown, onPointerMove, onPointerUp, resetZoom } = usePinchZoom();

  // Apply stolen style from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('stolen-style');
      if (!raw) return;
      const { name, params } = JSON.parse(raw);
      sessionStorage.removeItem('stolen-style');
      // Log applied params for future canvas integration
      console.log('[Refyn] Stolen style applied:', params);
      toast.success(`Style applied: ${name}`, { duration: 3000 });
    } catch { /* ignore */ }
  }, []);

  const handleToolTap = useCallback((id: RetouchToolId) => {
    setActiveTool(prev => prev === id ? null : id);
  }, []);

  const handleExport = useCallback(async () => {
    toast.info('Rendering full resolution...');
    const blob = await exportFullResolution(0.95);
    if (!blob) { toast.error('Export failed'); return; }
    saveAs(blob, `retouched_${Date.now()}.jpg`);
    toast.success('Exported at full resolution');
  }, [exportFullResolution]);

  const ActivePanel = activeTool ? TOOL_PANELS[activeTool] : null;
  const isZoomed = transform.scale > 1.05;

  return (
    <div className="luminar-root">
      {/* ── Canvas area with pinch-zoom ── */}
      <div
        className="luminar-canvas-area"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ touchAction: 'none' }}
      >
        <div
          className="luminar-canvas-transform"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transition: isZoomed ? 'none' : 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {isComparing && (
            <img src={photoUrl} alt="Original" className="luminar-img" style={{ zIndex: 3 }} draggable={false} />
          )}
          <canvas ref={mainCanvasRef} className="luminar-img" style={{ opacity: isComparing ? 0 : 1, zIndex: 2 }} />
        </div>

        {!isLoaded && (
          <div className="luminar-loader">
            <div className="luminar-spinner" />
            <span>Loading...</span>
          </div>
        )}

        {/* Zoom indicator */}
        <AnimatePresence>
          {isZoomed && (
            <motion.button
              className="luminar-zoom-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={resetZoom}
            >
              {Math.round(transform.scale * 100)}% · Reset
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Top bar — Luminar style: minimal frosted glass ── */}
      <div className="luminar-topbar">
        <button onClick={() => navigate(-1)} className="luminar-top-btn" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="luminar-top-center">
          <button
            className={`luminar-compare-btn ${isComparing ? 'active' : ''}`}
            onPointerDown={() => setIsComparing(true)}
            onPointerUp={() => setIsComparing(false)}
            onPointerLeave={() => setIsComparing(false)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>

        <div className="luminar-top-right">
          <button onClick={() => setShowLayers(true)} className="luminar-top-btn" aria-label="Layers">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </button>
          <button onClick={handleExport} className="luminar-export-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* ── Comparing badge ── */}
      <AnimatePresence>
        {isComparing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="luminar-compare-label"
          >
            Original
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tool panel — slides up from bottom like Luminar ── */}
      <AnimatePresence mode="wait">
        {ActivePanel && (
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="luminar-panel-sheet"
          >
            <div className="luminar-panel-handle" />
            <ActivePanel onClose={() => setActiveTool(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom toolbar — Luminar pill-style ── */}
      <div className="luminar-bottom">
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

      <style>{`
        .luminar-root {
          position: relative;
          width: 100%; height: 100dvh;
          overflow: hidden;
          background: #0d0d0d;
          display: flex; flex-direction: column;
        }

        /* ── Canvas ── */
        .luminar-canvas-area {
          flex: 1; position: relative;
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        .luminar-canvas-transform {
          position: relative;
          width: 100%; height: 100%;
          transform-origin: center center;
          will-change: transform;
        }
        .luminar-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: contain;
        }
        .luminar-loader {
          position: absolute; inset: 0; z-index: 10;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 10px;
          font-family: "DM Sans", sans-serif;
          font-size: 11px; color: rgba(255,255,255,0.3);
          letter-spacing: 0.08em;
        }
        .luminar-spinner {
          width: 20px; height: 20px;
          border: 2px solid rgba(201,169,110,0.2);
          border-top-color: #c9a96e;
          border-radius: 50%;
          animation: luminar-spin 0.8s linear infinite;
        }
        @keyframes luminar-spin { to { transform: rotate(360deg); } }

        .luminar-zoom-badge {
          position: absolute; top: 56px; right: 12px; z-index: 35;
          padding: 4px 12px; border-radius: 100px;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.08);
          font-family: "DM Sans", sans-serif;
          font-size: 10px; color: rgba(255,255,255,0.6);
          letter-spacing: 0.04em;
          cursor: pointer;
        }

        /* ── Top bar ── */
        .luminar-topbar {
          position: absolute; top: 0; left: 0; right: 0; z-index: 40;
          display: flex; align-items: center; justify-content: space-between;
          padding: 6px 10px;
          padding-top: max(6px, env(safe-area-inset-top, 0px));
          background: linear-gradient(to bottom, rgba(13,13,13,0.85) 0%, rgba(13,13,13,0.4) 70%, transparent 100%);
          min-height: 48px;
        }
        .luminar-top-btn {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: rgba(255,255,255,0.7); border: none; cursor: pointer;
          transition: all 0.15s;
        }
        .luminar-top-btn:active { transform: scale(0.92); background: rgba(255,255,255,0.1); }
        .luminar-top-center { display: flex; gap: 4px; }
        .luminar-top-right { display: flex; gap: 6px; align-items: center; }

        .luminar-compare-btn {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: rgba(255,255,255,0.5); border: none; cursor: pointer;
          transition: all 0.15s;
        }
        .luminar-compare-btn.active {
          background: rgba(201,169,110,0.2);
          color: #c9a96e;
        }

        .luminar-export-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 6px 14px;
          border-radius: 10px;
          background: linear-gradient(135deg, #c9a96e 0%, #b8944f 100%);
          color: #0d0d0d;
          font-family: "DM Sans", sans-serif;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.02em;
          border: none; cursor: pointer;
          box-shadow: 0 2px 12px rgba(201,169,110,0.25);
          transition: all 0.15s;
        }
        .luminar-export-btn:active { transform: scale(0.95); opacity: 0.85; }
        .luminar-export-btn svg { color: #0d0d0d; }

        .luminar-compare-label {
          position: absolute; top: 58px; left: 50%; transform: translateX(-50%); z-index: 35;
          padding: 3px 14px; border-radius: 100px;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(8px);
          font-family: "DM Sans", sans-serif;
          font-size: 10px; letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(245,240,235,0.6);
        }

        /* ── Tool panel sheet ── */
        .luminar-panel-sheet {
          position: absolute;
          left: 0; right: 0;
          bottom: 56px;
          z-index: 30;
          max-height: 35vh;
          overflow-y: auto;
          scrollbar-width: none;
          border-radius: 16px 16px 0 0;
          background: rgba(20,20,20,0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .luminar-panel-sheet::-webkit-scrollbar { display: none; }
        .luminar-panel-handle {
          width: 32px; height: 3px;
          border-radius: 3px;
          background: rgba(255,255,255,0.15);
          margin: 8px auto 4px;
        }

        /* ── Bottom toolbar — frosted glass dock ── */
        .luminar-bottom {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          z-index: 35;
          background: rgba(13,13,13,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255,255,255,0.04);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        /* ── Recipe panel styles (used by tool sub-components) ── */
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
          height: 2px; border-radius: 1px;
          background: rgba(255,255,255,0.08);
        }
        .recipe-slider::-moz-range-track {
          height: 2px; border-radius: 1px;
          background: rgba(255,255,255,0.08);
        }
        .recipe-slider::-moz-range-progress {
          height: 2px; background: rgba(201,169,110,0.5);
        }
        .recipe-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px; border-radius: 50%;
          background: #c9a96e;
          box-shadow: 0 0 8px 2px rgba(201,169,110,0.25);
          margin-top: -7px; border: 2px solid rgba(13,13,13,0.8);
        }
        .recipe-slider::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: #c9a96e;
          box-shadow: 0 0 8px 2px rgba(201,169,110,0.25);
          border: 2px solid rgba(13,13,13,0.8);
        }
        .recipe-slider:active::-webkit-slider-thumb {
          width: 20px; height: 20px; margin-top: -9px;
          box-shadow: 0 0 12px 3px rgba(201,169,110,0.4);
        }
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
      `}</style>
    </div>
  );
}
