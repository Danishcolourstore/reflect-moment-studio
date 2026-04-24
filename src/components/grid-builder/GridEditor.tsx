import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useDeviceDetect } from "@/hooks/use-device-detect";
import {
  ArrowLeft,
  RotateCcw,
  Type,
  Shapes,
  Palette,
  Stamp,
  Instagram,
  MessageSquare,
  Eye,
  Download,
  GripHorizontal,
  Undo2,
  Redo2,
} from "lucide-react";
import AICaptionGenerator from "./AICaptionGenerator";
import InstagramCarouselPreview from "./InstagramCarouselPreview";
import type { GridLayout, GridCellData, CanvasFormat } from "./types";
import { createCellsForLayout, CANVAS_FORMATS } from "./types";
import type { TextLayer } from "./text-overlay-types";
import { GOOGLE_FONTS_URL } from "./text-overlay-types";
import { preloadCommonFonts } from "./font-library";
import type { DesignElement } from "./element-types";
import type { LogoLayer } from "./LogoOverlay";
import { BackgroundStyle, DEFAULT_BG, bgToCss } from "./BackgroundStyler";
import GridCell from "./GridCell";
import TextOverlay from "./TextOverlay";
import TextToolbar from "./TextToolbar";
import ElementOverlay from "./ElementOverlay";
import ElementToolbar from "./ElementToolbar";
import SafeAreaGuides from "./SafeAreaGuides";
import BackgroundStyler from "./BackgroundStyler";
import LogoOverlayComponent from "./LogoOverlay";
import LogoToolbar from "./LogoToolbar";
import SmartFillUploader from "./SmartFillUploader";
import DownloadGridButton from "./DownloadGridButton";
import CarouselExporter from "./CarouselExporter";
import CarouselSliceExporter from "./CarouselSliceExporter";
import { cn } from "@/lib/utils";
import { memo } from "react";

/** Stable-callback wrapper so GridCell memo isn't defeated by inline closures */
const MemoGridCellWrapper = memo(function MemoGridCellWrapper({
  cell,
  index,
  area,
  onImageAdd,
  onImageRemove,
  onOffsetChange,
}: {
  cell: GridCellData;
  index: number;
  area: [number, number, number, number];
  onImageAdd: (i: number, f: File) => void;
  onImageRemove: (i: number) => void;
  onOffsetChange: (i: number, x: number, y: number, scale?: number) => void;
}) {
  const addCb = useCallback((f: File) => onImageAdd(index, f), [index, onImageAdd]);
  const removeCb = useCallback(() => onImageRemove(index), [index, onImageRemove]);
  const offsetCb = useCallback(
    (x: number, y: number, scale?: number) => onOffsetChange(index, x, y, scale),
    [index, onOffsetChange],
  );
  const gridArea = `${area[0]} / ${area[1]} / ${area[2]} / ${area[3]}`;
  return (
    <GridCell cell={cell} gridArea={gridArea} onImageAdd={addCb} onImageRemove={removeCb} onOffsetChange={offsetCb} />
  );
});

interface Props {
  layout: GridLayout;
  onBack: () => void;
  initialTextLayers?: TextLayer[];
}

type ActiveTool = "text" | "elements" | "background" | "logo" | "caption" | null;

export default function GridEditor({ layout, onBack, initialTextLayers = [] }: Props) {
  const device = useDeviceDetect();
  const isMobile = device.isPhone;
  const [cells, setCells] = useState<GridCellData[]>(() => createCellsForLayout(layout));
  const [textLayers, setTextLayers] = useState<TextLayer[]>(initialTextLayers);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [logo, setLogo] = useState<LogoLayer | null>(null);
  const [logoSelected, setLogoSelected] = useState(false);
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [background, setBackground] = useState<BackgroundStyle>(DEFAULT_BG);
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [showIgPreview, setShowIgPreview] = useState(false);
  const [format, setFormat] = useState<CanvasFormat>(CANVAS_FORMATS[0]);
  const gridRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const toolPanelRef = useRef<HTMLDivElement>(null);
  const [bottomBarH, setBottomBarH] = useState(96);
  const [toolPanelH, setToolPanelH] = useState(0);

  // ─── Undo/Redo History ───
  const MAX_HISTORY = 30;
  const historyRef = useRef<
    Array<{
      cells: GridCellData[];
      textLayers: TextLayer[];
      elements: DesignElement[];
      logo: LogoLayer | null;
      background: BackgroundStyle;
    }>
  >([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);

  const pushHistory = useCallback(() => {
    if (isUndoRedoRef.current) return;
    const snapshot = {
      cells: cells.map((c) => ({ ...c })),
      textLayers: textLayers.map((t) => ({ ...t })),
      elements: elements.map((e) => ({ ...e })),
      logo: logo ? { ...logo } : null,
      background: { ...background },
    };
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(snapshot);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
  }, [cells, textLayers, elements, logo, background]);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    isUndoRedoRef.current = true;
    historyIndexRef.current -= 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    setCells(snapshot.cells.map((c) => ({ ...c })));
    setTextLayers(snapshot.textLayers.map((t) => ({ ...t })));
    setElements(snapshot.elements.map((e) => ({ ...e })));
    setLogo(snapshot.logo ? { ...snapshot.logo } : null);
    setBackground({ ...snapshot.background });
    setTimeout(() => {
      isUndoRedoRef.current = false;
    }, 50);
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    isUndoRedoRef.current = true;
    historyIndexRef.current += 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    setCells(snapshot.cells.map((c) => ({ ...c })));
    setTextLayers(snapshot.textLayers.map((t) => ({ ...t })));
    setElements(snapshot.elements.map((e) => ({ ...e })));
    setLogo(snapshot.logo ? { ...snapshot.logo } : null);
    setBackground({ ...snapshot.background });
    setTimeout(() => {
      isUndoRedoRef.current = false;
    }, 50);
  }, []);

  // Push initial state on mount
  useEffect(() => {
    if (historyRef.current.length === 0) pushHistory();
  }, []);

  // Debounced history push on state changes
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isUndoRedoRef.current) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      pushHistory();
    }, 500);
    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  }, [cells, textLayers, elements, logo, background]);

  // Panel drag-to-dismiss
  const [panelDragY, setPanelDragY] = useState(0);
  const panelDragStart = useRef<number | null>(null);

  useEffect(() => {
    if (!document.querySelector("link[data-grid-fonts]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = GOOGLE_FONTS_URL;
      link.setAttribute("data-grid-fonts", "true");
      document.head.appendChild(link);
    }
    preloadCommonFonts();
  }, []);

  // Keyboard shortcuts: Ctrl+Z undo, Ctrl+Shift+Z / Ctrl+Y redo, Delete key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((mod && e.key === "z" && e.shiftKey) || (mod && e.key === "y")) {
        e.preventDefault();
        redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
        if (selectedTextId) {
          e.preventDefault();
          deleteTextLayer(selectedTextId);
        } else if (selectedElementId) {
          e.preventDefault();
          deleteElement(selectedElementId);
        } else if (logoSelected && logo) {
          e.preventDefault();
          handleDeleteLogo();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, selectedTextId, selectedElementId, logoSelected, logo]);

  // Measure bottom bar + tool panel so canvas can reserve space and never be hidden
  useEffect(() => {
    const measure = () => {
      if (bottomBarRef.current) setBottomBarH(bottomBarRef.current.offsetHeight);
      setToolPanelH(toolPanelRef.current?.offsetHeight ?? 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (bottomBarRef.current) ro.observe(bottomBarRef.current);
    if (toolPanelRef.current) ro.observe(toolPanelRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [activeTool]);

  const fileToUrl = (file: File): string => URL.createObjectURL(file);

  const updateCell = useCallback((index: number, patch: Partial<GridCellData>) => {
    setCells((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }, []);

  const handleImageAdd = useCallback(
    (index: number, file: File) => {
      setCells((prev) => {
        const old = prev[index];
        if (old.imageUrl) URL.revokeObjectURL(old.imageUrl);
        return prev;
      });
      const url = fileToUrl(file);
      updateCell(index, { imageUrl: url, file, offsetX: 0, offsetY: 0, scale: 1 });
    },
    [updateCell],
  );

  const handleImageRemove = useCallback(
    (index: number) => {
      setCells((prev) => {
        const old = prev[index];
        if (old.imageUrl) URL.revokeObjectURL(old.imageUrl);
        return prev;
      });
      updateCell(index, { imageUrl: null, file: null, offsetX: 0, offsetY: 0, scale: 1 });
    },
    [updateCell],
  );

  const handleOffsetChange = useCallback(
    (index: number, x: number, y: number, scale?: number) => {
      updateCell(index, { offsetX: x, offsetY: y, ...(scale !== undefined ? { scale } : {}) });
    },
    [updateCell],
  );

  const handleSmartFill = useCallback((files: File[]) => {
    setCells((prev) => {
      prev.forEach((c) => {
        if (c.imageUrl) URL.revokeObjectURL(c.imageUrl);
      });
      return prev.map((c, i) => {
        if (i < files.length) {
          return { ...c, imageUrl: fileToUrl(files[i]), file: files[i], offsetX: 0, offsetY: 0, scale: 1 };
        }
        return { ...c, imageUrl: null, file: null, offsetX: 0, offsetY: 0, scale: 1 };
      });
    });
  }, []);

  const handleReset = useCallback(() => {
    setCells((prev) => {
      prev.forEach((c) => {
        if (c.imageUrl) URL.revokeObjectURL(c.imageUrl);
      });
      return createCellsForLayout(layout);
    });
    setTextLayers([]);
    setSelectedTextId(null);
    setElements([]);
    setSelectedElementId(null);
    if (logo?.imageUrl) URL.revokeObjectURL(logo.imageUrl);
    setLogo(null);
    setLogoSelected(false);
    setBackground(DEFAULT_BG);
  }, [layout, logo]);

  // Text layer handlers
  const addTextLayer = useCallback((layer: TextLayer) => {
    setTextLayers((prev) => [...prev, layer]);
    setSelectedTextId(layer.id);
    setSelectedElementId(null);
    setLogoSelected(false);
  }, []);

  const updateTextLayer = useCallback((id: string, patch: Partial<TextLayer>) => {
    setTextLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const deleteTextLayer = useCallback((id: string) => {
    setTextLayers((prev) => prev.filter((l) => l.id !== id));
    setSelectedTextId(null);
  }, []);

  // Element handlers
  const addElement = useCallback((el: DesignElement) => {
    setElements((prev) => [...prev, el]);
    setSelectedElementId(el.id);
    setSelectedTextId(null);
    setLogoSelected(false);
  }, []);

  const updateElement = useCallback((id: string, patch: Partial<DesignElement>) => {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
    setSelectedElementId(null);
  }, []);

  // Logo handlers
  const handleAddLogo = useCallback(
    (l: LogoLayer) => {
      if (logo?.imageUrl) URL.revokeObjectURL(logo.imageUrl);
      setLogo(l);
      setLogoSelected(true);
      setSelectedTextId(null);
      setSelectedElementId(null);
    },
    [logo],
  );

  const handleUpdateLogo = useCallback((patch: Partial<LogoLayer>) => {
    setLogo((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const handleDeleteLogo = useCallback(() => {
    if (logo?.imageUrl) URL.revokeObjectURL(logo.imageUrl);
    setLogo(null);
    setLogoSelected(false);
  }, [logo]);

  const deselectAll = useCallback(() => {
    setSelectedTextId(null);
    setSelectedElementId(null);
    setLogoSelected(false);
  }, []);

  const toggleTool = useCallback((tool: ActiveTool) => setActiveTool((prev) => (prev === tool ? null : tool)), []);

  const filledCount = useMemo(() => cells.filter((c) => c.imageUrl).length, [cells]);
  const hasFrame = !!layout.frame;
  const canvasRatio = layout.canvasRatio || format.ratio;
  const canvasBg = useMemo(
    () => (hasFrame ? layout.frame!.background : bgToCss(background)),
    [hasFrame, layout.frame, background],
  );

  const toolButtons: { tool: ActiveTool; Icon: any; label: string }[] = [
    { tool: "text", Icon: Type, label: "Text" },
    { tool: "elements", Icon: Shapes, label: "Shapes" },
    { tool: "background", Icon: Palette, label: "BG" },
    { tool: "logo", Icon: Stamp, label: "Logo" },
    { tool: "caption", Icon: MessageSquare, label: "Caption" },
  ];

  // Panel drag handlers — use refs to avoid re-render during drag
  const handlePanelDragStart = useCallback((e: React.TouchEvent) => {
    panelDragStart.current = e.touches[0].clientY;
    setPanelDragY(0);
  }, []);
  const handlePanelDragMove = useCallback((e: React.TouchEvent) => {
    if (panelDragStart.current === null) return;
    const dy = e.touches[0].clientY - panelDragStart.current;
    if (dy > 0) setPanelDragY(dy);
  }, []);
  const handlePanelDragEnd = useCallback(() => {
    if (panelDragY > 80) setActiveTool(null);
    setPanelDragY(0);
    panelDragStart.current = null;
  }, [panelDragY]);

  // Format dimensions label
  const formatDimLabel = (f: CanvasFormat) => {
    return `${f.label} (${f.exportWidth}×${f.exportHeight})`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ─── Compact Header ─── */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className={cn("flex items-center justify-between h-12", isMobile ? "px-3" : "px-4")}>
          {/* Back + layout name */}
          <button
            onClick={onBack}
            className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors group min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[11px] tracking-wider uppercase font-medium truncate max-w-[100px]">
              {layout.name}
            </span>
          </button>

          {/* Format selector with dimensions */}
          {!layout.canvasRatio && (
            <div className="flex items-center gap-0.5 bg-muted/40 rounded-full p-0.5">
              {CANVAS_FORMATS.slice(0, 3).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f)}
                  className={cn(
                    "rounded-full font-medium tracking-wider transition-all duration-300 flex flex-col items-center leading-tight",
                    isMobile ? "px-2.5 py-2 text-[10px] min-h-[36px]" : "px-2.5 py-1.5 text-[9px]",
                    format.id === f.id
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground/60 hover:text-foreground",
                  )}
                  title={formatDimLabel(f)}
                >
                  <span>{f.label}</span>
                  {!isMobile && (
                    <span className="text-[7px] opacity-60 tabular-nums">
                      {f.exportWidth}×{f.exportHeight}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Utility actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={cn(
                "rounded-lg flex items-center justify-center transition-all duration-200",
                isMobile ? "h-10 w-10" : "h-8 w-8",
                canUndo
                  ? "text-muted-foreground/50 hover:text-foreground hover:bg-muted/50"
                  : "text-muted-foreground/20 cursor-not-allowed",
              )}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={cn(
                "rounded-lg flex items-center justify-center transition-all duration-200",
                isMobile ? "h-10 w-10" : "h-8 w-8",
                canRedo
                  ? "text-muted-foreground/50 hover:text-foreground hover:bg-muted/50"
                  : "text-muted-foreground/20 cursor-not-allowed",
              )}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setShowSafeArea(!showSafeArea)}
              className={cn(
                "rounded-lg flex items-center justify-center transition-all duration-200",
                isMobile ? "h-10 w-10" : "h-8 w-8",
                showSafeArea
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/50",
              )}
              title="Safe Area Guides"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleReset}
              className={cn(
                "rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-all duration-200",
                isMobile ? "h-10 w-10" : "h-8 w-8",
              )}
              title="Reset"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <SmartFillUploader totalCells={cells.length} onFiles={handleSmartFill} />
          </div>
        </div>
      </header>

      {/* ─── Canvas Area — reserves space for bottom bar + tool panel so canvas stays fully visible ─── */}
      <div
        className={cn("flex-1 overflow-y-auto flex items-start justify-center", isMobile ? "px-2 py-3" : "px-4 py-6")}
        style={{
          paddingBottom: `calc(${bottomBarH + toolPanelH + 16}px + env(safe-area-inset-bottom, 0px))`,
        }}
        onClick={deselectAll}
      >
        <div
          ref={gridRef}
          className={cn(
            "w-full rounded-xl overflow-hidden relative my-auto",
            isMobile ? "max-w-[420px]" : "max-w-[560px]",
          )}
          style={{
            aspectRatio: canvasRatio,
            background: canvasBg,
            boxShadow: "0 12px 48px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06)",
            willChange: "auto",
            containIntrinsicSize: "auto",
          }}
        >
          {/* Grain overlay */}
          {!hasFrame && background.type === "grain" && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20 z-[1]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
              }}
            />
          )}

          {/* Frame padding wrapper */}
          <div
            className="w-full h-full relative"
            style={{
              padding: hasFrame
                ? `${layout.frame!.padding[0]}% ${layout.frame!.padding[1]}% ${layout.frame!.padding[2]}% ${layout.frame!.padding[3]}%`
                : "3px",
            }}
          >
            <div
              className="w-full h-full overflow-hidden relative"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
                gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
                gap: hasFrame ? "0px" : "3px",
                borderRadius: hasFrame && layout.frame!.imageRadius ? `${layout.frame!.imageRadius}px` : undefined,
                boxShadow:
                  hasFrame && layout.frame!.shadow
                    ? "0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)"
                    : undefined,
                border:
                  hasFrame && layout.frame!.borderWidth
                    ? `${layout.frame!.borderWidth}px solid ${layout.frame!.borderColor}`
                    : undefined,
              }}
            >
              {layout.cells.map((area, i) => (
                <MemoGridCellWrapper
                  key={cells[i].id}
                  cell={cells[i]}
                  index={i}
                  area={area}
                  onImageAdd={handleImageAdd}
                  onImageRemove={handleImageRemove}
                  onOffsetChange={handleOffsetChange}
                />
              ))}
            </div>
          </div>

          {/* Design element overlays */}
          {elements.map((el) => (
            <ElementOverlay
              key={el.id}
              element={el}
              selected={el.id === selectedElementId}
              containerRef={gridRef}
              onUpdate={(patch) => updateElement(el.id, patch)}
              onSelect={() => {
                setSelectedElementId(el.id);
                setSelectedTextId(null);
                setLogoSelected(false);
              }}
              onDelete={() => deleteElement(el.id)}
            />
          ))}

          {/* Logo overlay */}
          {logo && (
            <LogoOverlayComponent
              logo={logo}
              selected={logoSelected}
              containerRef={gridRef}
              onUpdate={handleUpdateLogo}
              onSelect={() => {
                setLogoSelected(true);
                setSelectedTextId(null);
                setSelectedElementId(null);
              }}
              onDelete={handleDeleteLogo}
            />
          )}

          {/* Text overlays */}
          {textLayers.map((layer) => (
            <TextOverlay
              key={layer.id}
              layer={layer}
              selected={layer.id === selectedTextId}
              containerRef={gridRef}
              onUpdate={(patch) => updateTextLayer(layer.id, patch)}
              onSelect={() => {
                setSelectedTextId(layer.id);
                setSelectedElementId(null);
                setLogoSelected(false);
              }}
              onDelete={() => deleteTextLayer(layer.id)}
            />
          ))}

          {/* Safe area guides */}
          {showSafeArea && <SafeAreaGuides canvasRatio={canvasRatio} />}
        </div>
      </div>

      {/* ─── Tool Panel — anchored above measured bottom-bar height (not hardcoded) ─── */}
      <div
        className="fixed left-0 right-0 z-30"
        style={{ bottom: bottomBarH }}
      >
        {activeTool && (
          <div
            ref={toolPanelRef}
            style={{
              transform: panelDragY > 0 ? `translateY(${panelDragY}px)` : "translateY(0)",
              opacity: panelDragY > 60 ? 0.5 : 1,
              transition: panelDragY > 0 ? "none" : "transform 200ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease",
              animation: "slideUp 200ms cubic-bezier(0.4,0,0.2,1)",
              maxHeight: "55vh",
              overflowY: "auto",
              background: "hsl(var(--card))",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              boxShadow: "0 -8px 24px -12px rgba(0,0,0,0.18)",
            }}
          >
            {/* Drag handle pill */}
            <div
              className="flex justify-center py-2 border-b border-border/40 cursor-grab active:cursor-grabbing sticky top-0 bg-card z-[1]"
              onTouchStart={handlePanelDragStart}
              onTouchMove={handlePanelDragMove}
              onTouchEnd={handlePanelDragEnd}
            >
              <div className="w-8 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            {activeTool === "text" && (
              <TextToolbar
                layers={textLayers}
                selectedId={selectedTextId}
                onAddLayer={addTextLayer}
                onUpdateLayer={updateTextLayer}
              />
            )}
            {activeTool === "elements" && (
              <ElementToolbar
                elements={elements}
                selectedId={selectedElementId}
                onAddElement={addElement}
                onUpdateElement={updateElement}
              />
            )}
            {activeTool === "background" && !hasFrame && (
              <BackgroundStyler value={background} onChange={setBackground} />
            )}
            {activeTool === "logo" && (
              <LogoToolbar logo={logo} onAddLogo={handleAddLogo} onUpdateLogo={handleUpdateLogo} />
            )}
            {activeTool === "caption" && (
              <div className="px-3 py-2">
                <AICaptionGenerator photoCount={filledCount} onClose={() => setActiveTool(null)} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Bottom Bar — auto-height so export row is always visible ─── */}
      <div
        ref={bottomBarRef}
        className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-xl border-t border-border/60"
        style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))" }}
      >
        <div className="max-w-[480px] mx-auto">
          {/* Tool icons */}
          <div className={cn("flex items-center justify-between px-2", isMobile ? "pt-2" : "pt-1.5")}>
            {toolButtons.map(({ tool, Icon, label }) => (
              <button
                key={tool}
                onClick={() => toggleTool(tool)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg transition-all duration-200 relative active:scale-95",
                  isMobile ? "px-3 py-2 min-w-[52px] min-h-[44px]" : "px-3 py-1.5 min-w-[48px]",
                  activeTool === tool ? "text-primary" : "text-muted-foreground/60 hover:text-foreground",
                )}
              >
                <Icon className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                <span className={cn("tracking-wider uppercase font-medium", isMobile ? "text-[9px]" : "text-[8px]")}>
                  {label}
                </span>
                {activeTool === tool && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-primary" />
                )}
              </button>
            ))}

            <div className="h-6 w-px bg-border/60" />

            {/* Preview — primary action */}
            <button
              onClick={() => filledCount > 0 && setShowIgPreview(true)}
              disabled={filledCount === 0}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-xl transition-all duration-200 border disabled:opacity-30 active:scale-95",
                isMobile ? "px-4 py-2 min-w-[56px] min-h-[44px]" : "px-4 py-1.5 min-w-[52px]",
                filledCount > 0
                  ? "border-primary/40 bg-primary/10 text-primary shadow-[0_0_10px_-2px_hsl(var(--primary)/0.35)]"
                  : "border-transparent text-muted-foreground/60",
              )}
            >
              {filledCount > 0 && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.6)]" />
              )}
              <Instagram className={isMobile ? "h-5 w-5" : "h-[18px] w-[18px]"} />
              <span
                className={cn(
                  "tracking-wider uppercase font-semibold text-primary",
                  isMobile ? "text-[9px]" : "text-[8px]",
                )}
              >
                Preview
              </span>
            </button>
          </div>

          {/* Export row */}
          <div className={cn("flex items-center justify-end gap-1.5 px-3 pt-1 pb-1")}>
            <CarouselSliceExporter cells={cells} format={format} />
            <CarouselExporter layout={layout} cells={cells} gridRef={gridRef} textLayers={textLayers} />
            <DownloadGridButton
              gridRef={gridRef}
              cells={cells}
              layout={layout}
              textLayers={textLayers}
              elements={elements}
              logo={logo}
              background={background}
              format={format}
            />
          </div>
        </div>
      </div>

      {/* Instagram Preview Modal */}
      {showIgPreview && (
        <InstagramCarouselPreview
          images={cells.filter((c) => c.imageUrl).map((c) => c.imageUrl!)}
          onClose={() => setShowIgPreview(false)}
          canvasRatio={format.ratio}
        />
      )}
    </div>
  );
}
