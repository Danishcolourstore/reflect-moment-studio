import { CheckSquare, Square } from "lucide-react";
import type { MirrorImage } from "../types";
import { StatusBadge } from "./StatusBadge";
import { absoluteAssetUrl } from "../utils";

interface ImageTileProps {
  image: MirrorImage;
  selected: boolean;
  onSelectToggle: (imageId: string) => void;
  onClick: (imageId: string) => void;
}

export function ImageTile({ image, selected, onSelectToggle, onClick }: ImageTileProps) {
  const thumbnail = absoluteAssetUrl(image.previewUrl ?? image.originalUrl);

  return (
    <button
      type="button"
      onClick={() => onClick(image.id)}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#101418] text-left transition hover:border-white/20"
    >
      <img
        src={thumbnail}
        alt={image.filename}
        className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-black/0" />

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onSelectToggle(image.id);
        }}
        className="absolute left-3 top-3 rounded-lg bg-black/40 p-1.5 text-white transition hover:bg-black/60"
        aria-label={selected ? "Deselect image" : "Select image"}
      >
        {selected ? <CheckSquare size={18} /> : <Square size={18} />}
      </button>

      <div className="absolute right-3 top-3">
        <StatusBadge status={image.status} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="line-clamp-1 text-xs font-medium text-white/90">{image.filename}</p>
        <p className="line-clamp-1 text-[11px] text-white/60">{image.category}</p>
      </div>
    </button>
  );
}
