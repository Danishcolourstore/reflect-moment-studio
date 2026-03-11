import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SpreadData {
  spreadIndex: number;
  pages: {
    id: string;
    pageNumber: number;
    bgColor: string;
    layers: any[];
  }[];
}

interface Props {
  albumId: string;
  albumName: string;
  onClose: () => void;
  onSharePreview: () => Promise<string>;
}

export default function AlbumPreviewModal({
  albumId,
  albumName,
  onClose,
  onSharePreview,
}: Props) {
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

      const { data: layers } = await supabase
        .from("album_layers")
        .select("*")
        .in("page_id", pageIds)
        .order("z_index");

      const layersByPage = new Map<string, any[]>();
      (layers || []).forEach((l) => {
        if (!layersByPage.has(l.page_id))
          layersByPage.set(l.page_id, []);
        layersByPage.get(l.page_id)!.push(l);
      });

      const spreadMap = new Map<number, any[]>();
      pages.forEach((p) => {
        if (!spreadMap.has(p.spread_index))
          spreadMap.set(p.spread_index, []);
        spreadMap.get(p.spread_index)!.push({
          id: p.id,
          pageNumber: p.page_number,
          bgColor: p.background_color || "#ffffff",
          layers: layersByPage.get(p.id) || [],
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
      if (e.key === "ArrowRight")
        setCurrent((c) => Math.min(c + 1, spreads.length - 1));
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(c - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [spreads.length, onClose]);

  const spread = spreads[current];

  const renderPhotos = (layers: any[]) => {
    const photos = layers.filter((l) => l.layer_type === "photo");
    if (!photos.length)
      return (
        <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
          Empty
        </div>
      );

    const cols = Math.ceil(Math.sqrt(photos.length));
    const rows = Math.ceil(photos.length / cols);

    return (
      <div
        className="w-full h-full grid gap-[2px]"
        style={{
          gridTemplateColumns: `repeat(${cols},1fr)`,
          gridTemplateRows: `repeat(${rows},1fr)`,
        }}
      >
        {photos.map((p, i) => {
          const s = p.settings_json as Record<string, any> | null;
          const url = s?.imageUrl;
          return url ? (
            <img key={i} src={url} className="w-full h-full object-cover" alt="" />
          ) : (
            <div
              key={i}
              className="w-full h-full bg-white/5 flex items-center justify-center text-white/10 text-[10px]"
            >
              Empty
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
      <div className="h-12 flex items-center justify-between px-4">
        <h2 className="text-white/90 text-sm font-medium">{albumName}</h2>
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs">
            {spreads.length
              ? `Spread ${current + 1} of ${spreads.length}`
              : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white text-xs"
            onClick={onSharePreview}
          >
            <Share2 className="h-3.5 w-3.5 mr-1" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative px-16">
        {loading ? (
          <div className="text-white/50 text-sm animate-pulse">
            Loading preview…
          </div>
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
                {renderPhotos(page.layers)}
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
