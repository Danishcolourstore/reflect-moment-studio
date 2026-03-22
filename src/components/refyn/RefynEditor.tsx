import { useState, useCallback, useEffect, useRef, PointerEvent as RPointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { saveAs } from 'file-saver';
import {
  ChevronLeft, Undo2, SplitSquareHorizontal,
  Sparkles, Layers, CircleDot, Sun, Eraser, Move, Diamond, Scissors, Eye, Smile,
  MessageCircle, ArrowUp, X,
} from 'lucide-react';
import { useCanvasEngine } from '@/hooks/useCanvasEngine';
import { useUndoHistory } from '@/hooks/useUndoHistory';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { applyRetouchEffects } from '@/lib/canvas-effects';

interface Props {
  photoUrl: string;
  onExport: () => void;
  onReset: () => void;
}

/* ── Tool definitions ── */
type ToolId = 
  | 'retouch' | 'freqSep' | 'smooth' | 'dnb' | 'heal'
  | 'liquify' | 'sharpen' | 'hair' | 'eyes' | 'teeth';

interface SubTool { key: string; label: string; min: number; max: number; }
interface ToolDef {
  id: ToolId;
  label: string;
  icon: React.ComponentType<any>;
  subTools?: SubTool[];
  slider?: { key: string; label: string; min: number; max: number };
}

const TOOLS: ToolDef[] = [
  { id: 'retouch', label: 'RETOUCH', icon: Sparkles, subTools: [
    { key: 'texture', label: 'TEXTURE', min: 0, max: 100 },
    { key: 'smooth', label: 'SMOOTH', min: 0, max: 100 },
    { key: 'sharp', label: 'SHARP', min: 0, max: 100 },
    { key: 'blend', label: 'BLEND', min: 0, max: 100 },
    { key: 'glow', label: 'GLOW', min: 0, max: 100 },
  ]},
  { id: 'freqSep', label: 'FREQ SEP', icon: Layers, slider: { key: 'freqSep', label: 'Intensity', min: 0, max: 100 } },
  { id: 'smooth', label: 'SMOOTH', icon: CircleDot, slider: { key: 'smoothStr', label: 'Strength', min: 0, max: 100 } },
  { id: 'dnb', label: 'D & B', icon: Sun, subTools: [
    { key: 'highlights', label: 'HIGHLIGHTS', min: 0, max: 100 },
    { key: 'shadows', label: 'SHADOWS', min: 0, max: 100 },
    { key: 'contour', label: 'CONTOUR', min: 0, max: 100 },
  ]},
  { id: 'heal', label: 'HEAL', icon: Eraser, slider: { key: 'healSize', label: 'Brush Size', min: 1, max: 100 } },
  { id: 'liquify', label: 'LIQUIFY', icon: Move, slider: { key: 'liqSize', label: 'Brush Size', min: 1, max: 100 } },
  { id: 'sharpen', label: 'SHARPEN', icon: Diamond, slider: { key: 'sharpenAmt', label: 'Amount', min: 0, max: 100 } },
  { id: 'hair', label: 'HAIR', icon: Scissors, slider: { key: 'hairSize', label: 'Brush Size', min: 1, max: 100 } },
  { id: 'eyes', label: 'EYES', icon: Eye, slider: { key: 'eyeClarity', label: 'Clarity', min: 0, max: 100 } },
  { id: 'teeth', label: 'TEETH', icon: Smile, slider: { key: 'teethWhiten', label: 'Whitening', min: 0, max: 100 } },
];

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
      setTransform({ scale: newScale, x: baseTransform.current.x + dx, y: baseTransform.current.y + dy });
    } else if (pointers.current.size === 1 && transform.scale > 1.05) {
      const prev = pointers.current.get(e.pointerId);
      if (prev) {
        setTransform(t => ({ ...t, x: t.x + (e.clientX - prev.x), y: t.y + (e.clientY - prev.y) }));
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
    }
  }, [transform.scale]);

  const onPointerUp = useCallback((e: RPointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      setTransform(t => t.scale < 1.05 ? { scale: 1, x: 0, y: 0 } : t);
    }
  }, []);

  const resetZoom = useCallback(() => setTransform({ scale: 1, x: 0, y: 0 }), []);
  return { transform, onPointerDown, onPointerMove, onPointerUp, resetZoom };
}

/* ── Entiran Chat ── */
interface ChatMsg { role: 'user' | 'assistant'; text: string; applyParams?: Record<string, number>; }

const SUGGESTIONS = ['Auto retouch', 'Suggest settings', 'Apply stolen style', 'What tool?'];

function placeholderReply(msg: string): ChatMsg {
  const m = msg.toLowerCase();
  if (m.includes('smooth') || m.includes('skin'))
    return { role: 'assistant', text: 'Try Smooth at 45 with Texture at 70 for natural Indian skin tones.', applyParams: { smoothStr: 45, texture: 70 } };
  if (m.includes('retouch') || m.includes('auto'))
    return { role: 'assistant', text: 'For bridal portraits: Smooth 40, Texture 75, Eyes 60, Highlights 35.', applyParams: { smoothStr: 40, texture: 75, eyeClarity: 60, highlights: 35 } };
  if (m.includes('style') || m.includes('steal'))
    return { role: 'assistant', text: 'Open the Style Stealer from the main menu to analyze a reference photo.' };
  return { role: 'assistant', text: 'I can suggest retouching settings, explain tools, or apply a saved style. What do you need?' };
}

/* ══════════════════════════════════════════════════════════════
   MAIN EDITOR
   ══════════════════════════════════════════════════════════════ */
export default function RefynEditor({ photoUrl, onExport, onReset }: Props) {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [activeSubTool, setActiveSubTool] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [uiVisible, setUiVisible] = useState(false);

  // All parameter values in one flat map
  const [params, setParams] = useState<Record<string, number>>({});

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: 'assistant', text: 'What would you like me to help with?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Source canvas stores the original unedited image
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { mainCanvasRef, sourceImageRef, isLoaded, renderComposite } = useCanvasEngine(photoUrl);
  const { push: historyPush, undo: historyUndo, redo: historyRedo, canUndo, canRedo } = useUndoHistory<Record<string, number>>();
  const { transform, onPointerDown, onPointerMove, onPointerUp, resetZoom } = usePinchZoom();

  // Undo debounce timer
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize source canvas when image loads
  useEffect(() => {
    if (!isLoaded || !sourceImageRef.current) return;
    const img = sourceImageRef.current;
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    if (ctx) ctx.drawImage(img, 0, 0);
    sourceCanvasRef.current = c;
    // Push initial empty state
    historyPush('Initial', {});
  }, [isLoaded]);

  // ══ CORE: Apply effects whenever params change ══
  const renderEffectsRef = useRef<number>(0);
  useEffect(() => {
    cancelAnimationFrame(renderEffectsRef.current);
    renderEffectsRef.current = requestAnimationFrame(() => {
      const source = sourceCanvasRef.current;
      const canvas = mainCanvasRef.current;
      if (!source || !canvas || !isLoaded) return;

      // Create a temp canvas at display resolution
      const container = canvas.parentElement;
      if (!container) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const img = sourceImageRef.current;
      if (!img) return;

      const imgRatio = img.naturalWidth / img.naturalHeight;
      const cW = container.clientWidth;
      const cH = container.clientHeight;
      const containerRatio = cW / cH;
      let fitW: number, fitH: number;
      if (imgRatio > containerRatio) { fitW = cW; fitH = cW / imgRatio; }
      else { fitH = cH; fitW = cH * imgRatio; }

      const renderW = Math.round(fitW * dpr);
      const renderH = Math.round(fitH * dpr);

      // Create a source at display resolution for effects
      const dispSource = document.createElement('canvas');
      dispSource.width = renderW;
      dispSource.height = renderH;
      const dsCtx = dispSource.getContext('2d')!;
      dsCtx.drawImage(source, 0, 0, renderW, renderH);

      // Resize main canvas
      if (canvas.width !== renderW || canvas.height !== renderH) {
        canvas.width = renderW;
        canvas.height = renderH;
        canvas.style.width = fitW + 'px';
        canvas.style.height = fitH + 'px';
      }

      // Apply effects directly onto the main canvas
      applyRetouchEffects(dispSource, params, canvas);
    });

    return () => cancelAnimationFrame(renderEffectsRef.current);
  }, [params, isLoaded]);

  // Debounced undo push — commit after 500ms of no changes
  useEffect(() => {
    const hasAny = Object.values(params).some(v => v !== 0);
    if (!hasAny) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      historyPush('Edit', { ...params });
    }, 500);
    return () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); };
  }, [params]);

  // Fade in UI
  useEffect(() => { const t = setTimeout(() => setUiVisible(true), 1000); return () => clearTimeout(t); }, []);

  // Apply stolen style
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('stolen-style');
      if (!raw) return;
      const { name, params: p } = JSON.parse(raw);
      sessionStorage.removeItem('stolen-style');
      setParams(prev => ({ ...prev, ...p }));
      toast.success(`Style applied: ${name}`, { duration: 3000 });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const getVal = (key: string) => params[key] ?? 0;
  const setVal = (key: string, v: number) => setParams(prev => ({ ...prev, [key]: v }));

  const handleUndo = useCallback(() => {
    const prev = historyUndo();
    if (prev) setParams(prev);
  }, [historyUndo]);

  const currentTool = TOOLS.find(t => t.id === activeTool);
  const isZoomed = transform.scale > 1.05;
  const hasEdits = Object.values(params).some(v => v !== 0);
  const toolsActive = activeTool !== null;

  const handleToolTap = (id: ToolId) => {
    if (activeTool === id) { setActiveTool(null); setActiveSubTool(null); return; }
    setActiveTool(id);
    const tool = TOOLS.find(t => t.id === id);
    if (tool?.subTools) setActiveSubTool(tool.subTools[0].key);
    else setActiveSubTool(null);
  };

  const handleBack = () => {
    if (hasEdits) setShowDiscard(true);
    else navigate(-1);
  };

  // Export with effects applied at full resolution
  const handleExport = useCallback(async (quality = 0.95, maxEdge?: number) => {
    const source = sourceCanvasRef.current;
    if (!source) { toast.error('Export failed'); return; }

    let w = source.width;
    let h = source.height;

    // Resize for web export
    if (maxEdge && Math.max(w, h) > maxEdge) {
      const ratio = maxEdge / Math.max(w, h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    const resizedSource = document.createElement('canvas');
    resizedSource.width = w;
    resizedSource.height = h;
    const rsCtx = resizedSource.getContext('2d')!;
    rsCtx.drawImage(source, 0, 0, w, h);

    const outputCanvas = document.createElement('canvas');
    applyRetouchEffects(resizedSource, params, outputCanvas);

    const blob = await new Promise<Blob | null>((resolve) => {
      outputCanvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    });

    if (!blob) { toast.error('Export failed'); return; }
    return blob;
  }, [params]);

  const handleSaveDevice = useCallback(async () => {
    const blob = await handleExport(0.95);
    if (blob) { saveAs(blob, `retouched_${Date.now()}.jpg`); toast.success('Exported'); }
  }, [handleExport]);

  const handleSaveWeb = useCallback(async () => {
    const blob = await handleExport(0.85, 2000);
    if (blob) { saveAs(blob, `retouched_web_${Date.now()}.jpg`); toast.success('Exported for web'); }
  }, [handleExport]);

  const handleSaveXMP = useCallback(async () => {
    const blob = await handleExport(0.95);
    if (!blob) return;
    saveAs(blob, `retouched_${Date.now()}.jpg`);

    // Generate XMP sidecar
    const xmpContent = `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:refyn="http://refyn.app/ns/1.0/"
      ${Object.entries(params).map(([k, v]) => `refyn:${k}="${v}"`).join('\n      ')}
    />
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
    const xmpBlob = new Blob([xmpContent], { type: 'application/xml' });
    saveAs(xmpBlob, `retouched_${Date.now()}.xmp`);
    toast.success('Exported with XMP sidecar');
  }, [handleExport, params]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMsg = { role: 'user', text: chatInput };
    const reply = placeholderReply(chatInput);
    setChatMessages(prev => [...prev, userMsg, reply]);
    setChatInput('');
  };

  const applyChat = (p: Record<string, number>) => {
    setParams(prev => ({ ...prev, ...p }));
    toast.success('Applied', { duration: 1500 });
  };

  // Current slider info
  let sliderKey = '';
  let sliderLabel = '';
  let sliderMin = 0;
  let sliderMax = 100;
  if (currentTool?.slider) {
    sliderKey = currentTool.slider.key;
    sliderLabel = currentTool.slider.label;
    sliderMin = currentTool.slider.min;
    sliderMax = currentTool.slider.max;
  } else if (currentTool?.subTools && activeSubTool) {
    const st = currentTool.subTools.find(s => s.key === activeSubTool);
    if (st) { sliderKey = st.key; sliderLabel = st.label; sliderMin = st.min; sliderMax = st.max; }
  }

  const sliderVal = sliderKey ? getVal(sliderKey) : 0;
  const showSlider = !!sliderKey;

  return (
    <div className="vsco-root">
      {/* ── Canvas ── */}
      <div
        className="vsco-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ touchAction: 'none' }}
      >
        <div
          style={{
            position: 'relative', width: '100%', height: '100%',
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: 'center center',
            transition: isZoomed ? 'none' : 'transform 0.2s ease-out',
            willChange: 'transform',
          }}
        >
          {isComparing && (
            <img src={photoUrl} alt="Original" draggable={false}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 3 }} />
          )}
          <canvas ref={mainCanvasRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: isComparing ? 0 : 1, zIndex: 2 }} />
        </div>

        {!isLoaded && (
          <div className="vsco-loader">
            <div className="vsco-spinner" />
          </div>
        )}

        {/* Zoom badge */}
        <AnimatePresence>
          {isZoomed && (
            <motion.button className="vsco-zoom" onClick={resetZoom}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {Math.round(transform.scale * 100)}%
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── UI Layer (fades in after 1s) ── */}
      <div className="vsco-ui" style={{ opacity: uiVisible ? 1 : 0, transition: 'opacity 0.3s ease-out' }}>

        {/* ── Top bar ── */}
        <div className="vsco-topbar">
          <button className="vsco-tap" onClick={handleBack} aria-label="Back">
            <ChevronLeft size={24} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.7)' }} />
          </button>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className="vsco-tap" onClick={handleUndo} style={{ color: canUndo ? '#fff' : 'rgba(255,255,255,0.3)' }}>
              <Undo2 size={20} strokeWidth={1.5} />
            </button>
            <button className="vsco-tap"
              onPointerDown={() => setIsComparing(true)}
              onPointerUp={() => setIsComparing(false)}
              onPointerLeave={() => setIsComparing(false)}
              style={{ color: isComparing ? '#fff' : 'rgba(255,255,255,0.5)' }}>
              <SplitSquareHorizontal size={20} strokeWidth={1.5} />
            </button>
            <button className="vsco-next" onClick={() => setShowExport(true)}>Next</button>
          </div>
        </div>

        {/* Compare label */}
        {isComparing && <div className="vsco-compare-label">Original</div>}

        {/* ── Bottom UI ── */}
        <div className="vsco-bottom">
          {/* Row 1: Slider or sub-tool strip */}
          <AnimatePresence mode="wait">
            {activeTool && (
              <motion.div key={activeTool + (activeSubTool || '')}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="vsco-slider-area">
                {/* Sub-tool strip for multi-param tools */}
                {currentTool?.subTools && (
                  <div className="vsco-subtool-strip">
                    {currentTool.subTools.map(st => (
                      <button key={st.key}
                        onClick={() => setActiveSubTool(st.key)}
                        className="vsco-subtool-btn"
                        style={{ color: activeSubTool === st.key ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)' }}>
                        {st.label}
                        {activeSubTool === st.key && <div className="vsco-subtool-dot" />}
                      </button>
                    ))}
                  </div>
                )}
                {/* Slider */}
                {showSlider && (
                  <div className="vsco-slider-wrap">
                    <span className="vsco-slider-val">{sliderVal > 0 ? `+${sliderVal}` : sliderVal}</span>
                    <input type="range" className="vsco-slider"
                      min={sliderMin} max={sliderMax} step={1}
                      value={sliderVal}
                      onChange={e => setVal(sliderKey, Number(e.target.value))} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Row 2: Tool strip */}
          <div className="vsco-tool-strip">
            {TOOLS.map(tool => {
              const Icon = tool.icon;
              const active = activeTool === tool.id;
              return (
                <button key={tool.id} className="vsco-tool-item" onClick={() => handleToolTap(tool.id)}>
                  <Icon size={20} strokeWidth={1.5}
                    style={{ color: active ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'color 0.2s ease-out' }} />
                  <span style={{ color: active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)' }}>{tool.label}</span>
                  {active && <div className="vsco-tool-dot" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Entiran Chat Bubble ── */}
        {!toolsActive && !chatOpen && (
          <button className="vsco-chat-bubble" onClick={() => setChatOpen(true)}>
            <MessageCircle size={20} color="#fff" strokeWidth={1.5} />
          </button>
        )}

        {/* ── Entiran Chat Panel ── */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div className="vsco-chat-panel"
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
              <div className="vsco-chat-header">
                <span>Entiran</span>
                <button className="vsco-tap" onClick={() => setChatOpen(false)}>
                  <X size={18} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </button>
              </div>
              <div className="vsco-chat-messages">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`vsco-chat-msg ${msg.role}`}>
                    <span>{msg.text}</span>
                    {msg.applyParams && (
                      <button className="vsco-chat-apply" onClick={() => applyChat(msg.applyParams!)}>Apply</button>
                    )}
                  </div>
                ))}
                {chatMessages.length === 1 && (
                  <div className="vsco-chat-suggestions">
                    {SUGGESTIONS.map(s => (
                      <button key={s} className="vsco-chat-pill"
                        onClick={() => { setChatInput(s); setTimeout(handleSendChat, 50); }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="vsco-chat-input-wrap">
                <input className="vsco-chat-input" placeholder="Ask anything..."
                  value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()} />
                <button className="vsco-chat-send" onClick={handleSendChat}>
                  <ArrowUp size={16} color="#000" strokeWidth={2} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Discard confirmation ── */}
      <AnimatePresence>
        {showDiscard && (
          <motion.div className="vsco-discard"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <p>Discard changes?</p>
            <div style={{ display: 'flex', gap: 24 }}>
              <button onClick={() => navigate(-1)} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>Discard</button>
              <button onClick={() => setShowDiscard(false)} style={{ color: '#fff', fontSize: 15 }}>Keep Editing</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Export screen ── */}
      <AnimatePresence>
        {showExport && (
          <RefynExportScreen photoUrl={photoUrl} onBack={() => setShowExport(false)} onDownload={handleExport} />
        )}
      </AnimatePresence>

      <style>{`
        .vsco-root {
          position: relative; width: 100%; height: 100dvh;
          overflow: hidden; background: #000;
          display: flex; flex-direction: column;
        }
        .vsco-canvas {
          flex: 1; position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        .vsco-loader {
          position: absolute; inset: 0; z-index: 10;
          display: flex; align-items: center; justify-content: center;
        }
        .vsco-spinner {
          width: 24px; height: 24px;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: rgba(255,255,255,0.6);
          border-radius: 50%;
          animation: vsco-spin 0.8s linear infinite;
        }
        @keyframes vsco-spin { to { transform: rotate(360deg); } }

        .vsco-zoom {
          position: absolute; top: 56px; right: 16px; z-index: 35;
          background: none; border: none;
          font-family: "DM Sans", sans-serif;
          font-size: 12px; color: rgba(255,255,255,0.6);
          cursor: pointer;
        }

        /* ── UI layer ── */
        .vsco-ui {
          position: absolute; inset: 0; z-index: 20;
          pointer-events: none;
        }
        .vsco-ui > * { pointer-events: auto; }

        /* ── Top bar ── */
        .vsco-topbar {
          position: absolute; top: 0; left: 0; right: 0;
          display: flex; align-items: center; justify-content: space-between;
          height: 44px;
          padding: 0 16px;
          padding-top: env(safe-area-inset-top, 0px);
          background: transparent;
        }
        .vsco-tap {
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer;
        }
        .vsco-tap:active { opacity: 0.5; }
        .vsco-next {
          background: none; border: none;
          font-family: "DM Sans", sans-serif;
          font-size: 14px; font-weight: 600; color: #fff;
          cursor: pointer; padding: 0 8px; height: 44px;
          display: flex; align-items: center;
        }
        .vsco-next:active { opacity: 0.5; }

        .vsco-compare-label {
          position: absolute; top: 60px; left: 50%; transform: translateX(-50%);
          font-family: "DM Sans", sans-serif;
          font-size: 11px; color: rgba(255,255,255,0.5);
          letter-spacing: 0.1em; text-transform: uppercase;
        }

        /* ── Bottom ── */
        .vsco-bottom {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
          background: transparent;
        }

        /* Slider area */
        .vsco-slider-area { padding: 0 20px 8px; }
        .vsco-slider-wrap {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
        }
        .vsco-slider-val {
          font-family: "DM Sans", sans-serif;
          font-size: 13px; color: #fff; font-variant-numeric: tabular-nums;
        }
        .vsco-slider {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 28px; background: transparent; cursor: pointer;
        }
        .vsco-slider::-webkit-slider-track {
          height: 2px; border-radius: 0;
          background: rgba(255,255,255,0.15);
        }
        .vsco-slider::-moz-range-track {
          height: 2px; border-radius: 0;
          background: rgba(255,255,255,0.15);
        }
        .vsco-slider::-moz-range-progress { height: 2px; background: rgba(255,255,255,0.6); }
        .vsco-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 28px; height: 28px; border-radius: 50%;
          background: #fff; border: none; margin-top: -13px;
        }
        .vsco-slider::-moz-range-thumb {
          width: 28px; height: 28px; border-radius: 50%;
          background: #fff; border: none;
        }

        /* Sub-tool strip */
        .vsco-subtool-strip {
          display: flex; align-items: center; justify-content: center;
          gap: 20px; padding: 8px 0;
          overflow-x: auto; scrollbar-width: none;
        }
        .vsco-subtool-strip::-webkit-scrollbar { display: none; }
        .vsco-subtool-btn {
          background: none; border: none; cursor: pointer;
          font-family: "DM Sans", sans-serif;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          position: relative; padding: 4px 0;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          transition: color 0.2s ease-out;
        }
        .vsco-subtool-dot {
          width: 3px; height: 3px; border-radius: 50%; background: #fff;
        }

        /* Tool strip */
        .vsco-tool-strip {
          display: flex; align-items: center;
          overflow-x: auto; scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x mandatory;
          padding: 4px 0;
        }
        .vsco-tool-strip::-webkit-scrollbar { display: none; }
        .vsco-tool-item {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          flex-shrink: 0; gap: 3px;
          width: 60px; min-height: 54px;
          background: none; border: none; cursor: pointer;
          scroll-snap-align: center;
          position: relative;
          padding-bottom: 6px;
        }
        .vsco-tool-item:first-child { margin-left: 20px; }
        .vsco-tool-item:last-child { margin-right: 20px; }
        .vsco-tool-item:active { opacity: 0.5; }
        .vsco-tool-item span {
          font-family: "DM Sans", sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.05em; text-transform: uppercase;
          white-space: nowrap;
          transition: color 0.2s ease-out;
        }
        .vsco-tool-dot {
          position: absolute; bottom: 0;
          width: 3px; height: 3px; border-radius: 50%; background: #fff;
        }

        /* ── Chat bubble ── */
        .vsco-chat-bubble {
          position: fixed; bottom: 90px; right: 16px;
          width: 44px; height: 44px; border-radius: 50%;
          background: #C9A96E; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 50;
        }
        .vsco-chat-bubble:active { transform: scale(0.92); }

        /* ── Chat panel ── */
        .vsco-chat-panel {
          position: fixed; z-index: 60;
          bottom: 90px; right: 16px;
          width: min(320px, 88vw);
          height: min(420px, 55vh);
          background: rgba(0,0,0,0.95);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        @media (max-width: 480px) {
          .vsco-chat-panel {
            bottom: 80px; right: auto;
            left: 50%; transform: translateX(-50%);
          }
        }
        .vsco-chat-header {
          height: 44px; display: flex;
          align-items: center; justify-content: space-between;
          padding: 0 14px;
          font-family: "DM Sans", sans-serif;
          font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.8);
        }
        .vsco-chat-messages {
          flex: 1; overflow-y: auto; padding: 8px 14px;
          display: flex; flex-direction: column; gap: 8px;
          scrollbar-width: none;
        }
        .vsco-chat-messages::-webkit-scrollbar { display: none; }
        .vsco-chat-msg {
          max-width: 85%; padding: 10px 14px;
          font-family: "DM Sans", sans-serif;
          font-size: 13px; line-height: 1.5;
        }
        .vsco-chat-msg.user {
          align-self: flex-end;
          background: rgba(255,255,255,0.08);
          border-radius: 14px 14px 2px 14px;
          color: #fff;
        }
        .vsco-chat-msg.assistant {
          align-self: flex-start;
          background: rgba(255,255,255,0.04);
          border-radius: 14px 14px 14px 2px;
          color: rgba(255,255,255,0.6);
        }
        .vsco-chat-apply {
          display: inline-block; margin-top: 6px;
          background: none; border: none;
          font-family: "DM Sans", sans-serif;
          font-size: 11px; color: #fff;
          text-decoration: underline;
          cursor: pointer;
        }
        .vsco-chat-suggestions {
          display: flex; flex-wrap: wrap; gap: 6px; padding: 4px 0;
        }
        .vsco-chat-pill {
          background: none;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          font-family: "DM Sans", sans-serif;
          font-size: 10px; text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          padding: 6px 12px; cursor: pointer;
        }
        .vsco-chat-pill:active { background: rgba(255,255,255,0.05); }
        .vsco-chat-input-wrap {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px;
        }
        .vsco-chat-input {
          flex: 1; background: rgba(255,255,255,0.05);
          border: none; border-radius: 12px;
          padding: 10px 14px;
          font-family: "DM Sans", sans-serif;
          font-size: 16px; color: #fff;
          outline: none;
        }
        .vsco-chat-input::placeholder { color: rgba(255,255,255,0.2); }
        .vsco-chat-send {
          width: 28px; height: 28px; border-radius: 50%;
          background: #fff; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
        }

        /* ── Discard overlay ── */
        .vsco-discard {
          position: absolute; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.8);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 24px;
        }
        .vsco-discard p {
          font-family: "DM Sans", sans-serif;
          font-size: 17px; color: #fff;
        }
        .vsco-discard button {
          background: none; border: none;
          font-family: "DM Sans", sans-serif;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

/* ── Export Screen (inline) ── */
function RefynExportScreen({ photoUrl, onBack, onDownload }: { photoUrl: string; onBack: () => void; onDownload: () => Promise<void> }) {
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [savedIdx, setSavedIdx] = useState<number | null>(null);

  const rows = [
    { label: 'Save to Device', sub: 'Full resolution JPEG' },
    { label: 'Save for Web', sub: 'Optimized, 2000px longest edge' },
    { label: 'Save with XMP', sub: 'JPEG + Lightroom sidecar file' },
  ];

  const handleRow = async (idx: number) => {
    if (exporting) return;
    setExporting(true); setExportProgress(0);
    const interval = setInterval(() => setExportProgress(p => Math.min(p + 0.15, 0.9)), 100);
    await onDownload();
    clearInterval(interval);
    setExportProgress(1);
    setSavedIdx(idx);
    setExporting(false);
    setTimeout(() => { setSavedIdx(null); setExportProgress(0); }, 1500);
  };

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute', inset: 0, zIndex: 80,
        background: '#000', display: 'flex', flexDirection: 'column',
      }}>
      {/* Progress bar */}
      {exporting && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.1)' }}>
          <div style={{ height: '100%', width: `${exportProgress * 100}%`, background: '#fff', transition: 'width 0.15s' }} />
        </div>
      )}

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', height: 44,
        paddingTop: 'env(safe-area-inset-top, 0px)', paddingLeft: 16,
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ChevronLeft size={24} strokeWidth={1.5} color="rgba(255,255,255,0.7)" />
        </button>
      </div>

      {/* Preview */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        <img src={photoUrl} alt="Preview"
          style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain' }} />
      </div>

      {/* Export rows */}
      <div style={{ padding: '20px 24px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
        {rows.map((row, i) => (
          <button key={i} onClick={() => handleRow(i)}
            style={{
              display: 'flex', flexDirection: 'column', gap: 2,
              width: '100%', padding: '16px 0',
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
            <span style={{
              fontFamily: '"DM Sans", sans-serif', fontSize: 15,
              color: savedIdx === i ? '#fff' : 'rgba(255,255,255,0.8)',
            }}>
              {savedIdx === i ? 'Saved ✓' : row.label}
            </span>
            <span style={{
              fontFamily: '"DM Sans", sans-serif', fontSize: 12,
              color: 'rgba(255,255,255,0.3)',
            }}>
              {row.sub}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
