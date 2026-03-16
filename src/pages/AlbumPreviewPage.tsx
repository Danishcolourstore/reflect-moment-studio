import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Page = {
  id: string;
  page_number: number;
};

type Layer = {
  id: string;
  page_id: string;
  layer_type: string;
  text_content?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  z_index?: number;
  settings_json?: any;
};

export default function AlbumPreviewPage() {
  const { shareToken } = useParams();

  const [pages, setPages] = useState<Page[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlbum = async () => {
      if (!shareToken) return;

      const { data: album } = await supabase.from("albums").select("*").eq("share_token", shareToken).single();

      if (!album) {
        setLoading(false);
        return;
      }

      const { data: pagesData } = await supabase
        .from("album_pages")
        .select("*")
        .eq("album_id", album.id)
        .order("page_number", { ascending: true });

      const { data: layersData } = await supabase
        .from("album_layers")
        .select("*")
        .in("page_id", pagesData?.map((p: any) => p.id) || []);

      setPages(pagesData || []);
      setLayers(layersData || []);
      setLoading(false);
    };

    loadAlbum();
  }, [shareToken]);

  const getPageLayers = (pageId: string) =>
    layers.filter((l) => l.page_id === pageId).sort((a, b) => (a.z_index || 0) - (b.z_index || 0));

  const renderPhotos = (pageLayers: Layer[]) => {
    const photos = pageLayers.filter((l) => l.layer_type === "photo");

    if (!photos.length) {
      return <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">Empty</div>;
    }

    const firstSettings = photos[0]?.settings_json || {};
    const layout = firstSettings.layout;

    if (layout && layout.gridCols && layout.gridRows && layout.cells) {
      return (
        <div
          className="w-full h-full grid gap-[2px]"
          style={{
            gridTemplateColumns: `repeat(${layout.gridCols},1fr)`,
            gridTemplateRows: `repeat(${layout.gridRows},1fr)`,
          }}
        >
          {layout.cells.map((cell: any, i: number) => {
            const photo = photos[i];
            const url = photo?.settings_json?.imageUrl;

            return (
              <div
                key={i}
                style={{
                  gridColumn: `${cell.colStart} / ${cell.colEnd}`,
                  gridRow: `${cell.rowStart} / ${cell.rowEnd}`,
                }}
                className="w-full h-full"
              >
                {url ? (
                  <img src={url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full bg-neutral-800" />
                )}
              </div>
            );
          })}
        </div>
      );
    }

    const cols = Math.ceil(Math.sqrt(photos.length));
    const rows = Math.ceil(photos.length / cols);

    return (
      <div
        className="w-full h-full grid"
        style={{
          gridTemplateColumns: `repeat(${cols},1fr)`,
          gridTemplateRows: `repeat(${rows},1fr)`,
        }}
      >
        {photos.map((p, i) => {
          const url = p.settings_json?.imageUrl;

          return <img key={i} src={url} className="w-full h-full object-cover" alt="" />;
        })}
      </div>
    );
  };

  const renderTextLayers = (pageLayers: Layer[]) => {
    const texts = pageLayers.filter((l) => l.layer_type === "text");

    return texts.map((t) => {
      const s = t.settings_json || {};

      return (
        <div
          key={t.id}
          style={{
            position: "absolute",
            left: `${t.x || 0}%`,
            top: `${t.y || 0}%`,
            width: `${t.width || 20}%`,
            height: `${t.height || 10}%`,
            transform: `rotate(${t.rotation || 0}deg)`,
            color: s.color || "#fff",
            fontSize: s.fontSize || "18px",
            fontFamily: s.fontFamily || "serif",
          }}
        >
          {t.text_content}
        </div>
      );
    });
  };

  if (loading) {
    return <div className="w-full h-screen flex items-center justify-center">Loading album...</div>;
  }

  return (
    <div className="bg-black min-h-screen flex flex-col items-center gap-10 py-10">
      {pages.map((page) => {
        const pageLayers = getPageLayers(page.id);

        return (
          <div
            key={page.id}
            className="relative bg-neutral-900 shadow-xl"
            style={{
              width: "1000px",
              height: "350px",
            }}
          >
            {renderPhotos(pageLayers)}
            {renderTextLayers(pageLayers)}
          </div>
        );
      })}
    </div>
  );
}
