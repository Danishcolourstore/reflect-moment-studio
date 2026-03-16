import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Layer = {
  id?: string;
  page_id?: string;
  layer_type?: string;
  text_content?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  z_index?: number;
  settings_json?: any;
};

type Page = {
  id: string;
};

interface AlbumPreviewModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  pages?: Page[];
  layers?: Layer[];
}

export default function AlbumPreviewModal({
  open = false,
  onOpenChange = () => {},
  pages = [],
  layers = [],
}: AlbumPreviewModalProps) {
  const getPageLayers = (pageId: string) =>
    layers.filter((l) => l.page_id === pageId).sort((a, b) => (a.z_index || 0) - (b.z_index || 0));

  const renderPhotos = (pageLayers: Layer[]) => {
    const photos = pageLayers.filter((l) => l.layer_type === "photo");

    if (!photos.length) {
      return <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">Empty</div>;
    }

    const firstSettings = photos[0]?.settings_json || {};
    const layout = firstSettings?.layout;

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
            const settings = photo?.settings_json || {};
            const url = settings?.imageUrl;

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
                  <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/10 text-[10px]">
                    Empty
                  </div>
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
        className="w-full h-full grid gap-[2px]"
        style={{
          gridTemplateColumns: `repeat(${cols},1fr)`,
          gridTemplateRows: `repeat(${rows},1fr)`,
        }}
      >
        {photos.map((p, i) => {
          const s = p.settings_json || {};
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

  const renderTextLayers = (pageLayers: Layer[]) => {
    const texts = pageLayers.filter((l) => l.layer_type === "text");

    return texts.map((t) => {
      const settings = t.settings_json || {};

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
            color: settings.color || "#fff",
            fontSize: settings.fontSize || "16px",
            fontFamily: settings.fontFamily || "serif",
          }}
        >
          {t.text_content}
        </div>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] bg-black border-none">
        <div className="w-full h-full overflow-auto flex flex-col gap-8 p-6">
          {pages.map((page) => {
            const pageLayers = getPageLayers(page.id);

            return (
              <div
                key={page.id}
                className="relative bg-neutral-900 shadow-xl mx-auto"
                style={{
                  width: "900px",
                  height: "300px",
                }}
              >
                {renderPhotos(pageLayers)}
                {renderTextLayers(pageLayers)}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
