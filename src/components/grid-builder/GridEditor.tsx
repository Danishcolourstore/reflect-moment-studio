import { useState, useRef, useCallback } from "react";
import { ArrowLeft, Type, Image, Palette, Download, Layers } from "lucide-react";
import { useDeviceDetect } from "@/hooks/use-device-detect";
import GridCell from "./GridCell";
import TextOverlay from "./TextOverlay";
import TextToolbar from "./TextToolbar";
import LogoOverlayComponent, { createLogoLayer, type LogoLayer } from "./LogoOverlay";
import BackgroundStyler, { bgToCss, type BackgroundStyle } from "./BackgroundStyler";
import DownloadGridButton from "./DownloadGridButton";
import { type GridLayout, type GridCellData, type CanvasFormat, CANVAS_FORMATS } from "./types";
import { type TextLayer, createTextLayer } from "./text-overlay-types";
import { type DesignElement } from "./element-types";

type ToolPanel = "none" | "text" | "background" | "format";

interface Props {
  layout: GridLayout;
  cells: GridCellData[];
  setCells: React.Dispatch<React.SetStateAction<GridCellData[]>>;
  textLayers: TextLayer[];
  setTextLayers: React.Dispatch<React.SetStateAction<TextLayer[]>>;
  elements: DesignElement[];
  setElements: React.Dispatch<React.SetStateAction<DesignElement[]>>;
  logo: LogoLayer | null;
  setLogo: React.Dispatch<React.SetStateAction<LogoLayer | null>>;
  background: BackgroundStyle;
  setBackground: React.Dispatch<React.SetStateAction<BackgroundStyle>>;
  format: CanvasFormat;
  setFormat: React.Dispatch<React.SetStateAction<CanvasFormat>>;
  trackBlob: (url: string) => string;
  revokeBlob: (url: string) => void;
  onBack: () => void;
}

export default function GridEditor({
  layout, cells, setCells,
  textLayers, setTextLayers,
  elements, setElements,
  logo, setLogo,
  background, setBackground,
  format, setFormat,
  trackBlob, revokeBlob,
  onBack,
}: Props) {
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ToolPanel>("none");
  const canvasRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const device = useDeviceDetect();
  const isMobile = device.isPhone;

  const canvasRatio = layout.canvasRatio || format.ratio;

  // ─── Cell handlers ─────────────────────────
  const handleImageAdd = useCallback((index: number, file: File) => {
    const url = trackBlob(URL.createObjectURL(file));
    setCells((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, imageUrl: url, file, offsetX: 0, offsetY: 0, scale: 1 } : c
      )
    );
  }, [setCells, trackBlob]);

  const handleImageRemove = useCallback((index: number) => {
    setCells((prev) =>
      prev.map((c, i) => {
        if (i === index && c.imageUrl) {
          revokeBlob(c.imageUrl);
          return { ...c, imageUrl: null, file: null, offsetX: 0, offsetY: 0, scale: 1 };
        }
        return c;
      })
    );
  }, [setCells, revokeBlob]);

  const handleOffsetChange = useCallback((index: number, x: number, y: number, scale?: number) => {
    setCells((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, offsetX: x, offsetY: y, scale: scale ?? c.scale } : c
      )
    );
  }, [setCells]);

  // ─── Text handlers ─────────────────────────
  const handleAddText = useCallback((layer: TextLayer) => {
    setTextLayers((prev) => [...prev, layer]);
    setSelectedTextId(layer.id);
  }, [setTextLayers]);

  const handleUpdateText = useCallback((id: string, patch: Partial<TextLayer>) => {
    setTextLayers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  }, [setTextLayers]);

  const handleDeleteText = useCallback((id: string) => {
    setTextLayers((prev) => prev.filter((t) => t.id !== id));
    if (selectedTextId === id) setSelectedTextId(null);
  }, [setTextLayers, selectedTextId]);

  // ─── Logo handlers ─────────────────────────
  const handleLogoUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (logo?.imageUrl) revokeBlob(logo.imageUrl);
      const newLogo = createLogoLayer(file);
      trackBlob(newLogo.imageUrl);
      setLogo(newLogo);
      setSelectedLogoId(newLogo.id);
    };
    input.click();
  }, [logo, setLogo, trackBlob, revokeBlob]);

  const handleDeleteLogo = useCallback(() => {
    if (logo?.imageUrl) revokeBlob(logo.imageUrl);
    setLogo(null);
    setSelectedLogoId(null);
  }, [logo, setLogo, revokeBlob]);

  // ─── Canvas click deselects ────────────────
  const handleCanvasClick = useCallback(() => {
    setSelectedTextId(null);
    setSelectedLogoId(null);
  }, []);

  const togglePanel = (p: ToolPanel) => {
    setActivePanel((prev) => (prev === p ? "none" : p));
  };

  return (
    <div className="w-full h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* ─── Header ──────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60 bg-background z-20 shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-foreground">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs tracking-wide">Back</span>
        </button>
        <div className="flex items-center gap-2">
          {/* Format selector */}
          <select
            value={format.id}
            onChange={(e) => {
              const f = CANVAS_FORMATS.find((cf) => cf.id === e.target.value);
              if (f) setFormat(f);
            }}
            className="text-[10px] bg-muted/30 border border-border/60 rounded-lg px-2 py-1.5 text-foreground tracking-wide"
          >
            {CANVAS_FORMATS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
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

      {/* ─── Canvas Area ─────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center overflow-auto p-3"
        onClick={handleCanvasClick}
        style={{ background: "hsl(var(--muted) / 0.3)" }}
      >
        <div
          ref={canvasRef}
          className="relative shadow-xl rounded-sm overflow-hidden"
          style={{
            width: "100%",
            maxWidth: isMobile ? "100%" : "440px",
            aspectRatio: `${canvasRatio}`,
            background: bgToCss(background),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Frame padding wrapper for single layouts */}
          {layout.frame ? (
            <div
              className="absolute overflow-hidden"
              style={{
                top: `${layout.frame.padding[0]}%`,
                right: `${layout.frame.padding[1]}%`,
                bottom: `${layout.frame.padding[2]}%`,
                left: `${layout.frame.padding[3]}%`,
                borderRadius: `${layout.frame.imageRadius}px`,
                boxShadow: layout.frame.shadow
                  ? "0 8px 24px -6px rgba(0,0,0,0.12)"
                  : "none",
                border: layout.frame.borderWidth
                  ? `${layout.frame.borderWidth}px solid ${layout.frame.borderColor}`
                  : "none",
              }}
            >
              <div
                ref={gridRef}
                className="w-full h-full grid"
                style={{
                  gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
                  gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
                  gap: "0px",
                }}
              >
                {layout.cells.map((cell, i) => (
                  <GridCell
                    key={cells[i]?.id || i}
                    cell={cells[i] || { id: `cell-${i}`, imageUrl: null, file: null, offsetX: 0, offsetY: 0, scale: 1 }}
                    gridArea={`${cell[0]} / ${cell[1]} / ${cell[2]} / ${cell[3]}`}
                    onImageAdd={(file) => handleImageAdd(i, file)}
                    onImageRemove={() => handleImageRemove(i)}
                    onOffsetChange={(x, y, s) => handleOffsetChange(i, x, y, s)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div
              ref={gridRef}
              className="absolute inset-0 grid"
              style={{
                gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
                gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
                gap: "3px",
                padding: "3px",
              }}
            >
              {layout.cells.map((cell, i) => (
                <GridCell
                  key={cells[i]?.id || i}
                  cell={cells[i] || { id: `cell-${i}`, imageUrl: null, file: null, offsetX: 0, offsetY: 0, scale: 1 }}
                  gridArea={`${cell[0]} / ${cell[1]} / ${cell[2]} / ${cell[3]}`}
                  onImageAdd={(file) => handleImageAdd(i, file)}
                  onImageRemove={() => handleImageRemove(i)}
                  onOffsetChange={(x, y, s) => handleOffsetChange(i, x, y, s)}
                />
              ))}
            </div>
          )}

          {/* Text overlays */}
          {textLayers.map((layer) => (
            <TextOverlay
              key={layer.id}
              layer={layer}
              selected={selectedTextId === layer.id}
              containerRef={canvasRef}
              onUpdate={(patch) => handleUpdateText(layer.id, patch)}
              onSelect={() => {
                setSelectedTextId(layer.id);
                setSelectedLogoId(null);
              }}
              onDelete={() => handleDeleteText(layer.id)}
            />
          ))}

          {/* Logo overlay */}
          {logo && (
            <LogoOverlayComponent
              logo={logo}
              selected={selectedLogoId === logo.id}
              containerRef={canvasRef}
              onUpdate={(patch) => setLogo((prev) => prev ? { ...prev, ...patch } : prev)}
              onSelect={() => {
                setSelectedLogoId(logo.id);
                setSelectedTextId(null);
              }}
              onDelete={handleDeleteLogo}
            />
          )}
        </div>
      </div>

      {/* ─── Tool Panel (expandable) ─────────── */}
      {activePanel === "text" && (
        <div className="max-h-[40vh] overflow-y-auto border-t border-border/60">
          <TextToolbar
            layers={textLayers}
            selectedId={selectedTextId}
            onAddLayer={handleAddText}
            onUpdateLayer={handleUpdateText}
          />
        </div>
      )}

      {activePanel === "background" && (
        <div className="max-h-[40vh] overflow-y-auto border-t border-border/60">
          <BackgroundStyler value={background} onChange={setBackground} />
        </div>
      )}

      {/* ─── Bottom Toolbar ──────────────────── */}
      <div
        className="flex items-center justify-around border-t border-border/60 bg-background shrink-0"
        style={{
          height: 52,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <ToolButton
          icon={<Type className="h-4 w-4" />}
          label="Text"
          active={activePanel === "text"}
          onClick={() => togglePanel("text")}
        />
        <ToolButton
          icon={<Palette className="h-4 w-4" />}
          label="BG"
          active={activePanel === "background"}
          onClick={() => togglePanel("background")}
        />
        <ToolButton
          icon={<Layers className="h-4 w-4" />}
          label="Logo"
          active={false}
          onClick={handleLogoUpload}
        />
      </div>
    </div>
  );
}

function ToolButton({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors ${
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="text-[9px] tracking-wider uppercase font-medium">{label}</span>
    </button>
  );
}
