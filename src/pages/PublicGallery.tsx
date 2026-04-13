import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/* ───────────────── GRID RENDER ───────────────── */

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
        {images.map((img, i) => (
          <div key={i} className="aspect-square overflow-hidden">
            <img src={img} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────── TYPES ───────────────── */

interface EventData {
  id: string;
}

/* ───────────────── MAIN ───────────────── */

export default function PublicGallery() {
  const { slug } = useParams();

  const [event, setEvent] = useState<EventData | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [gridData, setGridData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ───────────────── FETCH ───────────────── */

  const fetchData = useCallback(async () => {
    if (!slug) return;

    // EVENT
    const { data: ev } = await supabase.from("events").select("*").eq("slug", slug).single();

    if (!ev) return;

    setEvent(ev);

    // 🔥 FIX: bypass TS type issue using any cast
    const { data: grid } = await (supabase as any).from("grids").select("*").eq("event_id", ev.id).single();

    if (grid && grid.images && grid.images.length > 0) {
      setGridData(grid);
      setLoading(false);
      return;
    }

    // fallback photos
    const { data: photosData } = await supabase.from("photos").select("*").eq("event_id", ev.id);

    setPhotos(photosData || []);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ───────────────── UI ───────────────── */

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  // 🔥 GRID PRIORITY
  if (gridData && gridData.images?.length > 0) {
    return <GridRenderer grid={gridData} />;
  }

  // fallback gallery
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2">
      {photos.map((p, i) => (
        <img key={i} src={p.url} className="w-full aspect-square object-cover" />
      ))}
    </div>
  );
}
