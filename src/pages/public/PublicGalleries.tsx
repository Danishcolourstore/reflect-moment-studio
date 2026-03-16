import { useEffect, useState } from "react";
import { useSiteContext } from "@/lib/SiteContext";
import { useSiteProfile } from "@/lib/SiteProfileContext";
import { SiteHead } from "@/components/SiteHead";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicGalleries() {
  const { siteOwnerId } = useSiteContext();
  const [galleries, setGalleries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteOwnerId) return;
    (supabase.from("events").select("id, name, cover_url, event_date, event_type, photo_count")
      .eq("user_id", siteOwnerId).eq("is_published", true).eq("feed_visible", true)
      .order("event_date", { ascending: false }) as any)
      .then(({ data }: any) => { setGalleries(data || []); setLoading(false); });
  }, [siteOwnerId]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl text-[#1A1A1A] text-center mb-12" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Galleries
        </h1>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-72 rounded-lg" />)}
          </div>
        ) : galleries.length === 0 ? (
          <p className="text-center text-[#1A1A1A]/50" style={{ fontFamily: "Inter, sans-serif" }}>No galleries yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map(g => (
              <Link key={g.id} to={`/gallery/${g.id}`} className="group relative aspect-[4/5] rounded-lg overflow-hidden bg-[#E8E0D4]">
                {g.cover_url && <img src={g.cover_url} alt={g.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <h3 className="text-white text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{g.name}</h3>
                  <p className="text-white/60 text-xs" style={{ fontFamily: "Inter, sans-serif" }}>{g.event_type} · {g.photo_count} photos</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
