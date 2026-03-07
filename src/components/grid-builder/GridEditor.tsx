import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Type, Shapes, Image, Palette, Eye, Stamp, Instagram } from 'lucide-react';
import InstagramCarouselPreview from './InstagramCarouselPreview';
import type { GridLayout, GridCellData, CanvasFormat } from './types';
import { createCellsForLayout, CANVAS_FORMATS } from './types';
import type { TextLayer } from './text-overlay-types';
import { GOOGLE_FONTS_URL } from './text-overlay-types';
import type { DesignElement } from './element-types';
import type { LogoLayer } from './LogoOverlay';
import { BackgroundStyle, DEFAULT_BG, bgToCss } from './BackgroundStyler';
import GridCell from './GridCell';
import TextOverlay from './TextOverlay';
import TextToolbar from './TextToolbar';
import ElementOverlay from './ElementOverlay';
import ElementToolbar from './ElementToolbar';
import SafeAreaGuides from './SafeAreaGuides';
import BackgroundStyler from './BackgroundStyler';
import LogoOverlayComponent from './LogoOverlay';
import LogoToolbar from './LogoToolbar';
import SmartFillUploader from './SmartFillUploader';
import DownloadGridButton from './DownloadGridButton';
import CarouselExporter from './CarouselExporter';
import CarouselSliceExporter from './CarouselSliceExporter';

interface Props {
  layout: GridLayout;
  onBack: () => void;
  initialTextLayers?: TextLayer[];
}

type ActiveTool = 'text' | 'elements' | 'background' | 'logo' | null;

export default function GridEditor({ layout, onBack, initialTextLayers = [] }: Props) {
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

  useEffect(() => {
    if (!document.querySelector('link[data-grid-fonts]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = GOOGLE_FONTS_URL;
      link.setAttribute('data-grid-fonts', 'true');
      document.head.appendChild(link);
    }
  }, []);

  const fileToUrl = (file: File): string => URL.createObjectURL(file);

  const updateCell = useCallback((index: number, patch: Partial<GridCellData>) => {
    setCells((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }, []);

  const handleImageAdd = useCallback((index: number, file: File) => {
    setCells((prev) => {
      const old = prev[index];
      if (old.imageUrl) URL.revokeObjectURL(old.imageUrl);
      return prev;
    });
    const url = fileToUrl(file);
    updateCell(index, { imageUrl: url, file, offsetX: 0, offsetY: 0, scale: 1 });
  }, [updateCell]);

  const handleImageRemove = useCallback((index: number) => {
    setCells((prev) => {
      const old = prev[index];
      if (old.imageUrl) URL.revokeObjectURL(old.imageUrl);
      return prev;
    });
    updateCell(index, { imageUrl: null, file: null, offsetX: 0, offsetY: 0, scale: 1 });
  }, [updateCell]);

  const handleOffsetChange = useCallback((index: number, x: number, y: number) => {
    updateCell(index, { offsetX: x, offsetY: y });
  }, [updateCell]);

  const handleSmartFill = useCallback((files: File[]) => {
    setCells((prev) => {
      prev.forEach((c) => { if (c.imageUrl) URL.revokeObjectURL(c.imageUrl); });
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
      prev.forEach((c) => { if (c.imageUrl) URL.revokeObjectURL(c.imageUrl); });
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
  const handleAddLogo = useCallback((l: LogoLayer) => {
    if (logo?.imageUrl) URL.revokeObjectURL(logo.imageUrl);
    setLogo(l);
    setLogoSelected(true);
    setSelectedTextId(null);
    setSelectedElementId(null);
  }, [logo]);

  const handleUpdateLogo = useCallback((patch: Partial<LogoLayer>) => {
    setLogo((prev) => prev ? { ...prev, ...patch } : prev);
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

  const toggleTool = (tool: ActiveTool) => setActiveTool((prev) => (prev === tool ? null : tool));

  const filledCount = cells.filter((c) => c.imageUrl).length;
  const hasFrame = !!layout.frame;
  const canvasRatio = layout.canvasRatio || format.ratio;

  // Compute background for canvas
  const canvasBg = hasFrame ? layout.frame!.background : bgToCss(background);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs tracking-wider uppercase font-medium">{layout.name}</span>
          </button>
          {/* Format selector */}
          {!layout.canvasRatio && (
            <div className="flex items-center gap-0.5 bg-muted/50 rounded-full p-0.5">
              {CANVAS_FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wider transition-colors ${
                    format.id === f.id
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {/* Tool toggles */}
            {([
              { tool: 'text' as const, Icon: Type, label: 'Text' },
              { tool: 'elements' as const, Icon: Shapes, label: 'Elements' },
              { tool: 'background' as const, Icon: Palette, label: 'BG' },
              { tool: 'logo' as const, Icon: Stamp, label: 'Logo' },
            ]).map(({ tool, Icon }) => (
              <button
                key={tool}
                onClick={() => toggleTool(tool)}
                className={`h-8 w-8 rounded-full border flex items-center justify-center transition-colors ${
                  activeTool === tool ? 'border-foreground/40 bg-foreground/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}

            {/* Safe area toggle */}
            <button
              onClick={() => setShowSafeArea(!showSafeArea)}
              className={`h-8 w-8 rounded-full border flex items-center justify-center transition-colors ${
                showSafeArea ? 'border-foreground/40 bg-foreground/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
              title="Safe Area Guides"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleReset}
              className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <SmartFillUploader totalCells={cells.length} onFiles={handleSmartFill} />
          </div>
        </div>
      </div>

      {/* Grid canvas */}
      <div className="flex-1 flex items-start justify-center px-4 pt-5 pb-40" onClick={deselectAll}>
        <div
          ref={gridRef}
          className="w-full max-w-[440px] rounded-2xl overflow-hidden border border-border shadow-sm relative"
          style={{
            aspectRatio: canvasRatio,
            background: canvasBg,
          }}
        >
          {/* Grain overlay */}
          {!hasFrame && background.type === 'grain' && (
            <div className="absolute inset-0 pointer-events-none opacity-20 z-[1]" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
            }} />
          )}

          {/* Frame padding wrapper */}
          <div
            className="w-full h-full relative"
            style={{
              padding: hasFrame
                ? `${layout.frame!.padding[0]}% ${layout.frame!.padding[1]}% ${layout.frame!.padding[2]}% ${layout.frame!.padding[3]}%`
                : '3px',
            }}
          >
            <div
              className="w-full h-full overflow-hidden relative"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
                gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
                gap: hasFrame ? '0px' : '3px',
                borderRadius: hasFrame && layout.frame!.imageRadius ? `${layout.frame!.imageRadius}px` : undefined,
                boxShadow: hasFrame && layout.frame!.shadow ? '0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)' : undefined,
                border: hasFrame && layout.frame!.borderWidth ? `${layout.frame!.borderWidth}px solid ${layout.frame!.borderColor}` : undefined,
              }}
            >
              {layout.cells.map((area, i) => (
                <GridCell
                  key={cells[i].id}
                  cell={cells[i]}
                  gridArea={`${area[0]} / ${area[1]} / ${area[2]} / ${area[3]}`}
                  onImageAdd={(f) => handleImageAdd(i, f)}
                  onImageRemove={() => handleImageRemove(i)}
                  onOffsetChange={(x, y) => handleOffsetChange(i, x, y)}
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
              onSelect={() => { setSelectedElementId(el.id); setSelectedTextId(null); setLogoSelected(false); }}
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
              onSelect={() => { setLogoSelected(true); setSelectedTextId(null); setSelectedElementId(null); }}
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
              onSelect={() => { setSelectedTextId(layer.id); setSelectedElementId(null); setLogoSelected(false); }}
              onDelete={() => deleteTextLayer(layer.id)}
            />
          ))}

          {/* Safe area guides */}
          {showSafeArea && <SafeAreaGuides canvasRatio={canvasRatio} />}
        </div>
      </div>

      {/* Active tool panel */}
      {activeTool && (
        <div className="fixed bottom-[60px] left-0 right-0 z-30">
          {activeTool === 'text' && (
            <TextToolbar layers={textLayers} selectedId={selectedTextId} onAddLayer={addTextLayer} onUpdateLayer={updateTextLayer} />
          )}
          {activeTool === 'elements' && (
            <ElementToolbar elements={elements} selectedId={selectedElementId} onAddElement={addElement} onUpdateElement={updateElement} />
          )}
          {activeTool === 'background' && !hasFrame && (
            <BackgroundStyler value={background} onChange={setBackground} />
          )}
          {activeTool === 'logo' && (
            <LogoToolbar logo={logo} onAddLogo={handleAddLogo} onUpdateLogo={handleUpdateLogo} />
          )}
        </div>
      )}

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border px-3 py-3 safe-area-pb">
        <div className="max-w-[480px] mx-auto flex items-center justify-between gap-2">
          <button
            onClick={() => filledCount > 0 && setShowIgPreview(true)}
            disabled={filledCount === 0}
            className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase font-medium text-foreground disabled:text-muted-foreground/40 transition-colors"
          >
            <Instagram className="h-3.5 w-3.5" />
            Preview
          </button>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <CarouselSliceExporter cells={cells} />
            <CarouselExporter layout={layout} cells={cells} gridRef={gridRef} textLayers={textLayers} />
            <DownloadGridButton gridRef={gridRef} cells={cells} layout={layout} textLayers={textLayers} elements={elements} logo={logo} background={background} />
          </div>
        </div>
      </div>

      {/* Instagram Preview Modal */}
      {showIgPreview && (
        <InstagramCarouselPreview
          images={cells.filter((c) => c.imageUrl).map((c) => c.imageUrl!)}
          onClose={() => setShowIgPreview(false)}
        />
      )}
    </div>
  );
}
