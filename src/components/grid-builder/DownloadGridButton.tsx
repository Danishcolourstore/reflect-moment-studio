import { useState } from "react";
import { Download, Check, Loader2 } from "lucide-react";
import JSZip from "jszip";
import type { GridLayout, GridCellData, CanvasFormat, FreePosition } from "./types";
import { CANVAS_FORMATS } from "./types";
import type { TextLayer } from "./text-overlay-types";
import type { DesignElement } from "./element-types";
import type { LogoLayer } from "./LogoOverlay";
import type { BackgroundStyle } from "./BackgroundStyler";
import { renderGridToCanvas, loadImageElement, drawCellToCanvas } from "./export-utils";
import { clearDraft } from "./grid-draft";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const JPEG_QUALITY = 0.95;
const MIN_EXPORT_WIDTH = 1080;

function exportErrorDetail(err: unknown): string | undefined {
  const msg = err instanceof Error ? err.message : "";
  if (msg.includes("tainted") || msg.includes("load") || msg.includes("SecurityError")) {
    return "Re-add frames from this device if gallery URLs block saving.";
  }
  return msg || undefined;
}

function canvasToJpeg(canvas: HTMLCanvasElement): string {
  try {
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } catch {
    throw new Error("Canvas is tainted — use frames added on this device.");
  }
}

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode JPEG"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function resolveExportWidth(cells: GridCellData[], format: CanvasFormat): Promise<number> {
  let maxW = Math.max(format.exportWidth, MIN_EXPORT_WIDTH);

  for (const cell of cells) {
    if (!cell.imageUrl) continue;
    try {
      const img = await loadImageElement(cell.imageUrl);
      maxW = Math.max(maxW, img.naturalWidth);
    } catch {
      /* skip unreadable frames */
    }
  }

  return maxW;
}

function isCarouselLayout(layout: GridLayout): boolean {
  return layout.id === "post-carousel" || (layout.category === "instagram" && layout.cells.length > 1);
}

interface Props {
  gridRef: React.RefObject<HTMLDivElement | null>;
  cells: GridCellData[];
  layout: GridLayout;
  textLayers?: TextLayer[];
  elements?: DesignElement[];
  logo?: LogoLayer | null;
  background?: BackgroundStyle;
  format?: CanvasFormat;
  freePositions?: FreePosition[] | null;
  mobileFullWidth?: boolean;
  disabled?: boolean;
  label?: string;
}

export default function DownloadGridButton({
  gridRef: _gridRef,
  cells,
  layout,
  textLayers = [],
  elements = [],
  logo = null,
  background,
  format,
  freePositions = null,
  mobileFullWidth = false,
  disabled = false,
  label = "Save & Export",
}: Props) {
  const [exporting, setExporting] = useState(false);
  const [readyCover, setReadyCover] = useState<string | null>(null);

  const activeFormat = format || CANVAS_FORMATS[0];
  const filledCount = cells.filter((c) => c.imageUrl).length;
  const isDisabled = disabled || exporting || filledCount === 0;

  const showReadyMoment = (previewUrl: string) => {
    clearDraft();
    setReadyCover(previewUrl);
    window.setTimeout(() => setReadyCover(null), 2000);
  };

  const exportCarouselSlides = async (ts: string) => {
    const zip = new JSZip();
    const slideW = await resolveExportWidth(cells, activeFormat);
    const slideH = slideW;

    let previewUrl: string | null = null;

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (!cell.imageUrl) continue;

      const canvas = document.createElement("canvas");
      canvas.width = slideW;
      canvas.height = slideH;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#111111";
      ctx.fillRect(0, 0, slideW, slideH);

      const img = await loadImageElement(cell.imageUrl);
      drawCellToCanvas(ctx, cell, img, slideW, slideH);

      const blob = await canvasToJpegBlob(canvas);
      zip.file(`slide-${String(i + 1).padStart(2, "0")}.jpg`, blob);

      if (!previewUrl) previewUrl = canvasToJpeg(canvas);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.download = `mirror-post-${ts}.zip`;
    link.href = URL.createObjectURL(zipBlob);
    link.click();
    URL.revokeObjectURL(link.href);

    showReadyMoment(previewUrl || "");
  };

  const exportComposite = async (ts: string) => {
    const ratio = layout.canvasRatio || activeFormat.ratio;
    const exportW = await resolveExportWidth(cells, activeFormat);
    const exportH = Math.round(exportW / ratio);

    const canvas = await renderGridToCanvas(
      layout,
      cells,
      exportW,
      exportH,
      textLayers,
      elements,
      logo,
      background,
      freePositions,
    );

    const dataUrl = canvasToJpeg(canvas);

    const link = document.createElement("a");
    link.download = `mirror-post-${ts}.jpg`;
    link.href = dataUrl;
    link.click();

    showReadyMoment(dataUrl);
  };

  const runExport = async () => {
    setExporting(true);
    try {
      const ts = timestamp();

      if (isCarouselLayout(layout)) {
        await exportCarouselSlides(ts);
      } else {
        await exportComposite(ts);
      }
    } catch (err) {
      console.error("Export failed", err);
      toast.error("Export did not complete", { description: exportErrorDetail(err) });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={runExport}
        disabled={isDisabled}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 font-sans uppercase tracking-[0.1em] transition-colors duration-200 active:scale-[0.98]",
          mobileFullWidth ? "w-full px-6 py-4 text-[11px]" : "px-4 py-2.5 text-[10px]",
          isDisabled
            ? "cursor-not-allowed bg-[#1a1a1a] text-[#E8E0D5]/25"
            : "bg-[#C8A97E] text-[#0D0B09] hover:bg-[#d4b78d]",
        )}
      >
        {exporting ? (
          <Loader2 className={mobileFullWidth ? "h-4 w-4 animate-spin" : "h-3.5 w-3.5 animate-spin"} strokeWidth={1.5} />
        ) : (
          <Download className={mobileFullWidth ? "h-4 w-4" : "h-3.5 w-3.5"} strokeWidth={1.5} />
        )}
        <span>{exporting ? "Saving" : label}</span>
      </button>

      {readyCover && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[#0D0B09] px-8"
          style={{ animation: "gridReadyFade 240ms ease-out" }}
        >
          <div className="flex items-center gap-2 text-[#C8A97E]">
            <Check className="h-4 w-4" strokeWidth={1.5} />
            <span className="font-serif text-lg italic">Mirror</span>
          </div>

          <img
            src={readyCover}
            alt=""
            className="max-h-[56vh] max-w-full object-contain"
            style={{ border: "1px solid #242424", boxShadow: "0 24px 70px -24px rgba(0,0,0,0.8)" }}
          />

          <p className="font-serif text-4xl italic text-[#E8E0D5]">Ready.</p>

          <style>{`@keyframes gridReadyFade { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
      )}
    </>
  );
}
