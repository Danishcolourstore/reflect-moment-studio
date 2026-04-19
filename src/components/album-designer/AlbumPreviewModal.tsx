import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageLayout {
  gridCols: number;
  gridRows: number;
  cells: [number, number, number, number][];
}

interface PageRenderData {
  id: string;
  pageNumber: number;
  bgColor: string;
  layout: PageLayout | null;
  photos: { url: string; cellIndex: number }[];
}

interface SpreadData {
  spreadIndex: number;
  pages: PageRenderData[];
}

interface Props {
  albumId: string;
  albumName: string;
  onClose: () => void;
  onSharePreview: () => Promise<string>;
}

export default function AlbumPreviewModal({ albumId, albumName, onClose, onSharePreview }: Props) {
  const [spreads, setSpreads] = useState<SpreadData[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: pages } = await supabase
        .from("album_pages")
        .select("id,page_number,spread_index,background_color")
        .eq("album_id", albumId)
        .order("page_number");

      if (!pages) {
        setSpreads([]);
        setLoading(false);
        return;
      }

      const pageIds = pages.map((p) => p.id);

      const { data: layers } = await supabase.from("album_layers").select("*").in("page_id", pageIds).order("z_index");

      const layersByPage = new Map<string, any[]>();
      (layers || []).forEach((l) => {
        if (!layersByPage.has(l.page_id)) layersByPage.set(l.page_id, []);
        layersByPage.get(l.page_id)!.push(l);
      });

      const spreadMap = new Map<number, PageRenderData[]>();
      pages.forEach((p) => {
        if (!spreadMap.has(p.spread_index)) spreadMap.set(p.spread_index, []);

        const pageLayers = layersByPage.get(p.id) || [];
        const photoLayers = pageLayers.filter((l: any) => l.layer_type === "photo");

        // FIX: Extract saved layout from the first photo layer's settings_json
        let layout: PageLayout | null = null;
        if (photoLayers.length > 0) {
          const firstSettings = photoLayers[0]?.settings_json as Record<string, any> | null;
          const savedLayout = firstSettings?.layout;
          if (savedLayout && savedLayout.gridCols && savedLayout.gridRows && savedLayout.cells) {
            layout = {
              gridCols: savedLayout.gridCols,
              gridRows: savedLayout.gridRows,
              cells: savedLayout.cells,
            };
          }
        }

        // Collect all photo URLs with their cell indices
        const photos = photoLayers
          .map((pl: any, i: number) => {
            const s = pl.settings_json as Record<string, any> | null;
            return s?.imageUrl ? { url: s.imageUrl, cellIndex: i } : null;
          })
          .filter(Boolean) as { url: string; cellIndex: number }[];

        spreadMap.get(p.spread_index)!.push({
          id: p.id,
          pageNumber: p.page_number,
          bgColor: p.background_color || "#ffffff",
          layout,
          photos,
        });
      });

      const result: SpreadData[] = Array.from(spreadMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([index, pages]) => ({ spreadIndex: index, pages }));

      setSpreads(result);
      setLoading(false);
    };

    load();
  }, [albumId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent((c) => Math.min(c + 1, spreads.length - 1));
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(c - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [spreads.length, onClose]);

  const spread = spreads[current];

  // FIX: Render page using saved layout grid instead of naive sqrt grid
  const renderPage = (page: PageRenderData) => {
    if (page.photos.length === 0) {
      return <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">Empty</div>;
    }

    // Use saved layout if available
    if (page.layout && page.layout.cells.length > 0) {
      return (
        <div
          className="w-full h-full"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${page.layout.gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${page.layout.gridRows}, 1fr)`,
            gap: "2px",
          }}
        >
          {page.layout.cells.map((area, i) => {
            const photo = page.photos.find((p) => p.cellIndex === i);
            const url = photo?.url || page.photos[i]?.url;
            return url ? (
              <img
                key={i}
                src={url}
                className="w-full h-full object-cover"
                style={{
                  gridArea: `${area[0]} / ${area[1]} / ${area[2]} / ${area[3]}`,
                }}
                alt=""
              />
            ) : (
              <div
                key={i}
                className="w-full h-full bg-white/5 flex items-center justify-center text-white/10 text-[10px]"
                style={{
                  gridArea: `${area[0]} / ${area[1]} / ${area[2]} / ${area[3]}`,
                }}
              >
                Empty
              </div>
            );
          })}
        </div>
      );
    }

    // Fallback: naive grid (only if no layout saved)
    const cols = Math.ceil(Math.sqrt(page.photos.length));
    const rows = Math.ceil(page.photos.length / cols);

    return (
      <div
        className="w-full h-full grid gap-[2px]"
        style={{
          gridTemplateColumns: `repeat(${cols},1fr)`,
          gridTemplateRows: `repeat(${rows},1fr)`,
        }}
      >
        {page.photos.map((p, i) => (
          <img key={i} src={p.url} className="w-full h-full object-cover" alt="" />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
      <div className="h-12 flex items-center justify-between px-4">
        <h2 className="text-white/90 text-sm font-medium">{albumName}</h2>
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs">
            {spreads.length ? `Spread ${current + 1} of ${spreads.length}` : ""}
          </span>
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white text-xs" onClick={onSharePreview}>
            <Share2 className="h-3.5 w-3.5 mr-1" />
            Share
          </Button>
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative px-16">
        {loading ? (
          <div className="text-white/50 text-sm skeleton-block">Loading preview…</div>
        ) : spread ? (
          <div className="flex gap-1 max-w-[80vw] max-h-[80vh]">
            {spread.pages.map((page) => (
              <div
                key={page.id}
                className="aspect-square relative rounded-sm overflow-hidden"
                style={{
                  background: page.bgColor,
                  width: spread.pages.length > 1 ? "40vw" : "50vw",
                }}
              >
                {renderPage(page)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-white/50 text-sm">No pages to preview</div>
        )}

        {current > 0 && (
          <button
            onClick={() => setCurrent((c) => c - 1)}
            className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {current < spreads.length - 1 && (
          <button
            onClick={() => setCurrent((c) => c + 1)}
            className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}
