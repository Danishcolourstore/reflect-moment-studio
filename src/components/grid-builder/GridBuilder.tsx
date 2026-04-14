import { useState, useCallback, useEffect, useRef } from "react";
import { ArrowLeft, Grid3X3 } from "lucide-react";
import { useDeviceDetect } from "@/hooks/use-device-detect";
import GridLayoutSelector from "./GridLayoutSelector";
import GridEditor from "./GridEditor";
import { type GridLayout, type GridCellData, createCellsForLayout, CANVAS_FORMATS, type CanvasFormat } from "./types";
import { type TextLayer } from "./text-overlay-types";
import { type DesignElement } from "./element-types";
import { type LogoLayer } from "./LogoOverlay";
import { type BackgroundStyle, DEFAULT_BG } from "./BackgroundStyler";

interface Props {
  onClose: () => void;
}

export default function GridBuilder({ onClose }: Props) {
  const [selectedLayout, setSelectedLayout] = useState<GridLayout | null>(null);
  const [cells, setCells] = useState<GridCellData[]>([]);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [logo, setLogo] = useState<LogoLayer | null>(null);
  const [background, setBackground] = useState<BackgroundStyle>(DEFAULT_BG);
  const [format, setFormat] = useState<CanvasFormat>(CANVAS_FORMATS[0]);
  const device = useDeviceDetect();
  const isMobile = device.isPhone;

  // Track blob URLs for cleanup
  const blobUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      blobUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const trackBlob = useCallback((url: string) => {
    blobUrls.current.add(url);
    return url;
  }, []);

  const revokeBlob = useCallback((url: string) => {
    URL.revokeObjectURL(url);
    blobUrls.current.delete(url);
  }, []);

  const handleSelectLayout = useCallback((layout: GridLayout) => {
    setSelectedLayout(layout);
    setCells(createCellsForLayout(layout));
    setTextLayers([]);
    setElements([]);
    setLogo(null);
    setBackground(DEFAULT_BG);
  }, []);

  const handleBack = useCallback(() => {
    // Revoke all cell blobs
    cells.forEach((c) => {
      if (c.imageUrl) revokeBlob(c.imageUrl);
    });
    if (logo?.imageUrl) revokeBlob(logo.imageUrl);
    setSelectedLayout(null);
    setCells([]);
    setTextLayers([]);
    setElements([]);
    setLogo(null);
  }, [cells, logo, revokeBlob]);

  if (selectedLayout) {
    return (
      <GridEditor
        layout={selectedLayout}
        cells={cells}
        setCells={setCells}
        textLayers={textLayers}
        setTextLayers={setTextLayers}
        elements={elements}
        setElements={setElements}
        logo={logo}
        setLogo={setLogo}
        background={background}
        setBackground={setBackground}
        format={format}
        setFormat={setFormat}
        trackBlob={trackBlob}
        revokeBlob={revokeBlob}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ paddingBottom: isMobile ? 72 : 0 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-background sticky top-0 z-20">
        <button onClick={onClose} className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Grid3X3 className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold tracking-wide text-foreground">Grid Builder</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <p className="text-[10px] tracking-[0.14em] uppercase text-muted-foreground/60 font-medium mb-4">
          Choose a layout to start
        </p>
        <GridLayoutSelector onSelect={handleSelectLayout} />
      </div>
    </div>
  );
}
