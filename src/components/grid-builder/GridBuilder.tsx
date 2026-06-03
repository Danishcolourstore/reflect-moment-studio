import { useState, useCallback, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import GridEditor from "./GridEditor";
import type { GridLayout, GridCellData, CanvasFormat } from "./types";
import { GRID_LAYOUTS, CANVAS_FORMATS } from "./types";
import type { TextLayer } from "./text-overlay-types";
import type { BackgroundStyle } from "./BackgroundStyler";
import { loadDraft, hasDraft } from "./grid-draft";
import { cn } from "@/lib/utils";

interface Props {
  onClose: () => void;
}

/* ── The six layouts a wedding photographer actually posts ── */

function singleLayout(id: string, canvasRatio: number): GridLayout {
  return {
    id,
    name: id,
    category: "single",
    cols: 1,
    rows: 1,
    cells: [[1, 1, 2, 2]],
    gridCols: 1,
    gridRows: 1,
    canvasRatio,
  };
}

function stackLayout(id: string, n: number, canvasRatio: number): GridLayout {
  const cells = Array.from({ length: n }, (_, r) => [r + 1, 1, r + 2, 2]) as [number, number, number, number][];
  return {
    id,
    name: id,
    category: "basic",
    cols: 1,
    rows: n,
    cells,
    gridCols: 1,
    gridRows: n,
    canvasRatio,
  };
}

const carouselLayout: GridLayout = {
  id: "post-carousel",
  name: "Carousel",
  category: "instagram",
  cols: 3,
  rows: 1,
  cells: [
    [1, 1, 2, 2],
    [1, 2, 2, 3],
    [1, 3, 2, 4],
  ],
  gridCols: 3,
  gridRows: 1,
  canvasRatio: 1,
};

interface PostLayout {
  layout: GridLayout;
  label: string;
  sub: string;
}

const POST_LAYOUTS: PostLayout[] = [
  { layout: singleLayout("post-square", 1), label: "Single", sub: "1:1 square" },
  { layout: singleLayout("post-portrait", 4 / 5), label: "Portrait", sub: "4:5" },
  { layout: stackLayout("post-pairing", 2, 4 / 5), label: "Pairing", sub: "Two frames" },
  { layout: stackLayout("post-sequence", 3, 4 / 5), label: "Sequence", sub: "Three frames" },
  { layout: singleLayout("post-story", 9 / 16), label: "Story", sub: "9:16" },
  { layout: carouselLayout, label: "Carousel", sub: "Multi-slide" },
];

function formatForRatio(ratio: number): CanvasFormat {
  if (Math.abs(ratio - 4 / 5) < 0.02) return CANVAS_FORMATS[1];
  if (Math.abs(ratio - 9 / 16) < 0.02) return CANVAS_FORMATS[2];
  return CANVAS_FORMATS[0];
}

function findLayout(id: string): GridLayout | null {
  const post = POST_LAYOUTS.find((p) => p.layout.id === id);
  if (post) return post.layout;
  return GRID_LAYOUTS.find((l) => l.id === id) ?? null;
}

interface EditorInit {
  key: number;
  layout: GridLayout;
  format: CanvasFormat;
  cells?: GridCellData[];
  textLayers?: TextLayer[];
  background?: BackgroundStyle | null;
}

function CarouselStripPreview() {
  return (
    <div className="flex w-full items-center justify-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="aspect-square flex-1 bg-[#2e2e2e] transition-colors duration-200 group-hover:bg-[#C8A97E]/30"
          style={{ border: "1px solid #242424" }}
        />
      ))}
    </div>
  );
}

function LayoutDiagram({ layout }: { layout: GridLayout }) {
  if (layout.id === "post-carousel") {
    return (
      <div className="w-full overflow-hidden bg-[#1a1a1a] p-[3px]" style={{ border: "1px solid #242424" }}>
        <CarouselStripPreview />
      </div>
    );
  }

  const ratio = layout.canvasRatio ?? 1;
  return (
    <div
      className="w-full overflow-hidden bg-[#1a1a1a]"
      style={{ aspectRatio: `${ratio}`, border: "1px solid #242424" }}
    >
      <div
        className="grid h-full w-full p-[3px]"
        style={{
          gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
          gap: "3px",
        }}
      >
        {layout.cells.map((cell, i) => (
          <div
            key={i}
            className="bg-[#2e2e2e] transition-colors duration-200 group-hover:bg-[#C8A97E]/30"
            style={{ gridRow: `${cell[0]} / ${cell[2]}`, gridColumn: `${cell[1]} / ${cell[3]}` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function GridBuilder({ onClose }: Props) {
  const [view, setView] = useState<"layouts" | "editor">("layouts");
  const [editorInit, setEditorInit] = useState<EditorInit | null>(null);
  const [draftAvailable] = useState(() => hasDraft());

  const [expandRect, setExpandRect] = useState<DOMRect | null>(null);
  const [expandFull, setExpandFull] = useState(false);
  const [expandLayout, setExpandLayout] = useState<GridLayout | null>(null);
  const keyRef = useRef(0);

  const openLayout = useCallback((layout: GridLayout, rect: DOMRect) => {
    keyRef.current += 1;
    setExpandLayout(layout);
    setExpandRect(rect);
    setExpandFull(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setExpandFull(true)));
    window.setTimeout(() => {
      setEditorInit({ key: keyRef.current, layout, format: formatForRatio(layout.canvasRatio ?? 1) });
      setView("editor");
      setExpandRect(null);
      setExpandLayout(null);
      setExpandFull(false);
    }, 320);
  }, []);

  const continueDraft = useCallback(() => {
    const d = loadDraft();
    if (!d) return;
    const layout = findLayout(d.layoutId);
    if (!layout) return;
    keyRef.current += 1;
    const cells: GridCellData[] = d.cells.map((c, i) => ({
      id: `cell-${i}`,
      imageUrl: c.imageUrl,
      file: null,
      offsetX: c.offsetX,
      offsetY: c.offsetY,
      scale: c.scale,
      fitMode: c.fitMode ?? "cover",
    }));
    setEditorInit({
      key: keyRef.current,
      layout,
      format: formatForRatio(layout.canvasRatio ?? 1),
      cells,
      textLayers: d.textLayers,
      background: d.background,
    });
    setView("editor");
  }, []);

  const backToLayouts = useCallback(() => {
    setView("layouts");
    setEditorInit(null);
  }, []);

  if (view === "editor" && editorInit) {
    return (
      <GridEditor
        key={editorInit.key}
        layout={editorInit.layout}
        format={editorInit.format}
        onBack={backToLayouts}
        showEmptyOverlay
        initialCells={editorInit.cells}
        initialTextLayers={editorInit.textLayers}
        initialBackground={editorInit.background ?? null}
      />
    );
  }

  return (
    <div className="dark flex min-h-screen flex-col bg-[#0D0B09] text-[#E8E0D5]">
      <header className="sticky top-0 z-20 border-b border-[#242424] bg-[#0D0B09]/95 backdrop-blur-xl">
        <div className="flex h-12 items-center px-4">
          <button
            onClick={onClose}
            className="-ml-2 flex min-h-[44px] min-w-[44px] items-center justify-center text-[#E8E0D5]/50 transition-colors hover:text-[#E8E0D5]"
            aria-label="Close"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <span className="ml-1 font-serif text-lg text-[#E8E0D5]">Grid Builder</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[640px] flex-1 px-5 pb-16 pt-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl italic text-[#E8E0D5]">Choose a layout</h1>
          <p className="mt-2 font-sans text-sm font-light text-[#E8E0D5]/50">
            Build a post, carousel, or story from your shoot.
          </p>
          {draftAvailable && (
            <button
              type="button"
              onClick={continueDraft}
              className="mt-4 font-sans text-[13px] font-light text-[#E8E0D5]/40 transition-opacity hover:opacity-70"
            >
              Continue your last post
            </button>
          )}
        </div>

        <div className={cn("grid grid-cols-2 gap-4 transition-opacity duration-300 sm:grid-cols-3", expandLayout ? "opacity-0" : "opacity-100")}>
          {POST_LAYOUTS.map(({ layout, label, sub }) => (
            <button
              key={layout.id}
              onClick={(e) => openLayout(layout, e.currentTarget.getBoundingClientRect())}
              className="group flex flex-col gap-3 border border-[#242424] bg-[#121212] p-4 transition-colors duration-200 hover:border-[#C8A97E]/50 active:scale-[0.98]"
            >
              <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-[110px]">
                  <LayoutDiagram layout={layout} />
                </div>
              </div>
              <div className="text-left">
                <p className="font-sans text-[13px] font-medium text-[#E8E0D5]">{label}</p>
                <p className="font-sans text-[11px] font-light text-[#E8E0D5]/40">{sub}</p>
              </div>
            </button>
          ))}
        </div>
      </main>

      {expandRect && expandLayout && (
        <div
          className="fixed z-50 overflow-hidden bg-[#121212]"
          style={{
            left: expandFull ? 0 : expandRect.left,
            top: expandFull ? 0 : expandRect.top,
            width: expandFull ? "100vw" : expandRect.width,
            height: expandFull ? "100vh" : expandRect.height,
            border: "1px solid #242424",
            transition: "all 320ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            className="flex h-full w-full items-center justify-center p-6 transition-opacity duration-200"
            style={{ opacity: expandFull ? 0 : 1 }}
          >
            <div className="w-full max-w-[110px]">
              <LayoutDiagram layout={expandLayout} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
