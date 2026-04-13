import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { useGuestFavorites } from "@/hooks/use-guest-favorites";
import { useGuestSession } from "@/hooks/use-guest-session";
import { useInfinitePhotos } from "@/hooks/use-infinite-photos";
import { Heart } from "lucide-react";

/* ───────────────── GRID RENDER (CORE FIX) ───────────────── */

function GridRenderer({ grid }: any) {
  const images: string[] = grid?.images || [];
  const layout = grid?.layout || { cols: 3 };

  if (!images.length) return null;

  return (
    <div className="w-full min-h-screen bg-black p-2">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${layout.cols || 3}, 1fr)`,
        }}
      >
        {images.map((img, index) => (
          <div key={index} className="w-full aspect-square overflow-hidden">
            <img src={img} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────── TYPES ───────────────── */

interface Photo {
  id: string;
  url: string;
}

/* ───────────────── MAIN ───────────────── */

export default function PublicGallery() {
  const { slug } = useParams();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [gridData, setGridData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { sessionId } = useGuestSession(null);
  const { isFavorite, toggleFavorite } = useGuestFavorites(null, sessionId);

  /* ───────────────── FETCH ───────────────── */

  const fetchData = useCallback(async () => {
    if (!slug) return;

    // 🔥 GET EVENT
    const { data: event } = await supabase.from("events").select("*").eq("slug", slug).single();

    if (!event) return;

    // 🔥 GET GRID FIRST (PRIORITY)
    const { data: grid } = await supabase.from("grids").select("*").eq("event_id", event.id).single();

    if (grid?.images?.length > 0) {
      setGridData(grid);
      setLoading(false);
      return; // ⛔ STOP → grid takes over
    }

    // 🔥 FALLBACK → PHOTOS
    const { data: photosData } = await supabase.from("photos").select("id, url").eq("event_id", event.id);

    if (photosData) setPhotos(photosData);

    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ───────────────── LOADING ───────────────── */

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-sm text-gray-400">Loading...</div>;
  }

  /* ───────────────── GRID OVERRIDE ───────────────── */

  if (gridData && gridData.images?.length > 0) {
    return <GridRenderer grid={gridData} />;
  }

  /* ───────────────── NORMAL GALLERY ───────────────── */

  return (
    <div className="p-2 grid grid-cols-2 md:grid-cols-3 gap-2">
      {photos.map((p) => (
        <div key={p.id} className="relative group">
          <ProgressiveImage src={p.url} className="w-full aspect-square object-cover" />

          <button onClick={() => toggleFavorite(p.id)} className="absolute top-2 right-2 bg-black/40 p-2 rounded-full">
            <Heart className="w-4 h-4" style={isFavorite(p.id) ? { fill: "red", color: "red" } : { color: "white" }} />
          </button>
        </div>
      ))}
    </div>
  );
}
